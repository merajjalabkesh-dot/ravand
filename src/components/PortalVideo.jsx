import React, { useEffect, useRef, useState } from 'react'
import Starfield from './Starfield'

// ویدیوی پورتال — مستقیم از CDN (فایل محلی portal2 حذف شد).
const REMOTE_URL = 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260606_170109_f96e01a5-b0db-4274-b24d-8d97e99ec928.mp4'

// ویدیو روی همهٔ دستگاه‌ها پخش می‌شود (انیمیشن اسکرول باید سالم بماند)؛
// سنگینی فایل با preload=metadata و نگهبان زیر مدیریت می‌شود.
export default function PortalVideo({ className, style }) {
  const [failed, setFailed] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const v = ref.current
    if (!v) return
    let cancelled = false
    let started = false

    const tryPlay = () => {
      if (cancelled || started) return
      const p = v.play()
      if (p && p.then) p.then(() => { started = true }).catch(() => {})
      else started = true
    }
    const onError = () => {
      if (cancelled) return
      setFailed(true)
    }
    const onCanPlay = () => tryPlay()
    const onPlaying = () => { started = true }
    const onStalled = () => tryPlay()
    const onTimeUpdate = () => { if (v.paused) tryPlay() }

    v.addEventListener('canplay', onCanPlay)
    v.addEventListener('loadeddata', onCanPlay)
    v.addEventListener('playing', onPlaying)
    v.addEventListener('timeupdate', onTimeUpdate)
    v.addEventListener('stalled', onStalled)
    v.addEventListener('error', onError)

    tryPlay()
    const t0 = setTimeout(tryPlay, 300)
    const t1 = setTimeout(tryPlay, 1500)

    // on mobile, browsers often block autoplay until a real user gesture.
    // Resume playback on any touch/click so the user never sees a paused video.
    const onGesture = () => {
      if (cancelled) return
      if (v.paused) v.play().catch(() => {})
      else if (v.readyState < 3) { tryPlay() }
    }

    // watchdog: if the video never makes progress after ~6s (buffering forever),
    // fall through to the next source so the user isn't stuck on a frozen frame.
    const t2 = setTimeout(() => {
      if (cancelled) return
      if (started && v.currentTime === 0 && !v.ended && v.readyState < 3) {
        onError()
      }
    }, 6000)

    window.addEventListener('touchstart', onGesture, { passive: true })
    window.addEventListener('click', onGesture, { passive: true })

    return () => {
      cancelled = true
      clearTimeout(t0); clearTimeout(t1); clearTimeout(t2)
      window.removeEventListener('touchstart', onGesture)
      window.removeEventListener('click', onGesture)
      v.removeEventListener('canplay', onCanPlay)
      v.removeEventListener('loadeddata', onCanPlay)
      v.removeEventListener('playing', onPlaying)
      v.removeEventListener('timeupdate', onTimeUpdate)
      v.removeEventListener('stalled', onStalled)
      v.removeEventListener('error', onError)
    }
  }, [failed])

  if (failed) return <Starfield className={className} style={style} />

  return (
    <video
      ref={ref}
      autoPlay
      muted
      loop
      playsInline
      preload="metadata"
      className={(className ? className + ' ' : '') + 'portal-video'}
      style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block', background: '#040610', ...style }}
      src={REMOTE_URL}
    />
  )
}