import React from 'react'

/*
 * لینک به وب‌اپ و صفحهٔ ورود — در تب جدید باز می‌شود.
 *
 * چرا تب جدید؟ سایت و وب‌اپ دو فضای جدا هستند. باز کردن اپ در همون
 * تب، کاربر را از سایت دور می‌کند و برگشتش سخت می‌شود. تب جدا یعنی
 * سایت سر جایش می‌ماند.
 *
 * نکتهٔ فنی: پروژه HashRouter دارد، پس مسیرها به شکل #/login و #/app
 * هستند. اگر فقط target="_blank" بگذاریم، مرورگر چون فقط hash را
 * عوض می‌کند ممکن است در همان تب باز کند — برای همین آدرس کامل را
 * با window.location.origin می‌سازیم.
 */

const withOrigin = (to) => {
  if (typeof window === 'undefined') return to
  return window.location.origin + window.location.pathname + '#' + to
}

export default function AppLink({ to, children, className, ...rest }) {
  return (
    <a href={withOrigin(to)} target="_blank" rel="noopener noreferrer" className={className} {...rest}>
      {children}
    </a>
  )
}
