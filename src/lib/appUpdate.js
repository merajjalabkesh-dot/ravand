// ============================================================
//  src/lib/appUpdate.js
// ------------------------------------------------------------
//  منطق «به‌روزرسانی اپ» — کاملاً جدا از UI.
//  یک بار چک می‌کند، نتیجهٔ امن و پاک‌شده برمی‌گرداند، و
//  UpdateBanner آن را نشان می‌دهد.
//
//  امنیت: هیچ محتوای ریموتی هرگز اجرا نمی‌شود. فقط چند مقدار متنی و
//  دو URL که با میزبان GitHub Releases تطبیق داده شده‌اند پذیرفته می‌شوند.
// ============================================================

// نسخهٔ در حال اجرا:
//   - در Electron، preload نسخهٔ واقعی را از app.getVersion() می‌دهد.
//   - وگرنه از بیلد تزریق می‌شود (vite define -> VITE_APP_VERSION از package.json).
export const RUNNING_VERSION =
  (typeof window !== 'undefined' && window.ravandApp && window.ravandApp.version) ||
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_APP_VERSION) ||
  '0.0.0'

// فقط همین میزبان‌ها برای لینک دانلود مجازند: GitHub و فایل‌های ریلیز آن
// (GitHub بعد از ریلیز به objects.githubusercontent.com ریدایرکت می‌کند).
const GITHUB_RE = /^https:\/\/(github\.com|[a-z0-9-]+\.githubusercontent\.com)(\/|$)/i

const DISMISS_KEY = 'rg_update_dismissed_v1'
const API_BASE = ((typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_API_URL) ||
  'https://ravand-production.up.railway.app')

/** پلتفرم در حال اجرا: tauri | electron | android | ios | native | web */
export function runtimePlatform() {
  const w = (typeof window !== 'undefined') ? window : {}
  if (w.__TAURI_INTERNALS__ || w.__TAURI__ || (typeof location !== 'undefined' && location.hostname === 'tauri.localhost')) return 'tauri'
  if (w.ravandApp && w.ravandApp.isElectron) return 'electron'
  if (w.Capacitor && typeof w.Capacitor.getPlatform === 'function') {
    const p = w.Capacitor.getPlatform()
    if (p === 'android') return 'android'
    if (p === 'ios') return 'ios'
  }
  if (w.__IS_NATIVE_APP__) return 'native'
  return 'web'
}

/* ---------- پاک‌سازی/اعتبارسنجی دادهٔ ریموتی ---------- */

function cleanVersion(v) {
  if (typeof v !== 'string') return ''
  const s = v.trim().slice(0, 32)
  return /^\d+(\.\d+){1,3}(-[0-9A-Za-z.]+)?$/.test(s) ? s : ''
}

function cleanUrl(u) {
  if (typeof u !== 'string') return ''
  const s = u.trim()
  if (!s || s.length > 300) return ''
  return GITHUB_RE.test(s) ? s : ''
}

function cleanNotes(n) {
  return typeof n === 'string' ? n.slice(0, 500) : ''
}

/** «1.2.0» -> [1,2,0] */
function parseVersion(v) {
  const core = String(v || '').split('-')[0]
  const parts = core.split('.').map((x) => parseInt(x, 10) || 0)
  while (parts.length < 3) parts.push(0)
  return parts.slice(0, 3)
}

/** آیا نسخهٔ ریموت از نسخهٔ محلی جدیدتر است؟ */
export function isNewer(remote, local) {
  const a = parseVersion(remote)
  const b = parseVersion(local)
  for (let i = 0; i < 3; i++) {
    if (a[i] > b[i]) return true
    if (a[i] < b[i]) return false
  }
  return false
}

/* ---------- واکشی فایل نسخه ---------- */

/** آدرس فایل استاتیک کنار اپ (روی Cloudflare یا داخل بستهٔ apk).
 *  در Electron بسته از file:// لود می‌شود که fetch پشتیبانی نمی‌کند؛ رد می‌شود. */
function staticVersionUrl() {
  if (typeof document === 'undefined' || !document.baseURI) return ''
  try {
    const u = new URL('app-version.json', document.baseURI)
    if (u.protocol === 'file:') return ''
    return u.href
  } catch { return '' }
}

/** اطلاعات نسخه را از بک‌اند، و در صورت خطا از فایل استاتیک می‌خواند. */
export async function fetchVersionInfo() {
  const urls = []
  try { urls.push(API_BASE.replace(/\/+$/, '') + '/api/app-version') } catch { /* بی‌خیال */ }
  const s = staticVersionUrl()
  if (s) urls.push(s)

  for (const url of urls) {
    try {
      const r = await fetch(url, { cache: 'no-store', headers: { Accept: 'application/json' } })
      if (!r.ok) continue
      const data = await r.json()
      const version = cleanVersion(data && data.version)
      if (!version) continue
      return {
        version,
        notes: cleanNotes(data.notes),
        mandatory: data.mandatory === true,
        apkUrl: cleanUrl(data.apkUrl),
        exeUrl: cleanUrl(data.exeUrl),
      }
    } catch { /* برو سراغ آدرس بعدی */ }
  }
  return null
}

/* ---------- چک و اقدام ---------- */

function urlForPlatform(platform, info) {
  if (platform === 'electron' || platform === 'tauri' || platform === 'native') return info.exeUrl
  if (platform === 'android') return info.apkUrl
  return ''
}

export function isDismissed(version) {
  try { return localStorage.getItem(DISMISS_KEY) === version } catch { return false }
}

export function dismissVersion(version) {
  try { localStorage.setItem(DISMISS_KEY, String(version)) } catch { /* بی‌خیال */ }
}

/**
 * یک بار چک می‌کند. اگر نسخهٔ جدیدی بود و کاربر «بعداً» را نزده بود،
 * یک شیء می‌دهد؛ وگرنه null.
 *   { version, notes, mandatory, platform, running, url }
 */
export async function checkForUpdate() {
  const platform = runtimePlatform()
  if (platform === 'web') return null
  const info = await fetchVersionInfo()
  if (!info) return null
  if (!isNewer(info.version, RUNNING_VERSION)) return null
  return {
    version: info.version,
    notes: info.notes,
    mandatory: info.mandatory,
    platform,
    running: RUNNING_VERSION,
    url: urlForPlatform(platform, info),
  }
}

/**
 * شنود به رویدادهای پیشرفت دانلود درون‌برنامه‌ای:
 * - رویداد CustomEvent تحت نام 'app-update-progress' روی window
 * - سیستم رویداد بومی توری (Tauri event listener)
 * @param {(data: { stage?: string, percent?: number, downloaded?: number, total?: number, error?: string }) => void} callback
 * @returns {() => void} تابع لغو اشتراک (unlisten)
 */
export function subscribeUpdateProgress(callback) {
  if (typeof window === 'undefined' || typeof callback !== 'function') return () => {}

  const domListener = (e) => {
    if (e && e.detail) callback(e.detail)
  }
  window.addEventListener('app-update-progress', domListener)

  let unlistenTauri = null
  const w = window
  try {
    if (w.__TAURI_INTERNALS__ && typeof w.__TAURI_INTERNALS__.listen === 'function') {
      const p = w.__TAURI_INTERNALS__.listen('app-update-progress', (event) => {
        if (event && event.payload) callback(event.payload)
      })
      if (p && typeof p.then === 'function') {
        p.then((fn) => { unlistenTauri = fn }).catch(() => {})
      }
    } else if (w.__TAURI__ && w.__TAURI__.event && typeof w.__TAURI__.event.listen === 'function') {
      const p = w.__TAURI__.event.listen('app-update-progress', (event) => {
        if (event && event.payload) callback(event.payload)
      })
      if (p && typeof p.then === 'function') {
        p.then((fn) => { unlistenTauri = fn }).catch(() => {})
      }
    }
  } catch {
    /* نادیده‌گیری خطای محیط غیرتوری */
  }

  return () => {
    window.removeEventListener('app-update-progress', domListener)
    if (typeof unlistenTauri === 'function') {
      try { unlistenTauri() } catch {}
    }
  }
}

/**
 * اقدام به‌روزرسانی:
 *   - web:      ریلود ساده (سرویس‌ورکر دارایی‌های تازه را می‌آورد)
 *   - tauri:    شروع دانلود درون‌برنامه‌ای با دستور بومی start_in_app_update (با فالبک به open_in_browser)
 *   - android:  شروع دانلود درون‌برنامه‌ای در Capacitor / Native (با فالبک به باز کردن لینک)
 *   - electron: شروع دانلود درون‌برنامه‌ای یا باز کردن لینک
 * @returns {Promise<boolean>|boolean} آیا شروع شد
 */
export async function openUpdate(res) {
  if (!res) return false

  if (res.platform === 'web') {
    try { location.reload(); return true } catch { return false }
  }

  const w = (typeof window !== 'undefined') ? window : {}
  const safeUrl = cleanUrl(res.url)

  // اولویت نخست در توری دسکتاپ: دستور دانلود و به‌روزرسانی درون‌برنامه‌ای
  if ((res.platform === 'tauri' || w.__TAURI_INTERNALS__) && safeUrl) {
    const invoke = (w.__TAURI_INTERNALS__ && typeof w.__TAURI_INTERNALS__.invoke === 'function')
      ? w.__TAURI_INTERNALS__.invoke.bind(w.__TAURI_INTERNALS__)
      : (w.__TAURI__ && w.__TAURI__.core && typeof w.__TAURI__.core.invoke === 'function')
      ? w.__TAURI__.core.invoke.bind(w.__TAURI__.core)
      : null

    if (invoke) {
      try {
        await invoke('download_and_apply_update', { url: safeUrl })
        return true
      } catch {
        try {
          await invoke('start_in_app_update', { url: safeUrl })
          return true
        } catch {
          // در صورت آماده نبودن هندلر بومی درون‌برنامه‌ای، فالبک به باز کردن مرورگر بومی
          try {
            await invoke('open_in_browser', { url: safeUrl })
            return true
          } catch { /* ادامه به فالبک وب */ }
        }
      }
    }
  }

  // اولویت نخست در اندروید (Capacitor): دانلود درون‌برنامه‌ای
  if (res.platform === 'android' && safeUrl) {
    try {
      if (w.Capacitor && w.Capacitor.Plugins && w.Capacitor.Plugins.AppUpdate && typeof w.Capacitor.Plugins.AppUpdate.startUpdate === 'function') {
        await w.Capacitor.Plugins.AppUpdate.startUpdate({ url: safeUrl })
        return true
      }
    } catch { /* ادامه به فالبک باز کردن مرورگر */ }
  }

  // پلتفرم Electron: متد اختصاصی در صورت وجود
  if (res.platform === 'electron' && w.ravandApp && safeUrl) {
    if (typeof w.ravandApp.startInAppUpdate === 'function') {
      try { await w.ravandApp.startInAppUpdate(safeUrl); return true } catch { /* ادامه */ }
    }
    if (typeof w.ravandApp.openExternal === 'function') {
      try { w.ravandApp.openExternal(safeUrl); return true } catch { /* ادامه */ }
    }
  }

  // فالبک عمومی باز کردن در مرورگر
  if (safeUrl) {
    try {
      const win = window.open(safeUrl, '_blank', 'noopener,noreferrer')
      if (win) return true
    } catch { /* ادامه بده */ }
    try {
      const a = document.createElement('a')
      a.href = safeUrl
      a.target = '_blank'
      a.rel = 'noopener noreferrer'
      document.body.appendChild(a)
      a.click()
      a.remove()
      return true
    } catch { /* هیچ */ }
  }
  return false
}
