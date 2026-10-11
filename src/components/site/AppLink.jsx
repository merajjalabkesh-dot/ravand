import React from 'react'
import { Link } from 'react-router-dom'

/*
 * لینک به وب‌اپ و صفحهٔ ورود — در همان تب باز می‌شود.
 *
 * قبلاً در تب جدید باز می‌شد تا سایت سر جایش بماند، ولی کاربر خواست
 * کلیک روی CTA داخلی کاربر را از سایت جدا نکند؛ حالا با روتر خودِ اپ
 * جابه‌جا می‌شویم. چون پروژه HashRouter دارد، react-router خودش
 * #/login و #/app را می‌سازد.
 */
export default function AppLink({ to, children, className, ...rest }) {
  return (
    <Link to={to} className={className} {...rest}>
      {children}
    </Link>
  )
}
