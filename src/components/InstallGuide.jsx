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
const KEY = 'rg_install_dismiss'

export default function InstallGuide() {
  const { t } = useI18n()
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

  return (
    <div className="install-overlay" onClick={close}>
      <div className="install-card" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="install-icon">{t('install.icon')}</div>
        <h3 className="install-title">{t('install.title')}</h3>
        <p className="install-text">{t('install.text')}</p>
        <ol className="install-steps">
          <li>{t('install.step1')}</li>
          <li>{t('install.step2')}</li>
          <li>{t('install.step3')}</li>
          <li>{t('install.step4')}</li>
        </ol>
        <button className="btn" onClick={close}>{t('install.gotIt')}</button>
      </div>
    </div>
  )
}
