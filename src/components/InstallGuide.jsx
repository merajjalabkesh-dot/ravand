import React, { useState, useEffect } from 'react'
import { useI18n } from '../lib/i18n'

// Shows a one-time guide for iOS users on how to add the app to their home screen.
export default function InstallGuide() {
  const { t } = useI18n()
  const [show, setShow] = useState(false)
  const [dismissed, setDismissed] = useState(() => { try { return localStorage.getItem('rg_install_dismiss') === '1' } catch { return false } })

  useEffect(() => {
    if (dismissed) return
    const isIOS = /iphone|ipad|ipod/i.test(navigator.userAgent || '')
    const inStandalone = window.matchMedia('(display-mode: standalone)').matches
    if (isIOS && !inStandalone) {
      // Show after a short delay
      const t = setTimeout(() => setShow(true), 1200)
      return () => clearTimeout(t)
    }
  }, [dismissed])

  const close = () => {
    try { localStorage.setItem('rg_install_dismiss', '1') } catch { }
    setDismissed(true)
    setShow(false)
  }

  if (!show) return null

  return (
    <div className="install-overlay" onClick={close}>
      <div className="install-card" onClick={(e) => e.stopPropagation()}>
        <div className="install-icon">{t('install.icon')}</div>
        <h3 className="install-title">{t('install.title')}</h3>
        <p className="install-text">
          {t('install.text')}
        </p>
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