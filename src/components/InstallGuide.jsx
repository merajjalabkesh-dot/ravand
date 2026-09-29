import React, { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useI18n } from '../lib/i18n'

/**
 * راهنمای «افزودن به صفحهٔ اصلی» — فقط برای کاربران iOS در وب‌اپ.
 *
 * شرایط نمایش (هر سه باید درست باشد):
 *  1. داخل مسیرهای /app/* باشیم (لاگین شده باشی) — روی سایت نمی‌آید.
 *  2. دستگاه iOS باشد (آیفون/آیپد — آیپد مدرن را هم شامل می‌شود).
 *  3. اپ قبلاً به صفحهٔ اصلی اضافه نشده باشد (حالت standalone نباشد).
 *
 * یک‌بار بسته شد، دیگر نشان داده نمی‌شود (localStorage).
 */
export default function InstallGuide() {
  const { t } = useI18n()
  const loc = useLocation()
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem('rg_install_dismiss') === '1' } catch { return false }
  })

  const inApp = loc.pathname.startsWith('/app')

  useEffect(() => {
    if (dismissed || !inApp) return

    const ua = navigator.userAgent || ''
    // آیپد مدرن (iPadOS 13+) خودش را مثل مک معرفی می‌کند
    const isIOS =
      /iphone|ipad|ipod/i.test(ua) ||
      (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)

    // اگر از صفحهٔ اصلی باز شده باشد، نیازی به راهنما نیست
    const inStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true

    // بیلد native (exe/apk) اصلاً راهنمای وب نمی‌خواهد
    const isNative = !!window.__IS_NATIVE_APP__

    if (isIOS && !inStandalone && !isNative) {
      const timer = setTimeout(() => setShow(true), 1200)
      return () => clearTimeout(timer)
    }
  }, [dismissed, inApp])

  const close = () => {
    try { localStorage.setItem('rg_install_dismiss', '1') } catch { }
    setDismissed(true)
    setShow(false)
  }

  if (!show || !inApp) return null

  return (
    <div className="install-overlay" onClick={close}>
      <div className="install-card" onClick={(e) => e.stopPropagation()}>
        <div className="install-icon">{t('install.icon')}</div>
        <h3 className="install-title">{t('install.title')}</h3>
        <p className="install-text">{t('install.text')}</p>
        <ol className="install-steps">
          <li>{t('install.step1')}</li>
          <li>{t('install.step2')}</li>
          <li>{t('install.step3')}</li>
        </ol>
        <button className="btn" onClick={close}>{t('install.gotIt')}</button>
      </div>
    </div>
  )
}
