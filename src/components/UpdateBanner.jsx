import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../lib/i18n'
import { checkForUpdate, openUpdate, isDismissed, dismissVersion } from '../lib/appUpdate'

/**
 * نوار «نسخهٔ جدید آماده است».
 *
 * کجا می‌نشیند: یک‌بار در Layout رندر می‌شود، پس روی همهٔ صفحه‌های
 * /app/* دیده می‌شود — بدون دست زدن به App.jsx یا صفحهٔ لاگین.
 *
 * کِی چک می‌کند: در شروع، هر یک ساعت، و هر بار که تب دوباره نمایان شود.
 * «بعداً» تا نسخهٔ بعدی به خاطر سپرده می‌شود؛ نسخهٔ اجباری قابل بستن نیست.
 */
const CHECK_MS = 60 * 60 * 1000

export default function UpdateBanner() {
  const { t } = useI18n()
  const [res, setRes] = useState(null)
  const busy = useRef(false)

  const run = useCallback(async () => {
    if (busy.current) return
    busy.current = true
    try {
      const r = await checkForUpdate()
      if (r && (r.mandatory || !isDismissed(r.version))) setRes(r)
    } catch { /* بی‌صدا — چک آپدیت هرگز نباید اپ را بشکند */ }
    finally { busy.current = false }
  }, [])

  useEffect(() => {
    run()
    const id = setInterval(run, CHECK_MS)
    const onVis = () => { if (document.visibilityState === 'visible') run() }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
    }
  }, [run])

  if (!res) return null

  const later = () => { dismissVersion(res.version); setRes(null) }
  const actionLabel = res.platform === 'web' ? t('update.reload') : t('update.download')

  return (
    <div className="update-banner" role="alert" dir="auto">
      <div className="update-banner-in">
        <span className="update-banner-icon" aria-hidden="true">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 3v12" />
            <path d="m7 11 5 5 5-5" />
            <path d="M5 21h14" />
          </svg>
        </span>
        <div className="update-banner-text">
          <b>{t('update.title')}</b>
          <span>{t('update.body', { version: res.version })}</span>
        </div>
        <button className="btn update-banner-go" onClick={() => openUpdate(res)}>{actionLabel}</button>
        {!res.mandatory && (
          <button className="update-banner-x" onClick={later} aria-label={t('update.later')} title={t('update.later')}>×</button>
        )}
      </div>
    </div>
  )
}
