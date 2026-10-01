import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useI18n } from '../lib/i18n'

/**
 * راهنمای «افزودن به صفحهٔ اصلی» — فقط برای کاربران iOS در وب‌اپ.
 *
 * شرایط نمایش (هر پنج تا باید درست باشد):
 *  1. داخل مسیرهای /app/* باشیم — یعنی کاربر وارد شده. روی سایت هرگز نمی‌آید.
 *  2. دستگاه iOS باشد (آیفون/آیپد؛ آیپد مدرن خودش را مک معرفی می‌کند).
 *  3. اپ قبلاً به صفحهٔ اصلی اضافه نشده باشد (حالت standalone نباشد).
 *  4. بیلد native (exe/apk) نباشد — آنجا راهنمای وب معنا ندارد.
 *  5. کاربر قبلاً این پنجره را نبسته باشد.
 *
 * اگر کاربر یک‌بار ببندد دیگر خودکار نمی‌آید، ولی از صفحهٔ تنظیمات
 * می‌تواند دوباره بخواند.
 */
const KEY = 'rg_install_dismiss_v2'

/** تکه‌های [[chip]] داخل متن ترجمه‌ها را به دکمهٔ شبیه‌سازی‌شدهٔ iOS تبدیل می‌کند */
const CHIPS = {
  share: (
    <span className="install-chip" aria-label="Share">
      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 15V3" /><path d="M8 7l4-4 4 4" />
        <path d="M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" />
      </svg>
    </span>
  ),
  addhome: <span className="install-chip">Add to Home Screen <b>+</b></span>,
  add: <span className="install-chip install-chip-solid">Add</span>,
}

function withChips(text) {
  return String(text).split(/(\[\[[a-z]+\]\])/g).map((part, i) => {
    const m = part.match(/^\[\[([a-z]+)\]\]$/)
    if (!m) return part
    return CHIPS[m[1]] || part
  })
}

export default function InstallGuide() {
  const { t, isFa } = useI18n()
  const loc = useLocation()
  const [show, setShow] = useState(false)
  const [force, setForce] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem(KEY) === '1' } catch { return false }
  })

  const inApp = loc.pathname.startsWith('/app')

  // کاربر از صفحهٔ تنظیمات خواسته راهنما دوباره بیاید
  useEffect(() => {
    const onOpen = () => { setForce(true); setShow(false) }
    window.addEventListener('rg:open-install-guide', onOpen)
    return () => window.removeEventListener('rg:open-install-guide', onOpen)
  }, [])

  useEffect(() => {
    if (!inApp) return
    // force یعنی کاربر خودش خواسته — dismissed را نادیده می‌گیریم
    if (dismissed && !force) return

    const ua = navigator.userAgent || ''
    const isIOS =
      /iphone|ipad|ipod/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

    const inStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true

    const isNative = !!window.__IS_NATIVE_APP__

    if (isIOS && !inStandalone && !isNative) {
      const delay = force ? 0 : 1200
      const timer = setTimeout(() => setShow(true), delay)
      return () => clearTimeout(timer)
    }
  }, [dismissed, inApp, force])

  const close = () => {
    try { localStorage.setItem(KEY, '1') } catch { }
    setDismissed(true)
    setForce(false)
    setShow(false)
  }

  if (!show || !inApp) return null

  const nums = isFa ? ['۱', '۲', '۳'] : ['1', '2', '3']

  return (
    <div className="install-overlay" onClick={close}>
      <div className="install-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="install-icon">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 12.5l4 4L18 8" />
          </svg>
        </div>
        <h3 className="install-title">{t('install.title')}</h3>
        <div className="install-divider" />
        <ol className="install-steps">
          <li>
            <span className="install-num">{nums[0]}</span>
            <span className="install-step-text">{withChips(t('install.step1'))}</span>
          </li>
          <li>
            <span className="install-num">{nums[1]}</span>
            <span className="install-step-text">{withChips(t('install.step2'))}</span>
          </li>
          <li>
            <span className="install-num">{nums[2]}</span>
            <span className="install-step-text">{withChips(t('install.step3'))}</span>
          </li>
        </ol>
        <p className="install-note">{withChips(t('install.step4'))}</p>
      </div>
      <button className="install-dismiss" onClick={close}>{t('install.gotIt')}</button>
    </div>
  )
}
