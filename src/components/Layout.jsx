import React, { useState, useEffect } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useApp } from '../lib/store'
import { useI18n } from '../lib/i18n'
import UpdateBanner from './UpdateBanner'

const NAV = [
  { to: '/app', key: 'nav.home', icon: '<path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h5v-6h4v6h5V9.5"/>' },
  { to: '/app/today', key: 'nav.today', icon: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 1.8"/>' },
  { to: '/app/habits', key: 'nav.habits', icon: '<path d="M4 19V5"/><path d="M9 19v-6"/><path d="M14 19V8"/><path d="M19 19v-10"/>' },
  { to: '/app/reports', key: 'nav.reports', icon: '<path d="M3 3v18h18"/><rect x="7" y="12" width="3" height="6" rx="1"/><rect x="12" y="8" width="3" height="10" rx="1"/><rect x="17" y="5" width="3" height="13" rx="1"/>' },
  { to: '/app/journal', key: 'nav.journal', icon: '<path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z"/><path d="M5 4a2 2 0 0 0-2 2v12"/><path d="M9 8h6"/><path d="M9 12h6"/>' },
  { to: '/app/wake', key: 'nav.wake', icon: '<path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/><circle cx="12" cy="12" r="4"/>' },
  { to: '/app/settings', key: 'nav.settings', icon: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>' },
]

const Svg = ({ d }) => (
  <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <g dangerouslySetInnerHTML={{ __html: d }} />
  </svg>
)


export default function Layout({ children }) {
  const { db, mutate, toast, signOutWithBackend } = useApp()
  const { t } = useI18n()
  const loc = useLocation()

  const logout = () => {
    if (!confirm(t('nav.logoutConfirm'))) return
    signOutWithBackend && signOutWithBackend()
    mutate((d) => { d.user = null })
    toast(t('nav.logoutToast'))
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand-mark">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 1.8"/></svg>
          </span>
          <div>
            <div className="brand-name">{t('nav.brand')}</div>
            <div className="brand-sub">{t('nav.brandSub')}</div>
          </div>
        </div>

        <nav className="nav">
          {NAV.map((n) => (
            <Link key={n.to} to={n.to} className={'navlink' + (loc.pathname === n.to ? ' active' : '')}>
              <Svg d={n.icon} /> {t(n.key)}
            </Link>
          ))}
          <button className="navlink logout-nav" onClick={logout} title={t('nav.logout')}>
            <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>
            <span className="logout-label">{t('nav.logout')}</span>
          </button>
        </nav>

        <div className="sidebar-user">
          <span className="avatar">{db.user ? (db.user.first.replace(/[^A-Za-zآ-ی]/g, '').charAt(0) || db.user.first.charAt(0)) : t('nav.avatarFallback')}</span>
          <span className="avatar-name">{db.user ? db.user.first + ' ' + (db.user.last || '') : t('nav.nameFallback')}</span>
          <button className="logout" onClick={logout} title={t('nav.logout')}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg>
          </button>
        </div>
      </aside>

      <main className="main">
        {/* نوار به‌روزرسانی — یک‌جا این‌جاست، پس روی همهٔ صفحه‌های /app/* دیده می‌شود */}
        <UpdateBanner />
        {children}
      </main>

      {/* 
       * نوار پایین موبایل. روی دسکتاپ پنهان است و سایدبار کار می‌کند.
       * همان هفت آیکون سایدبار، ولی بدون متن و در یک ردیف افقی.
       */}
      <nav className="app-tabbar" aria-label={t('nav.brand')}>
        {NAV.map((n) => (
          <Link key={n.to} to={n.to} className={'app-tab' + (loc.pathname === n.to ? ' active' : '')} aria-label={t(n.key)}>
            <Svg d={n.icon} />
            <span className="app-tab-label">{t(n.key)}</span>
          </Link>
        ))}
        <button className="app-tab app-tab-out" onClick={logout} aria-label={t('nav.logout')} title={t('nav.logout')}>
          <svg width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>
          <span className="app-tab-label">{t('nav.logout')}</span>
        </button>
      </nav>
    </div>
  )
}