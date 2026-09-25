import React, { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { SITE } from '../../config/site.config'
import { useApp } from '../../lib/store'

const Logo = ({ size = 22 }) => (
  <span className="site-logo-mark">
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 1.8" />
    </svg>
  </span>
)

export default function SiteHeader() {
  const { db } = useApp()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const loc = useLocation()
  const authed = !!(db.user && db.user.first)

  useEffect(() => { setOpen(false) }, [loc.pathname])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { to: '/site#features', label: 'امکانات' },
    { to: '/site#about', label: 'درباره روند' },
    { to: '/site#faq', label: 'سوالات' },
    { to: '/download', label: 'دانلود' },
  ]

  return (
    <header className={'site-header' + (scrolled ? ' is-scrolled' : '')}>
      <div className="site-header-in">
        <Link to="/" className="site-brand" aria-label="روند — صفحه اصلی">
          <Logo />
          <span className="site-brand-text">
            <b>{SITE.brand}</b>
            <i>{SITE.brandLatin}</i>
          </span>
        </Link>

        <nav className={'site-nav' + (open ? ' open' : '')} aria-label="منوی اصلی">
          {links.map((l) => (
            <NavLink key={l.to} to={l.to} className="site-nav-link">{l.label}</NavLink>
          ))}
          <div className="site-nav-cta">
            {authed
              ? <Link className="btn site-btn ghost" to="/app">ورود به اپ</Link>
              : <>
                <Link className="btn site-btn ghost" to="/login">ورود</Link>
                <Link className="btn site-btn" to="/login">ساخت حساب</Link>
              </>}
          </div>
        </nav>

        <button
          className="site-burger"
          onClick={() => setOpen((o) => !o)}
          aria-label="منو"
          aria-expanded={open}
        >
          <span className={open ? 'bar rot' : 'bar'} />
          <span className={open ? 'bar hid' : 'bar'} />
          <span className={open ? 'bar' : 'bar rev'} />
        </button>
      </div>
    </header>
  )
}
