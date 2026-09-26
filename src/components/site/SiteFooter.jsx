import React from 'react'
import { Link } from 'react-router-dom'
import { SITE } from '../../config/site.config'
import Logo from './Logo'

export default function SiteFooter() {
  const year = new Date().getFullYear()
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
        </div>

        <nav className="site-foot-col" aria-label="محصول">
          <h3>محصول</h3>
          <Link to="/site#live">نمایش زنده</Link>
          <Link to="/site#features">امکانات</Link>
          <Link to="/site#compare">مقایسه</Link>
          <Link to="/site#pricing">تعرفه</Link>
        </nav>

        <nav className="site-foot-col" aria-label="دانلود">
          <h3>دانلود</h3>
          <Link to="/download#platforms">ویندوز</Link>
          <Link to="/download#platforms">اندروید</Link>
          <Link to="/download#platforms">وب‌اپ</Link>
          <Link to="/site#faq">سوالات متداول</Link>
        </nav>

        <nav className="site-foot-col" aria-label="حساب">
          <h3>حساب</h3>
          <Link to="/login">ورود</Link>
          <Link to="/login">ساخت حساب</Link>
          <Link to="/app">ورود به اپ</Link>
        </nav>
      </div>

      <div className="site-foot-bar">
        <span>© {year} {SITE.brand} — همهٔ حقوق محفوظ است.</span>
        <span className="site-foot-note">بدون تبلیغ · بدون فروش داده</span>
      </div>
    </footer>
  )
}
