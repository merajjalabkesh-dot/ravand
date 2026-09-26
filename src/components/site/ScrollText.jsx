import React, { useRef, useState, useEffect, useCallback } from 'react'

/*
 * متن حرف‌به‌حرف که با اسکرول روشن می‌شود
 * -----------------------------------------
 * هر حرف به‌اندازهٔ موقعیتش در متن نسبت به پیشرفت اسکرول، از
 * کم‌رنگ به پررنگ می‌رود. ایده از پرامپت‌های مرجع گرفته شده،
 * ولی پیاده‌سازی سبک و بدون کتابخانه است.
 *
 * برای احترام به prefers-reduced-motion، بدون جاوااسکریپت اضافه
 * و فقط با CSS کار می‌کند.
 */

export default function ScrollText({ text, className = '', start = 0.75, end = 0.25 }) {
  const ref = useRef(null)
  const [progress, setProgress] = useState(0)
  const chars = Array.from(text)

  const onScroll = useCallback(() => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const vh = window.innerHeight || 1
    // از وقتی بالای کادر به ۷۵٪ ارتفاع می‌رسد شروع کن
    // تا وقتی پایینش به ۲۵٪ می‌رسد کامل شود
    const from = vh * start - r.height * 0.15
    const to = vh * end - r.height * 0.85
    const span = from - to
    if (span <= 0) { setProgress(r.top < vh * end ? 1 : 0); return }
    const p = (from - r.top) / span
    setProgress(p < 0 ? 0 : p > 1 ? 1 : p)
  }, [start, end])

  useEffect(() => {
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [onScroll])

  const n = chars.length
  // کمی فاصله می‌گذاریم تا آخرین حرف هم کامل روشن شود
  const lit = progress * n * 1.18

  return (
    <span ref={ref} className={className} aria-label={text}>
      {chars.map((c, i) => (
        <span key={i} className="rv-char" aria-hidden="true">
          <span className="rv-char-inv">{c}</span>
          <span style={{ position: 'absolute', opacity: i < lit ? 1 : 0.22 }}>{c}</span>
        </span>
      ))}
    </span>
  )
}
