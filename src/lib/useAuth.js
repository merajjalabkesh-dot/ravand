import { useState, useCallback } from 'react'
import { useApp } from './store'
import { api, setToken } from './apiClient'

/**
 * منطق احراز هویت مشترک بین صفحه /login و اپ.
 * ورود، ثبت‌نام و همگام‌سازی داده‌های محلی با سرور.
 */
export function useAuthForm() {
  const { mutate, toast } = useApp()
  const [mode, setMode] = useState('login') // login | signup
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [busy, setBusy] = useState(false)
  const [errMsg, setErrMsg] = useState('')

  /** بعد از ورود موفق: داده سرور را می‌گیرد، در صورت خالی بودن داده محلی را می‌فرستد */
  const afterAuth = useCallback(async (token, user, modeLabel) => {
    setToken(token)
    const fallbackFirst = (user && user.name) || email.trim().split('@')[0] || 'کاربر'
    try {
      const me = await api.me()
      const remote = (me && me.data) || {}
      const remoteHasData = remote.habits || remote.days || remote.events || remote.settings
      if (remoteHasData) {
        mutate((d) => {
          const localUser = d.user
          Object.assign(d, remote)
          d.user = { ...(d.user || {}), ...(localUser || {}) }
          d.user.first = d.user.first || fallbackFirst
          d.user.email = (user && user.email) || d.user.email || email.trim()
          d.settings = Object.assign({}, d.settings || {}, remote.settings || {})
        })
      } else {
        // سرور خالی -> داده محلی (اگر هست) ارسال می‌شود
        mutate((d) => {
          d.user = { first: fallbackFirst, last: (user && user.last) || '', email: (user && user.email) || email.trim() }
        })
      }
    } catch (e) {
      console.warn('afterAuth me failed', e.message)
      mutate((d) => { d.user = { first: fallbackFirst, last: (user && user.last) || '', email: (user && user.email) || email.trim() } })
    }
    toast(modeLabel === 'login' ? 'خوش آمدی 👋' : 'حساب ساخته شد 🌱')
  }, [email, mutate, toast])

  const submit = useCallback(async (e) => {
    e.preventDefault()
    setErrMsg('')
    setBusy(true)
    try {
      if (mode === 'signup') {
        if (!firstName.trim()) { setErrMsg('نامت را بنویس'); setBusy(false); return }
        const r = await api.register(email.trim(), password, firstName.trim(), lastName.trim())
        await afterAuth(r.token, r.user, 'signup')
      } else {
        if (!email.trim() || !password.trim()) { setErrMsg('ایمیل و رمز را بنویس'); setBusy(false); return }
        const r = await api.login(email.trim(), password)
        await afterAuth(r.token, r.user, 'login')
      }
    } catch (err) {
      console.warn('auth err', err.message, err.status)
      setErrMsg(
        (err.status === 401 && err.message === 'wrong-password') ? 'رمز عبور اشتباه است'
        : (err.status === 401 && err.message === 'user-not-found') ? 'با این ایمیل هنوز اکانتی ساخته نشده — اول «ساخت حساب» را بزن'
        : (err.status === 409) ? 'با ایمیل از قبل اکانت ساخته‌ای — به ورود برو'
        : (err.status === 400 && err.message === 'weak-password') ? 'رمز باید حداقل ۶ کاراکتر باشد'
        : 'خطا — ' + (err.message || 'نامشخص')
      )
    } finally { setBusy(false) }
  }, [mode, firstName, lastName, email, password, afterAuth])

  const reset = useCallback(() => {
    setErrMsg('')
    setPassword('')
  }, [])

  return {
    mode, setMode,
    firstName, setFirstName,
    lastName, setLastName,
    email, setEmail,
    password, setPassword,
    busy, errMsg,
    submit, reset,
  }
}
