import React from 'react'

/*
 * نشانهٔ برند «روند»
 * سه خانه که مثل پله از پایین‌چپ به بالاراست بالا رفته‌اند.
 * از روی هیت‌مپ روزانهٔ صفحهٔ گزارش‌ها برداشته شده: همان زبان بصریِ
 * خالی، کم‌رنگ، پر و کهربایی — خلاصه‌شده در سه پله.
 *
 * نسخه‌ها:
 *   mono      — تک‌رنگ، با currentColor
 *   gradient  — گرادیان بنفش→سبز، فقط برای هیرو و دانلود
 *   dark      — روی زمینهٔ تیره
 */

const PATHS = (
  <g>
    <rect x="116" y="292" width="88" height="88" rx="20" fill="currentColor" opacity="0.32" />
    <rect x="212" y="212" width="88" height="88" rx="20" fill="currentColor" opacity="0.62" />
    <rect x="308" y="132" width="88" height="88" rx="20" fill="currentColor" />
  </g>
)

const GRADIENT_PATHS = (
  <>
    <defs>
      <linearGradient id="rg-brand" x1="0" y1="1" x2="1" y2="0">
        <stop offset="0" stopColor="#8b5cf6" />
        <stop offset="1" stopColor="#43e8a8" />
      </linearGradient>
    </defs>
    <rect x="116" y="292" width="88" height="88" rx="20" fill="url(#rg-brand)" opacity="0.45" />
    <rect x="212" y="212" width="88" height="88" rx="20" fill="url(#rg-brand)" opacity="0.75" />
    <rect x="308" y="132" width="88" height="88" rx="20" fill="url(#rg-brand)" />
  </>
)

/**
 * @param size   اندازهٔ ضلع بر حسب px
 * @param tone   'mono' | 'gradient'
 * @param glow   هالهٔ نرم پشت نشانه (در CSS اضافه می‌شود، نه داخل SVG)
 */
export default function Logo({ size = 32, tone = 'mono', glow = false, className = '', ...rest }) {
  return (
    <span
      className={'rg-logo' + (glow ? ' rg-logo-glow' : '') + (className ? ' ' + className : '')}
      style={{ width: size, height: size, ...(rest.style || {}) }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 512 512" width={size} height={size} role="presentation">
        {tone === 'gradient' ? GRADIENT_PATHS : PATHS}
      </svg>
    </span>
  )
}

/** نسخت�� inline برای جاهایی که کلاس لازم نیست */
export function LogoSvg({ size = 32, tone = 'mono' }) {
  return (
    <svg viewBox="0 0 512 512" width={size} height={size} aria-hidden="true">
      {tone === 'gradient' ? GRADIENT_PATHS : PATHS}
    </svg>
  )
}
