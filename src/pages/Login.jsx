import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthForm } from '../lib/useAuth'
import { useApp } from '../lib/store'
import { APP_NAME, APP_TAGLINE } from '../config/app.config'

const Sun = () => (
  <svg width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="var(--accent-warm)" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="4.4" />
    <path d="M12 2v2.4M12 19.6V22M2 12h2.4M19.6 12H22M4.9 4.9l1.7 1.7M17.4 17.4l1.7 1.7M19.1 4.9l-1.7 1.7M6.6 17.4l-1.7 1.7" />
  </svg>
)

export default function Login() {
  const f = useAuthForm()
  const { db } = useApp()
  const nav = useNavigate()
  const loc = useLocation()
  const [showPw, setShowPw] = useState(false)

  // اگر کاربر وارد شد، به مقصد درخواستی یا خانه اپ برو
  useEffect(() => {
    if (db.user && db.user.first) {
      nav(loc.state && loc.state.from ? loc.state.from : '/app', { replace: true })
    }
  }, [db.user, nav, loc.state])

  const err = f.errMsg
  const isSignup = f.mode === 'signup'

  return (
    <div className="login-page">
      <div className="login-page-bg" aria-hidden="true">
        <div className="login-glow login-glow-1" />
        <div className="login-glow login-glow-2" />
      </div>

      <Link to="/" className="login-back" aria-label="بازگشت به صفحه اصلی">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7" />
        </svg>
        بازگشت
      </Link>

      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 160, damping: 18 }}
      >
        <div className="login-sun">
          <Sun />
        </div>

        <div className="login-brand">
          <span className="brand-mark">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <circle cx="12" cy="12" r="9" /><path d="M12 7v5l3.2 1.8" />
            </svg>
          </span>
          <h1>{APP_NAME}</h1>
        </div>

        <p className="login-sub">{APP_TAGLINE}</p>

        <div className="auth-switch" role="tablist">
          <button
            type="button" role="tab" aria-selected={!isSignup}
            className={'auth-switch-btn' + (f.mode === 'login' ? ' on' : '')}
            onClick={() => f.setMode('login')}
          >ورود</button>
          <button
            type="button" role="tab" aria-selected={isSignup}
            className={'auth-switch-btn' + (f.mode === 'signup' ? ' on' : '')}
            onClick={() => f.setMode('signup')}
          >ساخت حساب</button>
        </div>

        <p className="auth-hint">
          {isSignup
            ? 'حساب بساز؛ عادت‌ها و یادداشت‌هایت روی همه دستگاه‌هایت می‌ماند.'
            : 'با ایمیل و رمز وارد شو.'}
        </p>

        <form onSubmit={f.submit} noValidate>
          {isSignup && (
            <>
              <div className="field">
                <label htmlFor="in-first">نام</label>
                <input className="input" id="in-first" value={f.firstName} onChange={(e) => f.setFirstName(e.target.value)}
                  autoComplete="given-name" maxLength={30} placeholder="مثلاً سارا" required />
              </div>
              <div className="field">
                <label htmlFor="in-last">نام خانوادگی <span className="opt">اختیاری</span></label>
                <input className="input" id="in-last" value={f.lastName} onChange={(e) => f.setLastName(e.target.value)}
                  autoComplete="family-name" maxLength={40} placeholder="مثلاً محمدی" />
              </div>
            </>
          )}

          <div className="field">
            <label htmlFor="in-email">ایمیل</label>
            <input className="input" id="in-email" type="email" dir="ltr" value={f.email} onChange={(e) => f.setEmail(e.target.value)}
              autoComplete="email" placeholder="you@example.com" required />
          </div>

          <div className="field">
            <label htmlFor="in-pw">رمز عبور</label>
            <div className="pw-wrap">
              <input className="input" id="in-pw" type={showPw ? 'text' : 'password'} dir="ltr" value={f.password}
                onChange={(e) => f.setPassword(e.target.value)}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                placeholder="حداقل ۶ کاراکتر" required minLength={6} />
              <button type="button" className="pw-toggle" onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? 'پنهان کردن رمز' : 'نمایش رمز'}>
                {showPw
                  ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /><path d="m3 3 18 18" /></svg>
                  : <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /></svg>}
              </button>
            </div>
          </div>

          {err && <div className="auth-error" role="alert">{err}</div>}

          <button className="btn auth-submit" type="submit" disabled={f.busy}>
            {f.busy ? 'لطفاً صبر کن…' : isSignup ? 'ساخت حساب و ورود' : 'ورود به روند'}
          </button>
        </form>

        <p className="login-foot">
          با ورود، <Link to="/site">قوانین و حریم خصوصی</Link> روند را می‌پذیرید.
        </p>
      </motion.div>
    </div>
  )
}
