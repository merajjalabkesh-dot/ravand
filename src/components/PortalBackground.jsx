import React from 'react'

/*
 * پس‌زمینهٔ صفحهٔ اول — یک آبی روشن یکدست.
 *
 * نه گرادیان تیره، نه هالهٔ سفید: یک هالهٔ سفیدِ بزرگ داخل این لایه
 * وقتی زمینه سورمه‌ای می‌شد، خودش را به‌شکل یک «باکس روشن» پشت
 * هیرو نشان می‌داد و صفحه دو تکه می‌شد. برای همین کلاً حذف شد و
 * زمینه یک رنگ یکدست است.
 *
 * رنگ از متغیر --lp-bg خوانده می‌شود که Landing با اسکرول مقدارش را
 * از آبی روشن به سورمه‌ای می‌برد؛ پس این لایه هم با بقیهٔ صفحه یکی می‌ماند.
 */
export default function PortalBackground({ className, style }) {
  return (
    <div
      className={className}
      style={{
        position: 'absolute', inset: 0, width: '100%', height: '100%', display: 'block',
        overflow: 'hidden',
        background: 'var(--lp-bg, #a9cdf7)',
        ...style,
      }}
    />
  )
}
