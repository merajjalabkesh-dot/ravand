import React from 'react'
import { Link } from 'react-router-dom'
import { SITE } from '../../config/site.config'
import Logo from './Logo'
import AppLink from './AppLink'

export default function SiteFooter() {
  const year = new Date().getFullYear()

  // لینک‌های داخلی: فقط اسکرول نرم، بدون عوض شدن صفحه
  const jump = (e) => {
    e.preventDefault()
    const id = e.currentTarget.getAttribute('href')
    const el = id && id.length > 1 ? document.getElementById(id.slice(1)) : null
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  }

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
          <a href="#live" onClick={jump}>نمونه زنده</a>
          <a href="#features" onClick={jump}>امکانات</a>
          <a href="#compare" onClick={jump}>مقایسه</a>
          <a href="#pricing" onClick={jump}>تعرفه</a>
        </nav>

        <nav className="site-foot-col" aria-label="دانلود">
          <h3>دانلود</h3>
          <a href="#download" onClick={jump}>ویندوز</a>
          <a href="#download" onClick={jump}>اندروید</a>
          <a href="#download" onClick={jump}>وب‌اپ</a>
          <a href="#faq" onClick={jump}>سوالات متداول</a>
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
