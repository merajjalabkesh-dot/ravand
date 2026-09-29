import React, { useRef, useState, useEffect, useCallback } from 'react'

/*
 * متن کلمه‌به‌کلمه که با اسکرول روشن می‌شود
 * ----------------------------------------
 * هر کلمه به‌اندازهٔ جای خودش در متن نسبت به پیشرفت اسکرول، از
 * کم‌رنگ به پررنگ می‌رود.
 *
 * چرا کلمه و نه حرف؟ حروف فارسی به هم می‌چسبند (اتصال دارند) و
 * وقتی هر حرف را در یک عنصر جدا بگذاریم، اتصالشان می‌شکند و متن
 * به‌هم‌ریخته و ناخوانا می‌شود. کلمه اتصالش را حفظ می‌کند.
 *
 * رنگ مستقیم روی خودِ کلمه تنظیم می‌شود و هیچ لایهٔ مطلقی در کار
 * نیست، پس متن هیچ‌وقت روی هم نمی‌افتد.
 */

/*
 * اختلاف رنگ باید محسوس باشد وگرنه افکت دیده نمی‌شود. نسخهٔ قبلی
 * (#b8c4e8 -> #eef2ff) فقط ۱.۲۳ به ۱ کنتراست داشت یعنی تقریباً
 * نامحسوس. این جفت ۲.۳ به ۱ است: اول کم‌رنگ و مه‌آلود، آخر روشن
 * و چشمگیر.
 */
const DIM = [90, 106, 148]    // #5a6a94
const LIT = [238, 242, 255]   // #eef2ff

export default function ScrollText({ text, className = '' }) {
  const ref = useRef(null)
  const [progress, setProgress] = useState(0)

  const onScroll = useCallback(() => {
    const el = ref.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const vh = window.innerHeight || 1
    // وقتی متن از پایین صفحه وارد دید می‌شود شروع کن، و وقتی به یک‌سوم
    // بالای صفحه رسید کامل شود. پنجرهٔ عمداً بلند است تا روشن‌شدنِ
    // کلمه‌به‌کلمه قابل دیدن باشد، نه یک لحظهٔ گذرا.
    const from = vh * 0.95
    const to = vh * 0.25
    const span = from - to
    if (span <= 0) { setProgress(r.top < to ? 1 : 0); return }
    const p = (from - r.top) / span
    setProgress(p < 0 ? 0 : p > 1 ? 1 : p)
  }, [])

  useEffect(() => {
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [onScroll])

  // کلمه‌ها با فاصلهٔ واقعی (شامل نیم‌فاصله) نگه داشته می‌شوند
  const words = String(text).split(/(\s+)/).filter((w) => w.length)
  const wordCount = words.filter((w) => !/^\s+$/.test(w)).length
  let seen = 0

  return (
    <span ref={ref} className={'rv-scroll ' + className} aria-label={text}>
      {words.map((w, i) => {
        if (/^\s+$/.test(w)) return <React.Fragment key={i}>{w}</React.Fragment>
        const k = seen++
        // هر کلمه سهمی از پیشرفت کل دارد: اولی زودتر روشن می‌شود،
        // آخری وقتی متن کاملاً به بالای صفحه رسیده باشد.
        const t = Math.max(0, Math.min(1, progress * (wordCount + 4) - k - 1))
        const e = t * t * (3 - 2 * t)
        const c = DIM.map((v, j) => Math.round(v + (LIT[j] - v) * e))
        return (
          <span key={i} className="rv-w" style={{ color: 'rgb(' + c.join(',') + ')' }}>
            {w}
          </span>
        )
      })}
    </span>
  )
}
