import React, { createContext, useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react'
import { THEMES, THEME_VARS, DEFAULT_THEME } from '../config/themes'
import { api, setToken, clearToken } from './apiClient'

const Ctx = createContext(null)
export const useApp = () => useContext(Ctx)

/* ---------- utils ---------- */
export const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
const pad = (n) => String(n).padStart(2, '0')
export const todayISO = () => {
  const d = new Date()
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}
export const isoAddDays = (iso, n) => {
  const p = iso.split('-').map(Number)
  const dt = new Date(p[0], p[1] - 1, p[2] + n)
  return dt.getFullYear() + '-' + pad(dt.getMonth() + 1) + '-' + pad(dt.getDate())
}

/* زبان فعال — تابع‌های ماژولی به کانتکست دسترسی ندارند، پس از همین متغیر می‌خوانند.
   I18nProvider هر بار زبان عوض می‌شود این را به‌روز می‌کند. */
let activeLang = 'fa'
export const setActiveLang = (l) => { activeLang = (l === 'en') ? 'en' : 'fa' }
export const getActiveLang = () => activeLang

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹'
/** عدد را با رقم مناسب زبان فعال برمی‌گرداند: فارسی -> ۱۲۳، انگلیسی -> 123 */
export const num = (n) => {
  const s = String(n === undefined || n === null ? '' : n)
  return activeLang === 'en' ? s : s.replace(/[0-9]/g, (d) => FA_DIGITS[+d])
}
/** نام مستعار قدیمی — حالا با زبان فعال هماهنگ است */
export const toFa = num

const JWEEK = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']
const JWEEK_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const weekdayName = (jw) => ((activeLang === 'en' ? JWEEK_EN : JWEEK)[jw] || '')
const JMONTH = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
export function g2j(gy, gm, gd) {
  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  const gy2 = gm > 2 ? gy + 1 : gy
  let days = 355666 + 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + gdm[gm - 1]
  let jy = -1595 + 33 * Math.floor(days / 12053)
  days %= 12053
  jy += 4 * Math.floor(days / 1461)
  days %= 1461
  if (days > 365) { jy += Math.floor((days - 1) / 365); days = (days - 1) % 365 }
  let jm, jd
  if (days < 186) { jm = 1 + Math.floor(days / 31); jd = 1 + (days % 31) }
  else { jm = 7 + Math.floor((days - 186) / 30); jd = 1 + ((days - 186) % 30) }
  return { jy, jm, jd }
}
export function jalaliOf(iso) {
  const p = iso.split('-').map(Number)
  const j = g2j(p[0], p[1], p[2])
  const dt = new Date(p[0], p[1] - 1, p[2])
  return { ...j, jw: dt.getDay() }
}
export function j2g(jy, jm, jd) {
  jy += 1595
  let days = -355668 + (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186)
  let gy = 400 * Math.floor(days / 146097)
  days %= 146097
  if (days > 36524) { gy += 100 * Math.floor(--days / 36524); days %= 36524; if (days >= 365) days++ }
  gy += 4 * Math.floor(days / 1461)
  days %= 1461
  if (days > 365) { gy += Math.floor((days - 1) / 365); days = (days - 1) % 365 }
  let gd = days + 1
  const leap = (gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)
  const sal = [0, 31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let gm
  for (gm = 1; gm <= 12 && gd > sal[gm]; gm++) gd -= sal[gm]
  return { gy, gm, gd }
}
export const jalaliToISO = (jy, jm, jd) => { const g = j2g(jy, jm, jd); return g.gy + '-' + pad(g.gm) + '-' + pad(g.gd) }
export function jalaliMonthLen(jy, jm) { if (jm <= 6) return 31; if (jm <= 11) return 30; return isLeapJalali(jy) ? 30 : 29 }
export function isLeapJalali(jy) { const g = j2g(jy + 1, 1, 1); const g2 = j2g(jy, 1, 1); return (new Date(g.gy, g.gm - 1, g.gd) - new Date(g2.gy, g2.gm - 1, g2.gd)) / 86400000 === 366 }
export const JMONTH_NAMES = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']
/** نام ماه‌ها با زبان فعال — در انگلیسی معادل میلادی همان ماه برگردانده می‌شود */
const JMONTH_NAMES_EN = ['March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December', 'January', 'February']
export const monthName = (jm) => ((activeLang === 'en' ? JMONTH_NAMES_EN : JMONTH_NAMES)[jm - 1] || '')
export const faDate = (iso, withWeekday) => {
  const { jy, jm, jd, jw } = jalaliOf(iso)
  const base = num(jd) + ' ' + monthName(jm) + ' ' + num(jy)
  if (activeLang === 'en') return withWeekday ? weekdayName(jw) + ', ' + base : base
  return withWeekday ? weekdayName(jw) + '، ' + base : base
}
export const faMonth = (jy, jm) => monthName(jm) + ' ' + num(jy)
export const nowFaHM = () => { const d = new Date(); return num(pad(d.getHours())) + ':' + num(pad(d.getMinutes())) }
export function phaseOfHour(h) {
  const en = activeLang === 'en'
  if (h >= 3 && h < 6) return { name: en ? 'Dawn' : 'سحر', day: false }
  if (h >= 6 && h < 11) return { name: en ? 'Morning' : 'صبح', day: true }
  if (h >= 11 && h < 14) return { name: en ? 'Midday' : 'ظهر', day: true }
  if (h >= 14 && h < 18) return { name: en ? 'Afternoon' : 'عصر', day: true }
  if (h >= 18 && h < 20) return { name: en ? 'Evening' : 'شام', day: true }
  return { name: en ? 'Night' : 'شب', day: false }
}

/* sleep/wake */
export const minOf = (t) => { const p = String(t || '').split(':'); return p.length === 2 ? +p[0] * 60 + (+p[1]) : 0 }
export const fmtMin = (m) => { m = ((m % 1440) + 1440) % 1440; return toFa(pad(Math.floor(m / 60))) + ':' + toFa(pad(m % 60)) }
const sleepNorm = (m) => (m < 12 * 60 ? m + 1440 : m)

/* ---------- events ---------- */
// Event shape: { id, name, date, recurring }
//   recurring true  → date = "MM-DD"  (annual, e.g. birthday)
//   recurring false → date = "YYYY-MM-DD" (one-time, e.g. an exam)
// nextEventISO returns the next ISO date this event occurs on (handles year boundary).
export function nextEventISO(ev) {
  if (!ev) return null
  if (!ev.recurring) {
    // one-time — only valid if not entirely in the past
    const d = new Date(String(ev.date) + 'T00:00:00')
    if (isNaN(d.getTime())) return null
    if (d < new Date()) return null
    return ev.date
  }
  const mm = String(ev.date).slice(0, 2)
  const dd = String(ev.date).slice(3, 5)
  if (!mm || !dd) return null
  const now = new Date()
  const y = now.getFullYear()
  const mk = (yy) => new Date(Date.UTC(yy, +mm - 1, +dd))
  let t = mk(y)
  if (t < new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))) t = mk(y + 1)
  return t.toISOString().slice(0, 10)
}
export function eventLabel(ev) {
  const dateStr = String(ev.date)
  if (!ev.recurring) return faDate(dateStr, false)
  const mm = +dateStr.slice(0, 2), dd = +dateStr.slice(3, 5)
  const now = new Date()
  const j = g2j(now.getFullYear(), mm, dd)
  return (activeLang === 'en'
    ? 'Every year on ' + num(j.jd) + ' ' + monthName(j.jm)
    : 'هر سال ' + num(j.jd) + ' ' + monthName(j.jm))
}
export function countdownOf(isoStr) {
  const target = new Date(isoStr + 'T00:00:00')
  const now = new Date()
  const diff = target - new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()))
  if (diff <= 0) return { days: 0, hours: 0, minutes: 0, isToday: true, isPast: false }
  const days = Math.floor(diff / 86400000)
  const hours = Math.floor((diff % 86400000) / 3600000)
  const minutes = Math.floor((diff % 3600000) / 60000)
  return { days, hours, minutes, isToday: days === 0, isPast: false }
}
export function formatCountdown(isoStr) {
  const c = countdownOf(isoStr)
  const en = activeLang === 'en'
  if (c.isToday) return en ? 'Today 🎉' : 'امروز 🎉'
  if (c.days > 0) return en ? num(c.days) + ' days left' : num(c.days) + ' روز مانده'
  if (c.hours > 0) return en
    ? num(c.hours) + 'h ' + num(c.minutes) + 'm left'
    : num(c.hours) + ' ساعت و ' + num(c.minutes) + ' دقیقه مانده'
  return en ? num(c.minutes) + 'm left' : num(c.minutes) + ' دقیقه مانده'
}
export function eventIcon(name) {
  const n = String(name || '').trim().toLowerCase()
  if (/\b(تولد|زاد|میلاد)\b/.test(n)) return '🎂'
  if (/\b(ازدواج|سالیانه|wedding|anniversary)\b/.test(n)) return '💍'
  if (/\b(نوروز|سال نو)\b/.test(n)) return '🌸'
  if (/\b(رمضان|عید|قربان|محرم|فطر)\b/.test(n)) return '🌙'
  if (/\b(امتحان|کنکور|آزمون)\b/.test(n)) return '📚'
  return '📅'
}

export const MOOD_WORDS = ['', 'بی‌حال', 'کسل', 'معمولی', 'خوب', 'عالی']
const MOOD_WORDS_EN = ['', 'Drained', 'Lazy', 'So-so', 'Good', 'Great']
/** واژهٔ حس با زبان فعال (۱ تا ۵) */
export const moodWord = (level) => ((activeLang === 'en' ? MOOD_WORDS_EN : MOOD_WORDS)[level] || '')
export const MOOD_COLORS = ['', '#f87171', '#fb923c', '#fbbf24', '#4ade80', '#38bdf8']
const MOOD_COLORS_F = MOOD_COLORS
export function moodFace(level, size) {
  size = size || 22
  const lv = Math.max(1, Math.min(5, level || 1))
  const c = MOOD_COLORS_F[lv]
  let mouth, eyes, extras = ''
  if (lv >= 5) {
    eyes = '<path d="M6.6 10.6 q1.9 -2.6 3.8 0 M13.6 10.6 q1.9 -2.6 3.8 0" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>'
    mouth = '<path d="M8 14.4 q4 4.8 8 0 z" fill="#fff"/>'
    extras = '<ellipse cx="6.4" cy="14.6" rx="1.7" ry="1.1" fill="rgba(255,255,255,.4)"/><ellipse cx="17.6" cy="14.6" rx="1.7" ry="1.1" fill="rgba(255,255,255,.4)"/>'
  } else if (lv === 4) {
    eyes = '<circle cx="8.6" cy="9.8" r="1.5" fill="#fff"/><circle cx="15.4" cy="9.8" r="1.5" fill="#fff"/>'
    mouth = '<path d="M8.6 14.8 q3.4 3.2 6.8 0" stroke="#fff" stroke-width="1.7" fill="none" stroke-linecap="round"/>'
    extras = '<ellipse cx="6.6" cy="14.4" rx="1.5" ry="1" fill="rgba(255,255,255,.35)"/><ellipse cx="17.4" cy="14.4" rx="1.5" ry="1" fill="rgba(255,255,255,.35)"/>'
  } else if (lv === 3) {
    eyes = '<circle cx="8.6" cy="10" r="1.5" fill="#fff"/><circle cx="15.4" cy="10" r="1.5" fill="#fff"/>'
    mouth = '<path d="M9 15.6 h6" stroke="#fff" stroke-width="1.7" fill="none" stroke-linecap="round"/>'
  } else if (lv === 2) {
    eyes = '<circle cx="8.6" cy="10.2" r="1.4" fill="#fff"/><circle cx="15.4" cy="10.2" r="1.4" fill="#fff"/>'
    mouth = '<path d="M9 16.4 q3 -2.6 6 0" stroke="#fff" stroke-width="1.7" fill="none" stroke-linecap="round"/>'
    extras = '<path d="M6.7 7.8 L10.6 8.8 M17.3 7.8 L13.4 8.8" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round"/>'
  } else {
    eyes = '<circle cx="8.6" cy="10.4" r="1.4" fill="#fff"/><circle cx="15.4" cy="10.4" r="1.4" fill="#fff"/>'
    mouth = '<path d="M8.6 16.8 q3.4 -3.6 6.8 0" stroke="#fff" stroke-width="1.7" fill="none" stroke-linecap="round"/>'
    extras = '<path d="M6.6 8.6 L10.6 7.4 M17.4 8.6 L13.4 7.4" stroke="#fff" stroke-width="1.3" fill="none" stroke-linecap="round"/><path d="M16.6 13 q1.5 2.2 0 3 q-1.5 -.8 0 -3z" fill="rgba(255,255,255,.85)"/>'
  }
  return '<svg width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none">'
    + '<circle cx="12" cy="12" r="10.4" fill="' + c + '" stroke="rgba(0,0,0,.16)" stroke-width=".7"/>'
    + extras + eyes + mouth + '</svg>'
}
/* عادت آیا در این روزِ هفته برنامه‌ریزی شده؟ bad همیشه، good با روزهای خالی
   همیشه. مبنای همهٔ محاسبات درصد/استریک در Home، Today و Reports. */
export function isScheduled(h, iso) {
  if (h.type === 'bad') return true
  const d = h.days || []
  if (!d.length) return true
  return d.includes(new Date(iso.split('-').map(Number)).getDay())
}

const DEFAULT_DB = {
  user: null,
  habits: [],
  events: [],
  days: {},
  settings: {
    accent: '#8b5cf6', theme: DEFAULT_THEME, fontScale: 1, sound: true, notify: false,
    wakeGoal: '06:00', sleepGoal: '22:30', planStart: null,
    wakeNotify: true, curWake: null, curSleep: null
  }
}
export const ACCENTS = {
  purple: '#8b5cf6', teal: '#0ea5a4', sakura: '#ec7197', ocean: '#3b82f6', amber: '#f59e0b', emerald: '#10b981'
}

const safeParse = (s) => { try { return JSON.parse(s) || {} } catch (e) { return {} } }
const safeStore = (() => {
  try { const t = '__t'; localStorage.setItem(t, '1'); localStorage.removeItem(t); return localStorage }
  catch (e) { const m = {}; return { getItem: (k) => (k in m ? m[k] : null), setItem: (k, v) => { m[k] = String(v) }, removeItem: (k) => { delete m[k] } } }
})()

export function hexToRgba(hex, a) {
  const n = parseInt(hex.slice(1), 16)
  return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'
}

/* ---------- sound + notifications ---------- */
let audioCtx = null
export function playTick() {
  try {
    const AC = window.AudioContext || window.webkitAudioContext
    if (!AC) return
    if (!audioCtx) audioCtx = new AC()
    if (audioCtx.state === 'suspended') audioCtx.resume()
    const t = audioCtx.currentTime
    const osc = audioCtx.createOscillator()
    const g = audioCtx.createGain()
    osc.type = 'sine'
    osc.frequency.value = 760
    g.gain.setValueAtTime(0.0001, t)
    g.gain.exponentialRampToValueAtTime(0.1, t + 0.012)
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.13)
    osc.connect(g)
    g.connect(audioCtx.destination)
    osc.start(t)
    osc.stop(t + 0.15)
  } catch (e) { /* audio unavailable */ }
}
export const notifySupported = () => typeof window !== 'undefined' && 'Notification' in window
export const notifyPermission = () => (notifySupported() ? Notification.permission : 'denied')
export async function requestNotifyPermission() {
  if (!notifySupported()) return 'denied'
  if (Notification.permission === 'granted') return 'granted'
  try { return await Notification.requestPermission() } catch (e) { return 'denied' }
}
export function browserNotify(title, body, opts) {
  try {
    if (!notifySupported() || Notification.permission !== 'granted') return false
    const n = new Notification(title, { body, tag: (opts && opts.tag) || 'rg' })
    setTimeout(() => n.close(), 8000)
    return true
  } catch (e) { return false }
}
export function clearWakeNotified() {
  try { safeStore.removeItem('rg_wake_notified') } catch (e) { /* ignore */ }
}

/* ---------- Provider ---------- */
export function AppProvider({ children }) {
  const [db, setDb] = useState(() => {
    const init = Object.assign({}, DEFAULT_DB, safeParse(safeStore.getItem('rg_data_v2') || '{}'))
    if (!init.settings) init.settings = DEFAULT_DB.settings
    init.settings = Object.assign({}, DEFAULT_DB.settings, init.settings)
    return init
  })
  const [toastMsg, setToastMsg] = useState(null)
  const [authUser, setAuthUser] = useState(null)
  const [authReady, setAuthReady] = useState(false)

  const persist = (data) => { try { safeStore.setItem('rg_data_v2', JSON.stringify(data)) } catch (e) { /* storage locked — continue in-memory */ } }
  const hasToken = () => { try { return !!localStorage.getItem('rg_token') } catch { return false } }
  // ذخیرهٔ محلی فوری است (تا رفرش داده از دست نرود)، ولی نوشتن روی سرور
  // با تأخیرِ کوتاه دسته‌بندی می‌شود: هر تیکِ عادت قبلاً یک PUT کامل به
  // /api/data می‌زد؛ حالا چند تغییر سریع در یک درخواست جمع می‌شوند.
  const pushTimer = useRef(null)
  const pushLatest = useRef(null)
  const flushPush = useCallback(() => {
    if (pushTimer.current) { clearTimeout(pushTimer.current); pushTimer.current = null }
    const data = pushLatest.current
    pushLatest.current = null
    if (!data || !hasToken()) return
    api.saveData(data).then((r) => {
      if (r && r.error) console.warn('[sync] push failed:', r.error)
    }).catch((e) => console.warn('[sync] push EXCEPTION:', e && e.message))
  }, [])
  const pushDb = useCallback((data) => {
    pushLatest.current = data
    if (pushTimer.current) clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(flushPush, 700)
  }, [flushPush])
  const save = useCallback((next) => { setDb(next); persist(next); pushDb(next) }, [pushDb])
  // کپی عمیق لازم است: mutatorها همه‌جا با فرضِ «نسخهٔ تازه» نوشته شده‌اند و
  // درجا تغییر می‌دهند (push/splice/delete/toggle روی زیرآبجکت‌های مشترک).
  // با کپی سطحی، همان رفرنسِ قبلی تغییر می‌کرد و چون StrictMode در حالت
  // توسعه updater را دو بار اجرا می‌کند، این تغییرات دو بار اعمال می‌شدند
  // (دو تیک، دو append، جابه‌جایی دوباره). کپی سطحی اینجا برد محسوسی هم
  // ندارد؛ بهینه‌سازی واقعی، debounce نوشتن سرور است که پایین‌تر انجام شده.
  const mutate = useCallback((fn) => {
    setDb((prev) => {
      const next = JSON.parse(JSON.stringify(prev))
      fn(next)
      persist(next)
      pushDb(next)
      return next
    })
  }, [pushDb])

  const toast = useCallback((msg) => { setToastMsg(msg); setTimeout(() => setToastMsg(null), 2200) }, [])

  /* اگر کاربر صفحه را ببندد و آخرین تغییر هنوز روی سرور نرفته باشد،
     در لحظهٔ خروج فوراً می‌فرستیم تا داده گم نشود. */
  useEffect(() => {
    const flush = () => flushPush()
    window.addEventListener('beforeunload', flush)
    document.addEventListener('visibilitychange', flush)
    return () => {
      window.removeEventListener('beforeunload', flush)
      document.removeEventListener('visibilitychange', flush)
    }
  }, [flushPush])

  /* theme */
  useEffect(() => {
    const root = document.documentElement
    const tid = db.settings.theme || DEFAULT_THEME
    const t = THEMES.find((x) => x.id === tid) || THEMES[0]
    // apply every theme var
    root.style.setProperty('--bg', t.bg)
    root.style.setProperty('--bg-2', t.bg2)
    root.style.setProperty('--glass', t.glass)
    root.style.setProperty('--glass-border', t.glassBorder)
    root.style.setProperty('--glass-hover', t.mode === 'light' ? 'rgba(255,255,255,.72)' : 'rgba(255,255,255,.09)')
    root.style.setProperty('--sidebar-bg', t.mode === 'light' ? 'rgba(255,255,255,.72)' : 'rgba(20,22,36,.9)')
    // در تم روشن، خطوط سفید نیمه‌شفاف و متن «#fff» روی پس‌زمینهٔ کرم
    // یا صورتی نامرئی می‌شوند. این دو متغیر برای همان موارد است و با
    // تعویض تم عوض می‌شوند.
    root.style.setProperty('--hairline', t.mode === 'light' ? 'rgba(27,32,48,.10)' : 'rgba(255,255,255,.06)')
    root.style.setProperty('--ring-track', t.mode === 'light' ? 'rgba(27,32,48,.34)' : 'rgba(255,255,255,.14)')
    root.style.setProperty('--surface', t.mode === 'light' ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.04)')
    root.style.setProperty('--surface-hover', t.mode === 'light' ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,.07)')
    root.style.setProperty('--on-accent', t.mode === 'light' ? '#ffffff' : '#fff')
    root.style.setProperty('--ink', t.ink)
    root.style.setProperty('--ink-mid', t.inkMid)
    root.style.setProperty('--muted', t.muted)
    root.style.setProperty('--accent', t.accent)
    root.style.setProperty('--accent-glow', hexToRgba(t.accent, t.mode === 'light' ? 0.24 : 0.4))
    root.style.setProperty('--accent-2', t.accent2)
    root.style.setProperty('--accent-warm', t.accentWarm)
    // body background + ambient glows (tinted per theme from accent)
    document.body.style.background = t.bg
    document.body.style.color = t.ink
    const gl1 = hexToRgba(t.accent, t.mode === 'light' ? 0.14 : 0.22)
    const gl2 = hexToRgba(t.accent2, t.mode === 'light' ? 0.10 : 0.12)
    root.style.setProperty('--bg-glow-1', gl1)
    root.style.setProperty('--bg-glow-2', gl2)
    root.style.setProperty('font-size', (15 * (db.settings.fontScale || 1)) + 'px')
    // Scale the whole app visually (works with fixed px sizes across the codebase)
    const scale = db.settings.fontScale || 1
    root.style.setProperty('--font-scale', String(scale))
    const rootEl = document.getElementById('root')
    if (rootEl) rootEl.style.zoom = scale === 1 ? '' : String(scale)
  }, [db.settings.theme, db.settings.accent, db.settings.fontScale])

  /* Backend auth bootstrap: pull remote identity + data on app start */
  useEffect(() => {
    if (!hasToken()) { setAuthReady(true); return }
    let alive = true
    api.me().then((r) => {
      if (!alive) return
      setAuthUser(r.user || null)
      if (r.data && (r.data.habits || r.data.days || r.data.events || r.data.settings)) {
        // remote has real data -> load it (server wins, never overwrite with empty local)
        setDb((prev) => {
          const next = { ...prev }
          // remember the local user identity so we don't lose the name
          const localUser = next.user
          Object.assign(next, r.data)
          next.user = { ...(next.user || {}), ...(localUser || {}) }
          next.settings = Object.assign({}, prev.settings, r.data.settings || {})
          persist(next)
          return next
        })
      }
    }).catch((e) => {
      console.warn('[auth] me failed', e.message)
      clearToken()
    }).finally(() => { if (alive) setAuthReady(true) })
    return () => { alive = false }
  }, [])

  /* wake reminder — if user hasn't logged today's wake by their usual time, notify.
     check() از ref می‌خواند تا تایمر هر بار تغییرِ db از نو ساخته نشود؛
     فقط تغییر تنظیماتِ مربوطه (یا ورود/خروج کاربر) آن را بازسازی می‌کند. */
  const dbRef = useRef(db); dbRef.current = db
  const settingsRef = useRef(db.settings); settingsRef.current = db.settings
  useEffect(() => {
    if (!db.user || !db.user.first) return
    const s = db.settings
    if (!s.wakeNotify) { try { safeStore.removeItem('rg_wake_notified') } catch (e) {} return }
    const w = s.curWake || s.wakeGoal || '06:00'
    const m = minOf(w)
    const check = () => {
      const st = settingsRef.current
      if (!st || !st.wakeNotify) return
      const today = todayISO()
      if (dbRef.current.days[today] && dbRef.current.days[today].wake) return
      const now = new Date()
      const nowMin = now.getHours() * 60 + now.getMinutes()
      // only during daytime window (between usual wake + 5min and 2pm) avoid night pings
      if (nowMin < m + 5 || nowMin > 14 * 60 + 5) return
      try {
        if (safeStore.getItem('rg_wake_notified') === today) return
        safeStore.setItem('rg_wake_notified', today)
        browserNotify('روند', 'امروز هنوز بیداری‌ات را ثبت نکرده‌ای 🌅', { tag: 'wake' })
      } catch (e) { /* ignore */ }
    }
    check()
    const t = setInterval(check, 60 * 1000)
    return () => clearInterval(t)
  }, [db.user, db.settings.wakeNotify, db.settings.curWake, db.settings.wakeGoal])

  const value = useMemo(() => ({ db, setDb: save, mutate, toast, toastMsg, todayISO, isoAddDays, toFa, faDate, faMonth, jalaliOf, j2g, jalaliToISO, jalaliMonthLen, isLeapJalali, JMONTH_NAMES, minOf, fmtMin, ACCENTS, MOOD_WORDS, moodWord, monthName, num, setActiveLang, playTick, notifySupported, notifyPermission, requestNotifyPermission, browserNotify, clearWakeNotified, nextEventISO, eventLabel, countdownOf, formatCountdown, eventIcon, authUser, authReady, signOutWithBackend: () => { clearToken(); setAuthUser(null) } }), [db, save, mutate, toast, toastMsg, authUser, authReady])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}