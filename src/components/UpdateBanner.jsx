import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useI18n } from '../lib/i18n'
import { toFa } from '../lib/store'
import { checkForUpdate, openUpdate, openDirectDownload, subscribeUpdateProgress, isDismissed, dismissVersion } from '../lib/appUpdate'

/**
 * نوار «نسخهٔ جدید آماده است» و رابط دانلود درون‌برنامه‌ای.
 *
 * کجا می‌نشیند: یک‌بار در Layout رندر می‌شود، پس روی همهٔ صفحه‌های
 * /app/* دیده می‌شود — بدون دست زدن به App.jsx یا صفحهٔ لاگین.
 *
 * کِی چک می‌کند: در شروع، هر یک ساعت، و هر بار که تب دوباره نمایان شود.
 * «بعداً» تا نسخهٔ بعدی به خاطر سپرده می‌شود؛ نسخهٔ اجباری قابل بستن نیست.
 */
const CHECK_MS = 60 * 60 * 1000

export default function UpdateBanner() {
  const { t, lang } = useI18n()
  const [res, setRes] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [progress, setProgress] = useState({ stage: 'preparing', percent: 0, error: null })
  const busy = useRef(false)
  const preparingTimerRef = useRef(null)

  const clearPreparingTimer = useCallback(() => {
    if (preparingTimerRef.current) {
      clearTimeout(preparingTimerRef.current)
      preparingTimerRef.current = null
    }
  }, [])

  const run = useCallback(async () => {
    if (busy.current || updating) return
    busy.current = true
    try {
      const r = await checkForUpdate()
      if (r && (r.mandatory || !isDismissed(r.version))) setRes(r)
    } catch { /* بی‌صدا — چک آپدیت هرگز نباید اپ را بشکند */ }
    finally { busy.current = false }
  }, [updating])

  useEffect(() => {
    run()
    const id = setInterval(run, CHECK_MS)
    const onVis = () => { if (document.visibilityState === 'visible') run() }
    document.addEventListener('visibilitychange', onVis)
    return () => {
      clearInterval(id)
      document.removeEventListener('visibilitychange', onVis)
      clearPreparingTimer()
    }
  }, [run, clearPreparingTimer])

  // شنود به رویدادهای پیشرفت دانلود درون‌برنامه‌ای هنگام اجرای آپدیت
  useEffect(() => {
    if (!updating) return

    const unsub = subscribeUpdateProgress((data) => {
      if (!data) return
      const stage = data.stage || 'downloading'
      if (stage !== 'preparing') {
        clearPreparingTimer()
      }
      const rawPercent = typeof data.percent === 'number' ? data.percent : (stage === 'completed' ? 100 : 0)
      const percent = Math.max(0, Math.min(100, Math.round(rawPercent)))
      setProgress({
        stage,
        percent,
        error: data.error || null,
      })
    })

    return () => {
      unsub()
      clearPreparingTimer()
    }
  }, [updating, clearPreparingTimer])

  if (!res) return null

  const later = () => {
    clearPreparingTimer()
    dismissVersion(res.version)
    setRes(null)
  }

  const handleStartUpdate = async () => {
    if (res.platform === 'web') {
      openUpdate(res)
      return
    }
    setUpdating(true)
    setProgress({ stage: 'preparing', percent: 0, error: null })
    clearPreparingTimer()

    // تایم‌اوت هوشمند ۱۰ ثانیه‌ای برای جلوگیری از معلق ماندن در حالت آماده‌سازی
    preparingTimerRef.current = setTimeout(() => {
      setProgress((prev) => {
        if (prev.stage === 'preparing') {
          return { stage: 'timeout', percent: 0, error: null }
        }
        return prev
      })
    }, 10000)

    try {
      await openUpdate(res)
    } catch (err) {
      clearPreparingTimer()
      setProgress({ stage: 'error', percent: 0, error: err?.message || null })
    }
  }

  const handleDirectDownload = async () => {
    if (!res?.url) return
    clearPreparingTimer()
    try {
      await openDirectDownload(res.url)
      setProgress({ stage: 'browser_opened', percent: 0, error: null })
    } catch {
      setProgress({ stage: 'error', percent: 0, error: null })
    }
  }

  const actionLabel = res.platform === 'web' ? t('update.reload') : t('update.download')
  const percentText = lang === 'fa' ? toFa(progress.percent) : progress.percent

  // متن‌های وضعیت در حال پیشرفت
  let statusTitle = t('update.title')
  let statusSub = t('update.body', { version: res.version })

  if (updating) {
    if (progress.stage === 'preparing') {
      statusTitle = t('update.preparing')
      statusSub = t('update.body', { version: res.version })
    } else if (progress.stage === 'downloading') {
      statusTitle = t('update.downloading', { percent: percentText })
      statusSub = `${progress.percent}%`
    } else if (progress.stage === 'installing') {
      statusTitle = t('update.installing')
      statusSub = t('update.title')
    } else if (progress.stage === 'completed') {
      statusTitle = t('update.completed')
      statusSub = ''
    } else if (progress.stage === 'browser_opened') {
      statusTitle = t('update.browserOpened')
      statusSub = ''
    } else if (progress.stage === 'timeout') {
      statusTitle = t('update.timeout')
      statusSub = ''
    } else if (progress.stage === 'error') {
      statusTitle = t('update.error')
      statusSub = progress.error || ''
    }
  }

  const isTerminalState = progress.stage === 'error' || progress.stage === 'timeout' || progress.stage === 'browser_opened'

  return (
    <div className="update-banner" role="alert" dir="auto">
      <div className="update-banner-in" style={{ flexDirection: updating ? 'column' : undefined, alignItems: updating ? 'stretch' : 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
          <span className="update-banner-icon" aria-hidden="true" style={{ animation: updating && progress.stage === 'downloading' ? 'pulse 1.5s infinite' : undefined }}>
            {progress.stage === 'error' || progress.stage === 'timeout' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
            ) : progress.stage === 'completed' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            ) : progress.stage === 'browser_opened' ? (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
                <polyline points="15 3 21 3 21 9" />
                <line x1="10" y1="14" x2="21" y2="3" />
              </svg>
            ) : (
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 3v12" />
                <path d="m7 11 5 5 5-5" />
                <path d="M5 21h14" />
              </svg>
            )}
          </span>
          <div className="update-banner-text" style={{ flex: 1 }}>
            <b>{statusTitle}</b>
            {statusSub && <span>{statusSub}</span>}
          </div>
          {!updating ? (
            <button className="btn update-banner-go" onClick={handleStartUpdate}>{actionLabel}</button>
          ) : progress.stage === 'error' ? (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button className="btn update-banner-go" onClick={handleStartUpdate}>{t('update.retry')}</button>
              {res.url && (
                <button className="btn update-banner-go" style={{ background: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.25)' }} onClick={handleDirectDownload}>{t('update.downloadDirect')}</button>
              )}
            </div>
          ) : progress.stage === 'timeout' ? (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {res.url && (
                <button className="btn update-banner-go" onClick={handleDirectDownload}>{t('update.downloadDirect')}</button>
              )}
              <button className="btn update-banner-go" style={{ background: 'rgba(255, 255, 255, 0.15)', borderColor: 'rgba(255, 255, 255, 0.25)' }} onClick={handleStartUpdate}>{t('update.retry')}</button>
            </div>
          ) : progress.stage === 'browser_opened' ? (
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {res.url && (
                <button className="btn update-banner-go" onClick={handleDirectDownload}>{t('update.downloadDirect')}</button>
              )}
            </div>
          ) : null}
          {!res.mandatory && (!updating || isTerminalState) && (
            <button className="update-banner-x" onClick={later} aria-label={t('update.later')} title={t('update.later')}>×</button>
          )}
        </div>

        {updating && !isTerminalState && progress.stage !== 'completed' && (
          <div style={{ marginTop: '10px', width: '100%' }}>
            <div style={{
              width: '100%',
              height: '7px',
              borderRadius: '999px',
              backgroundColor: 'rgba(255, 255, 255, 0.12)',
              overflow: 'hidden',
              position: 'relative'
            }}>
              <div style={{
                height: '100%',
                width: progress.stage === 'preparing' ? '20%' : `${progress.percent}%`,
                borderRadius: '999px',
                backgroundColor: 'var(--accent, #6366f1)',
                transition: 'width 0.35s ease',
                animation: progress.stage === 'preparing' ? 'pulse 1.2s ease-in-out infinite' : undefined
              }} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
