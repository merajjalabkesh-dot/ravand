import React from 'react'
import { Link } from 'react-router-dom'
import { SITE } from '../../config/site.config'

export default function SiteFooter() {
  const year = new Date().getFullYear()
  return (
    <footer className="site-footer">
      <div className="site-foot-in">
        <div className="site-foot-brand">
          <div className="site-brand">
            <span className="site-logo-mark">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 1.8" />
              </svg>
            </span>
            <span className="site-brand-text"><b>{SITE.brand}</b><i>{SITE.brandLatin}</i></span>
          </div>
          <p className="site-foot-tag">
            خانهٔ شیشه‌ای عادت‌ها، کارهای روزانه و ژورنال شما.
          </p>
        </div>

        <nav className="site-foot-col" aria-label="لینک‌های فوتر">
          <h3>روند</h3>
          <Link to="/site#about">درباره</Link>
          <Link to="/site#features">امکانات</Link>
          <Link to="/site#faq">سوالات متداول</Link>
          <Link to="/download">دانلود</Link>
        </nav>

        <nav className="site-foot-col" aria-label="لینک‌های سایت">
          <h3>دسترسی</h3>
          <Link to="/login">ورود</Link>
          <Link to="/login">ساخت حساب</Link>
          <Link to="/app">وب‌اپ</Link>
        </nav>
      </div>

      <div className="site-foot-bar">
        <span>© {year} {SITE.brand} — همهٔ حقوق محفوظ است.</span>
        <span className="site-foot-note">ساخته‌شده با ❤️ برای زندگی منظم‌تر</span>
      </div>
    </footer>
  )
}
