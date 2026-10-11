import React from 'react'
import { Link, useLocation } from 'react-router-dom'
import { SITE } from '../../config/site.config'
import Logo from './Logo'
import AppLink from './AppLink'
import { jumpToAnchor, anchorHref, hasAnchor } from './helpers'

export default function SiteFooter() {
  const year = new Date().getFullYear()
  const loc = useLocation()

  // هر لینک: اگر بخشش در همین صفحه باشد درون‌صفحه‌ای اسکرول می‌شود،
  // وگرنه به /site#anchor می‌رود. پس هیچ لینکی مرده نمی‌ماند.
  const href = (anchor) => anchorHref(anchor, loc.pathname)
  const jump = (anchor) => (hasAnchor(loc.pathname, anchor) ? jumpToAnchor : undefined)

  return (
    <footer className="site-footer">
      <div className="site-foot-in">
        <div className="site-foot-brand">
          <Link to="/" className="site-brand">
            <Logo size={30} tone="gradient" />
            <span className="site-brand-text"><b>{SITE.brand}</b><i>{SITE.brandLatin}</i></span>
          </Link>
          <p className="site-foot-tag">
            یک جدول برای روزهایت. عادت‌ها، کارها و ژورنال — همه در یک جا.
          </p>
          {/* اعتبار فونت: مجوز CC BY 4.0 ایجاب می‌کند لینک سازنده در سایت بیاید */}
          <p className="site-foot-credit">
            فونت از <a href="http://www.onlinewebfonts.com" target="_blank" rel="noopener noreferrer">Web Fonts</a> با مجوز CC BY 4.0.
          </p>
        </div>

        <nav className="site-foot-col" aria-label="محصول">
          <h3>محصول</h3>
          <Link to={href('#live')} onClick={jump('#live')}>نمونه زنده</Link>
          <Link to={href('#features')} onClick={jump('#features')}>امکانات</Link>
          <Link to={href('#compare')} onClick={jump('#compare')}>مقایسه</Link>
          <Link to={href('#pricing')} onClick={jump('#pricing')}>تعرفه</Link>
        </nav>

        <nav className="site-foot-col" aria-label="دانلود">
          <h3>دانلود</h3>
          <Link to={href('#download')} onClick={jump('#download')}>ویندوز</Link>
          <Link to={href('#download')} onClick={jump('#download')}>اندروید</Link>
          <Link to={href('#download')} onClick={jump('#download')}>وب‌اپ</Link>
          <Link to={href('#faq')} onClick={jump('#faq')}>سوالات متداول</Link>
        </nav>

        <nav className="site-foot-col" aria-label="حساب">
          <h3>حساب</h3>
          <AppLink to="/login">ورود</AppLink>
          <AppLink to="/login">ساخت حساب</AppLink>
          <AppLink to="/app">ورود به اپ</AppLink>
        </nav>
      </div>

      <div className="site-foot-bar">
        <span>© {year} {SITE.brand} — همهٔ حقوق محفوظ است.</span>
        <span className="site-foot-note">بدون تبلیغ · بدون فروش داده</span>
      </div>
    </footer>
  )
}
