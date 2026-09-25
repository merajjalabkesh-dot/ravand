import React, { useState, useEffect } from 'react'

// Shows a one-time guide for iOS users on how to add the app to their home screen.
export default function InstallGuide() {
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
        <div className="install-icon">📲</div>
        <h3 className="install-title">روند را به صفحهٔ اصلی اضافه کن</h3>
        <p className="install-text">
          برای استفادهٔ آفلاین و مثل یک برنامهٔ واقعی:
        </p>
        <ol className="install-steps">
          <li><b>آیکون Share</b> (مربع با فلش)</li>
          <li><b>Add to Home Screen</b> را بزن</li>
          <li>پس از افزودن، برنامهٔ «روند» را از صفحهٔ اصلی باز کن</li>
        </ol>
        <button className="btn" onClick={close}>باشه، فهمیدم</button>
      </div>
    </div>
  )
}