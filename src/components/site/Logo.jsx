import React from 'react'

/*
 * نشانهٔ رسمی برند هبیتیک
 * سه مربع بنفش (#8b5cf6) صعودی از پایین‌چپ به بالاراست.
 * یکدست با آیکون رسمی برنامه در ویندوز، اندروید و وب‌اپ.
 */

const PURPLE_PATHS = (
  <g>
    <rect x="116" y="292" width="88" height="88" rx="20" fill="#8b5cf6" opacity="0.45" />
    <rect x="212" y="212" width="88" height="88" rx="20" fill="#8b5cf6" opacity="0.75" />
    <rect x="308" y="132" width="88" height="88" rx="20" fill="#8b5cf6" opacity="1" />
  </g>
)

const MONO_PATHS = (
  <g>
    <rect x="116" y="292" width="88" height="88" rx="20" fill="currentColor" opacity="0.45" />
    <rect x="212" y="212" width="88" height="88" rx="20" fill="currentColor" opacity="0.75" />
    <rect x="308" y="132" width="88" height="88" rx="20" fill="currentColor" opacity="1" />
  </g>
)

export default function Logo({ size = 32, tone = 'purple', glow = false, className = '', ...rest }) {
  return (
    <span
      className={'rg-logo' + (glow ? ' rg-logo-glow' : '') + (className ? ' ' + className : '')}
      style={{ width: size, height: size, ...(rest.style || {}) }}
      aria-hidden="true"
    >
      <svg viewBox="0 0 512 512" width={size} height={size} role="presentation">
        {tone === 'mono' ? MONO_PATHS : PURPLE_PATHS}
      </svg>
    </span>
  )
}

