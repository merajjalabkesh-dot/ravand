/*
 * کمک‌تابع‌های مشترک لاین سایت (Lane B)
 * ------------------------------------
 * قبلاً هر کامپوننت نسخهٔ خودش را داشت: تبدیل رقم فارسی در Sections و
 * Heatmap تکرار شده بود، و اسکرول نرم در SiteHeader و SiteFooter.
 * حالا یک نسخهٔ واحد اینجاست تا رفتار همه یکسان بماند.
 */

const FA_DIGITS = '۰۱۲۳۴۵۶۷۸۹'

/** تبدیل رقم‌های لاتین یک مقدار به رقم فارسی */
export const fa = (n) => String(n).replace(/[0-9]/g, (d) => FA_DIGITS[+d])

/**
 * اسکرول نرم به یک بخش بر اساس id.
 * اگر کاربر prefers-reduced-motion داشته باشد، بدون انیمیشن می‌رود.
 * اگر عنصر پیدا نشود false برمی‌گرداند.
 */
export function smoothScrollToId(id) {
  const el = id ? document.getElementById(id) : null
  if (!el) return false
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  return true
}

/** هندلر کلیک لینک لنگر داخلی: صفحه عوض نشود، فقط اسکرول نرم شود */
export function jumpToAnchor(e) {
  e.preventDefault()
  const href = e.currentTarget.getAttribute('href')
  return smoothScrollToId(href && href.length > 1 ? href.slice(1) : null)
}
