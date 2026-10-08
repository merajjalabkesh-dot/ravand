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

/*
 * یک شنوندهٔ مشترک برای همهٔ نمونه‌های ScrollText.
 * قبلاً هر نمونهٔ خودش به scroll و resize گوش می‌داد؛ صفحهٔ About
 * چند پاراگراف دارد و هر پاراگراف یک شنونده بود. حالا یک شنونده
 * داریم که در یک فریم همهٔ نمونه‌ها را حساب می‌کند — همان نتیجه.
 */
const listeners = new Set()
let rafId = 0
function flush() {
  rafId = 0
  listeners.forEach((fn) => fn())
}
function schedule() {
  if (rafId) return
  rafId = requestAnimationFrame(flush)
}
let attached = 0
function attach() {
  if (attached++ === 0) {
    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', schedule)
  }
}
function detach() {
  if (--attached === 0) {
    window.removeEventListener('scroll', schedule)
    window.removeEventListener('resize', schedule)
    if (rafId) { cancelAnimationFrame(rafId); rafId = 0 }
  }
}

export default function ScrollText({ text, className = '' }) {
  const ref = useRef(null)
  const [progress, setProgress] = useState(0)

  const measure = useCallback(() => {
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
    listeners.add(measure)
    attach()
    measure()
    return () => {
      listeners.delete(measure)
      detach()
    }
  }, [measure])

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
