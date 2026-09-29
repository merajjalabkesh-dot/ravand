import React, { useState, useEffect } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { SITE } from '../../config/site.config'
import { useApp } from '../../lib/store'
import Logo from './Logo'
import AppLink from './AppLink'

export default function SiteHeader({ floating = false }) {
  const { db } = useApp()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const loc = useLocation()
  const authed = !!(db.user && db.user.first)

  useEffect(() => { setOpen(false) }, [loc.pathname, loc.hash])
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  // با کلیک روی لینک داخلی، صفحه عوض نشود؛ فقط اسکرول نرم شود.
  const jumpTo = (e) => {
    e.preventDefault()
    const id = e.currentTarget.getAttribute('href')
    const el = id && id.length > 1 ? document.getElementById(id.slice(1)) : null
    if (!el) return
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
    setOpen(false)
  }

  // روی لندینگ همه‌چیز در همین صفحه است، پس لینک‌ها لنگر داخلی‌اند
  // تا با کلیک، صفحه عوض نشود و فقط اسکرول نرم انجام شود.
  const links = [
    { to: '#live', label: 'نمونه' },
    { to: '#features', label: 'امکانات' },
    { to: '#compare', label: 'مقایسه' },
    { to: '#pricing', label: 'تعرفه' },
    { to: '/download', label: 'دانلود' },
  ]

  return (
    <header className={'site-header' + (scrolled ? ' is-scrolled' : '') + (floating ? ' is-floating' : '')}>
      <div className="site-header-in">
        <Link to="/" className="site-brand" aria-label="روند — صفحه اصلی">
          <Logo size={44} tone="gradient" />
          <span className="site-brand-text">
            <b>{SITE.brand}</b>
            <i>{SITE.brandLatin}</i>
          </span>
        </Link>

        <nav className={'site-nav rv-glass' + (open ? ' open' : '')} aria-label="منوی اصلی">
          {links.map((l) => (
            l.to.startsWith('#')
              ? <a key={l.to} href={l.to} onClick={jumpTo} className="site-nav-link">{l.label}</a>
              : <NavLink key={l.to} to={l.to} className="site-nav-link">{l.label}</NavLink>
          ))}
          <div className="site-nav-cta">
            {authed
              ? <AppLink className="btn site-btn ghost" to="/app">ورود به اپ</AppLink>
              : <>
                <AppLink className="btn site-btn ghost" to="/login">ورود</AppLink>
                <AppLink className="btn site-btn" to="/login">ساخت حساب</AppLink>
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
