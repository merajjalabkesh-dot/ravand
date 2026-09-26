import React, { useEffect, useState } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuthForm } from '../lib/useAuth'
import { useI18n } from '../lib/i18n'
import { useApp } from '../lib/store'
import Logo from '../components/site/Logo'

const Eye = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" />
  </svg>
)
const EyeOff = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7Z" /><circle cx="12" cy="12" r="3" /><path d="m3 3 18 18" />
  </svg>
)

export default function Login() {
  const f = useAuthForm()
  const { t, lang, setLang } = useI18n()
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

      <div className="login-top">
        <Link to="/" className="login-back" aria-label={t('auth.backAria')}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M19 12H5M12 19l-7-7 7-7" />
          </svg>
          {t('auth.back')}
        </Link>
        <div className="lang-switch mini" role="group" aria-label={t('settings.language')}>
          <button className={'lang-opt' + (lang === 'fa' ? ' sel' : '')} onClick={() => setLang('fa')} lang="fa" dir="rtl">فا</button>
          <button className={'lang-opt' + (lang === 'en' ? ' sel' : '')} onClick={() => setLang('en')} lang="en" dir="ltr">EN</button>
        </div>
      </div>

      <motion.div
        className="login-card"
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: 'spring', stiffness: 160, damping: 18 }}
      >
        <div className="login-sun">
          <Logo size={54} tone="gradient" glow />
        </div>

        <div className="login-brand">
          <h1>{t('nav.brand')}</h1>
        </div>

        <p className="login-sub">{t('app.tagline')}</p>

        <div className="auth-switch" role="tablist">
          <button type="button" role="tab" aria-selected={!isSignup}
            className={'auth-switch-btn' + (f.mode === 'login' ? ' on' : '')}
            onClick={() => f.setMode('login')}>{t('auth.login')}</button>
          <button type="button" role="tab" aria-selected={isSignup}
            className={'auth-switch-btn' + (f.mode === 'signup' ? ' on' : '')}
            onClick={() => f.setMode('signup')}>{t('auth.signup')}</button>
        </div>

        <p className="auth-hint">{isSignup ? t('auth.hintSignup') : t('auth.hintLogin')}</p>

        <form onSubmit={f.submit} noValidate>
          {isSignup && (
            <>
              <div className="field">
                <label htmlFor="in-first">{t('auth.name')}</label>
                <input className="input" id="in-first" value={f.firstName} onChange={(e) => f.setFirstName(e.target.value)}
                  autoComplete="given-name" maxLength={30} placeholder={t('auth.namePlaceholder')} required />
              </div>
              <div className="field">
                <label htmlFor="in-last">{t('auth.lastName')} <span className="opt">{t('auth.optional')}</span></label>
                <input className="input" id="in-last" value={f.lastName} onChange={(e) => f.setLastName(e.target.value)}
                  autoComplete="family-name" maxLength={40} placeholder={t('auth.lastNamePlaceholder')} />
              </div>
            </>
          )}

          <div className="field">
            <label htmlFor="in-email">{t('auth.email')}</label>
            <input className="input" id="in-email" type="email" dir="ltr" value={f.email} onChange={(e) => f.setEmail(e.target.value)}
              autoComplete="email" placeholder={t('auth.emailPlaceholder')} required />
          </div>

          <div className="field">
            <label htmlFor="in-pw">{t('auth.password')}</label>
            <div className="pw-wrap">
              <input className="input" id="in-pw" type={showPw ? 'text' : 'password'} dir="ltr" value={f.password}
                onChange={(e) => f.setPassword(e.target.value)}
                autoComplete={isSignup ? 'new-password' : 'current-password'}
                placeholder={t('auth.passwordPlaceholder')} required minLength={6} />
              <button type="button" className="pw-toggle" onClick={() => setShowPw((s) => !s)}
                aria-label={showPw ? t('auth.hidePw') : t('auth.showPw')}>
                {showPw ? <EyeOff /> : <Eye />}
              </button>
            </div>
          </div>

          {err && <div className="auth-error" role="alert">{err}</div>}

          <button className="btn auth-submit" type="submit" disabled={f.busy}>
            {f.busy ? t('auth.waiting') : isSignup ? t('auth.signupAndEnter') : t('auth.enterRavand')}
          </button>
        </form>

        <p className="login-foot">
          {t('auth.acceptTerms')} <Link to="/site">{t('auth.termsLink')}</Link> {t('auth.acceptTerms2')}
        </p>
      </motion.div>
    </div>
  )
}
