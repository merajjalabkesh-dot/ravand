import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp } from '../lib/store'

const Sun = () => (
  <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--accent-warm)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4.4"></circle>
    <path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7"></path>
  </svg>
)

export default function Login() {
  const { db, mutate, toast } = useApp()
  const [first, setFirst] = useState('')
  const [last, setLast] = useState('')

  const submit = (e) => {
    e.preventDefault()
    if (!first.trim()) { toast('نامت را بنویس'); return }
    mutate((d) => { d.user = { first: first.trim(), last: last.trim() } })
    toast('خوش آمدی 🌱')
  }

  return (
    <div id="login-screen" style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', padding: 20 }}>
      <motion.div className="login-card"
        initial={{ opacity: 0, y: 24, scale: .96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 160, damping: 18 }}
        style={{ width: '100%', maxWidth: 440, background: 'rgba(18,20,28,.85)', backdropFilter: 'blur(28px)', border: '1px solid var(--glass-border)', borderRadius: 26, padding: '38px 32px', boxShadow: 'var(--glow)' }}>
        <div className="login-sun" style={{ display: 'flex', justifyContent: 'center', marginBottom: 10, filter: 'drop-shadow(0 0 18px var(--accent-glow))' }}>
          <Sun />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <span className="brand-mark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 1.8"/></svg>
          </span>
          <h1 style={{ fontSize: 31, fontWeight: 900, letterSpacing: '-.4px' }}>روند</h1>
        </div>
        <p style={{ color: 'var(--muted)', fontSize: 14, margin: '6px 0 28px', lineHeight: 1.7 }}>عادت‌ها، کارهای روزانه و ژورنال — همه در یک خانهٔ شیشه‌ای.</p>
        <form onSubmit={submit}>
          <div className="field">
            <label htmlFor="in-first">نام</label>
            <input className="input" id="in-first" value={first} onChange={(e) => setFirst(e.target.value)} autoComplete="given-name" maxLength={30} placeholder="مثلاً سارا" required />
          </div>
          <div className="field">
            <label htmlFor="in-last">نام خانوادگی</label>
            <input className="input" id="in-last" value={last} onChange={(e) => setLast(e.target.value)} autoComplete="family-name" maxLength={40} placeholder="مثلاً محمدی" />
          </div>
          <button className="btn" style={{ width: '100%' }} type="submit">شروع روزِ من</button>
          <p className="glass-hint" style={{ textAlign: 'center' }}>نسخهٔ دمو — بدون ایمیل و شماره؛ فقط نامت را نگه می‌داریم تا دفعهٔ بعد هم بشناسیمت.</p>
        </form>
      </motion.div>
    </div>
  )
}