import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import GlyphPortal from '../components/ui/glyph-portal'
import PortalVideo from '../components/PortalVideo'
import { useApp } from '../lib/store'
import { api, setToken } from '../lib/apiClient'

const family = '"Vazirmatn", Arial, sans-serif'
let fontLoaded = null

export default function Landing() {
  const { mutate, toast } = useApp()
  const [face, setFace] = useState(null)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState('login') // login | signup
  const [busy, setBusy] = useState(false)
  const [errMsg, setErrMsg] = useState('')

  // Must wait for Vazirmatn to be loaded before mounting the portal,
  // otherwise the component's internal font check fails and it freezes scroll.
  const fontFaceName = 'Vazirmatn'
  const faceStack = `'${fontFaceName}', Arial, sans-serif`
  useEffect(() => {
    let settled = false
    const finish = (value) => { if (!settled) { settled = true; setFace(value) } }
    const ready = () => {
      try {
        if (document.fonts && document.fonts.check('700 100px ' + fontFaceName, 'ravand')) { return finish(faceStack) }
      } catch (e) { /* ignore */ }
      finish(faceStack)
    }
    try {
      if (document.fonts) {
        // wait for ALL fonts (incl. Vazirmatn) to be ready, then mount
        document.fonts.ready.then(ready)
        const t = setTimeout(() => finish(faceStack), 2000)
        return () => { settled = true; clearTimeout(t) }
      }
    } catch (e) { /* ignore */ }
    finish(faceStack)
    return () => { settled = true }
  }, [])

  const afterAuth = async (token, user, modeLabel) => {
  setToken(token)
  const fallbackFirst = (user && user.name) || email.trim().split('@')[0] || 'کاربر'
  mutate((d) => { d.user = { first: fallbackFirst, last: (user && user.last) || '', email: user && user.email ? user.email : email.trim() } })
  toast(modeLabel === 'login' ? 'خوش آمدی 👋' : modeLabel === 'signup' ? 'حساب ساخته شد 🌱' : 'کد تأیید شد ✅')
}

const submit = async (e) => {
  e.preventDefault()
  setErrMsg('')
  setBusy(true)
  try {
    if (mode === 'signup') {
      if (!firstName.trim()) { setErrMsg('نامت را بنویس'); setBusy(false); return }
      const r = await api.register(email.trim(), password, firstName.trim(), lastName.trim())
      await afterAuth(r.token, r.user, 'signup')
    } else {
      // login
      if (!email.trim() || !password.trim()) { setErrMsg('ایمیل و رمز را بنویس'); setBusy(false); return }
      const r = await api.login(email.trim(), password)
      await afterAuth(r.token, r.user, 'login')
    }
  } catch (err) {
    console.warn('auth err', err.message, err.status)
    setErrMsg(
      (err.status === 401 && err.message === 'wrong-password') ? 'رمز عبور اشتباه است'
      : (err.status === 401 && err.message === 'user-not-found') ? 'با این ایمیل هنوز اکانتی ساخته نشده — اول «ساخت حساب» را بزن'
      : (err.status === 409) ? 'با این ایمیل از قبل اکانت ساخته‌ای — به ورود برو'
      : (err.status === 400 && err.message === 'weak-password') ? 'رمز باید حداقل ۶ کاراکتر باشد'
      : 'خطا — ' + (err.message || 'نامشخص')
    )
  } finally { setBusy(false) }
}

  return (
    <div style={{ minHeight: '100vh', background: '#0a0f1f', color: '#0c1212' }}>
      {face ? <GlyphPortal
        word="Ravand"
        fontFamily={face}
        fontWeight={700}
        scrollLength={3.2}
        interactive={false}
        focusChar="n"
        annotations={false}
        enterLabel=""
        background={<PortalVideo />}
        style={{ '--gp-paper': '#0a0f1f', '--gp-ink': '#cfe0ff', '--gp-field': '#0a0f1f' }}
        front={
          <div style={{ position: 'absolute', inset: 'auto 24px 7% 24px', textAlign: 'center' }}>
            <p style={{ margin: '0 auto', fontSize: 'clamp(20px, 3vw, 30px)', fontWeight: 600, lineHeight: 1.5, color: 'rgba(207,224,255,.9)', textShadow: '0 2px 18px rgba(10,15,31,.8)', maxWidth: 420 }}>عادت‌هایت را بساز، روندت را ببین.</p>
            <p style={{ margin: '12px auto 0', fontSize: 14, lineHeight: 1.5, color: 'rgba(160,175,205,.7)', maxWidth: 420 }}>اسکرول کنید <span style={{ display: 'inline-block', transform: 'translateY(1px)' }}>↓</span></p>
          </div>
        }
      >
        <div className="gp-landing-wrap" style={{ width: '100%', minHeight: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 'clamp(1.2rem,3svh,2.2rem)', margin: 'auto', position: 'relative', zIndex: 2 }}>
          <div className="landing-brand" style={{ textAlign: 'center', pointerEvents: 'none' }}>
            <div style={{ fontSize: 'clamp(30px, 5vw, 44px)', fontWeight: 800, letterSpacing: '-.03em', color: 'rgba(200,220,255,.95)', textShadow: '0 0 30px rgba(120,170,255,.5)', lineHeight: 1.2 }}>روند</div>
            <div style={{ fontSize: 13, color: 'rgba(150,180,225,.7)', marginTop: 8, letterSpacing: '.05em', textTransform: 'uppercase' }}>Ravand · Daily Routine</div>
          </div>
          <form className="landing-form" onSubmit={submit} style={{ width: 'min(100%, 26rem)', display: 'flex', flexDirection: 'column', gap: 12, padding: 'clamp(20px, 4vw, 30px)', background: 'rgba(10,18,38,.65)', border: '1px solid rgba(140,170,235,.25)', borderRadius: 22, backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)', boxShadow: '0 12px 60px rgba(0,0,0,.55)' }}>
            <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 2, color: 'rgba(200,222,255,.95)' }}>
              {mode === 'signup' ? 'ساخت حساب' : 'ورود به روند'}
            </div>
            <div style={{ fontSize: 13, color: 'rgba(150,180,225,.75)', marginBottom: 8 }}>
              {mode === 'signup' ? 'نامت را بگو و حساب بساز؛ عادت‌ها و ژورنالت در ابر می‌ماند.' : 'با ایمیل و رمز وارد شو؛ داده‌هات در ابر می‌ماند.'}
            </div>
            <div style={{ display: 'flex', gap: 8, marginBottom: 2 }}>
              <button type="button" className={'auth-toggle' + (mode === 'login' ? ' on' : '')} onClick={() => setMode('login')}>ورود</button>
              <button type="button" className={'auth-toggle' + (mode === 'signup' ? ' on' : '')} onClick={() => setMode('signup')}>ساخت حساب</button>
            </div>
            {mode === 'signup' && (
              <>
                <input className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} autoComplete="given-name" maxLength={30} placeholder="نام" style={{ color: '#0c1212', background: '#fff', border: '1px solid #ccc' }} />
                <input className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} autoComplete="family-name" maxLength={40} placeholder="نام خانوادگی (اختیاری)" style={{ color: '#0c1212', background: '#fff', border: '1px solid #ccc' }} />
              </>
            )}
            <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="ایمیل" required style={{ color: '#0c1212', background: '#fff', border: '1px solid #ccc' }} />
            <input className="input" type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete={mode === 'login' ? 'current-password' : 'new-password'} placeholder="رمز (حداقل ۶ کاراکتر)" required minLength={6} style={{ color: '#0c1212', background: '#fff', border: '1px solid #ccc' }} />
            <button type="submit" disabled={busy} style={{ width: '100%', padding: '13px 20px', borderRadius: 14, background: 'linear-gradient(135deg, #6fa8ff, #8a5cf6)', color: '#fff', fontWeight: 700, fontSize: 15, cursor: 'pointer', border: 'none', boxShadow: '0 8px 30px rgba(90,120,255,.4)', opacity: busy ? .7 : 1 }}>
              {busy ? '…' : (mode === 'signup' ? 'ساخت حساب و ورود' : 'ورود به روند')}
            </button>
            {errMsg && <div className="landing-err">{errMsg}</div>}
          </form>
        </div>
      </GlyphPortal> : <div role="status" style={{ height: "100vh", display: "grid", placeItems: "center", background: "#0a0f1f", color: "#9fb7e0", fontSize: 14 }}>در حال آماده‌سازی…</div>}
    </div>
  )
}
