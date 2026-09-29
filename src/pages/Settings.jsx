import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp, ACCENTS, notifySupported, notifyPermission, requestNotifyPermission } from '../lib/store'
import { useI18n } from '../lib/i18n'
import { api } from '../lib/apiClient'
import { THEMES } from '../config/themes'

const fadeUp = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 10 }, transition: { duration: .35, ease: [0.22, 1, 0.36, 1] } }

const ACCENT_KEYS = { purple: 'settings.accent_purple', teal: 'settings.accent_teal', sakura: 'settings.accent_sakura', ocean: 'settings.accent_ocean', amber: 'settings.accent_amber', emerald: 'settings.accent_emerald' }

/** هر تم یک کلید ترجمه دارد؛ اگر نبود، نام اصلی تم می‌ماند */
const THEME_KEYS = { midnight: 'settings.theme_midnight', ocean: 'settings.theme_ocean', berry: 'settings.theme_berry', lilac: 'settings.theme_lilac', cream: 'settings.theme_cream', pinky: 'settings.theme_pinky' }

const FONT_STEPS = [['settings.fontSize_small', 0.9], ['settings.fontSize_normal', 1], ['settings.fontSize_large', 1.2], ['settings.fontSize_xlarge', 1.4]]

export default function Settings() {
  const { db, mutate, toast } = useApp()
  const { t, lang, setLang } = useI18n()
  const s = db.settings

  /* ---------- رمز عبور ---------- */
  const [pwOpen, setPwOpen] = useState(false)
  const [cur, setCur] = useState('')
  const [nw, setNw] = useState('')
  const [nw2, setNw2] = useState('')
  const [pwBusy, setPwBusy] = useState(false)
  const [pwErr, setPwErr] = useState('')
  const [showPw, setShowPw] = useState(false)

  const setAccent = (v) => { mutate((d) => { d.settings.accent = v }); toast(t('settings.toastAccent')) }
  const setFont = (v) => { mutate((d) => { d.settings.fontScale = v }); toast(t('settings.toastFont')) }
  const setTheme = (tid) => { mutate((d) => { d.settings.theme = tid }); toast(t('settings.toastTheme')) }

  const toggle = async (k) => {
    if (k === 'notify' && !db.settings.notify) {
      if (!notifySupported()) { toast(t('settings.toastNotifyUnsupported')); return }
      const perm = await requestNotifyPermission()
      if (perm !== 'granted') { toast(t('settings.toastNotifyNeedPermission')); return }
    }
    mutate((d) => { d.settings[k] = !d.settings[k] })
    toast(k === 'sound' ? (db.settings.sound ? t('settings.toastSoundOff') : t('settings.toastSoundOn')) : k === 'notify' ? t('settings.toastNotifyOn') : t('settings.toastGeneric'))
  }

  const closePw = () => {
    setPwOpen(false); setCur(''); setNw(''); setNw2(''); setPwErr(''); setShowPw(false)
  }

  const submitPw = async (e) => {
    e.preventDefault()
    setPwErr('')
    if (nw.length < 6) { setPwErr(t('settings.pwTooShort')); return }
    if (nw !== nw2) { setPwErr(t('settings.pwMismatch')); return }
    if (!cur) { setPwErr(t('settings.pwRequired')); return }
    setPwBusy(true)
    try {
      await api.changePassword(cur, nw)
      toast(t('settings.pwChanged'))
      closePw()
    } catch (err) {
      console.warn('change-password err', err.message, err.status)
      setPwErr(
        err.status === 401 ? t('settings.pwWrongCurrent')
        : err.status === 400 && err.message === 'weak-password' ? t('settings.pwTooShort')
        : err.status === 400 && err.message === 'same-password' ? t('settings.pwSame')
        : t('settings.pwError')
      )
    } finally { setPwBusy(false) }
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'ravand-backup-' + new Date().toISOString().split('T')[0] + '.json'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 3000)
    toast(t('settings.toastBackupCreated'))
  }

  const importData = (file) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!data || typeof data !== 'object') throw 0
        mutate((d) => { Object.assign(d, data) })
        toast(t('settings.toastRestoreOk'))
      } catch (e) { toast(t('settings.toastRestoreFail')) }
    }
    reader.readAsText(file)
  }

  const notifStatus = !notifySupported() ? t('settings.notifyStatus_unsupported')
    : t('settings.notifyStatus_' + (notifyPermission() || 'notRequested'))

  return (
    <motion.div variants={{ animate: { transition: { staggerChildren: 0.05 } } }} initial="initial" animate="animate" exit="exit">
      <motion.div variants={fadeUp} className="page-head">
        <h1>{t('settings.title')}</h1>
        <div className="sub">{t('settings.subtitle')}</div>
      </motion.div>

      {/* ---------- ظاهر ---------- */}
      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title">{t('settings.sectionAppearance')}</div>

        <div className="setting-row">
          <div className="setting-title"><b>{t('settings.theme')}</b><span>{t('settings.themeHint')}</span></div>
          <div className="theme-picker">
            {THEMES.map((th) => (
              <button
                key={th.id}
                className={'theme-card' + (s.theme === th.id ? ' sel' : '')}
                onClick={() => setTheme(th.id)}
                title={THEME_KEYS[th.id] ? t(THEME_KEYS[th.id]) : th.name}
                aria-label={THEME_KEYS[th.id] ? t(THEME_KEYS[th.id]) : th.name}
                aria-pressed={s.theme === th.id}
              >
                {/* یک باکس به‌جای دو خط: کل رنگ‌های تم در یک طیف گرادیانی
                    کنار هم، تا انتخاب با یک نگاه و بر اساس سلیقه باشد. */}
                <span className="theme-spectrum" style={{ background: `linear-gradient(135deg, ${th.bg} 0%, ${th.bg2} 34%, ${th.accent} 68%, ${th.accent2} 100%)` }} />
                <span className="theme-name">{THEME_KEYS[th.id] ? t(THEME_KEYS[th.id]) : th.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-title"><b>{t('settings.accent')}</b><span>{t('settings.accentHint')}</span></div>
          <div className="app-accent-swatches">
            {Object.entries(ACCENTS).map(([k, v]) => (
              <button
                key={k} className={'app-swatch' + (s.accent === v ? ' sel' : '')} style={{ background: v }}
                onClick={() => setAccent(v)}
                title={t(ACCENT_KEYS[k] || k)} aria-label={t('settings.accentAriaLabel', { name: t(ACCENT_KEYS[k] || k) })}
              />
            ))}
          </div>
        </div>

        <div className="setting-row">
          <div className="setting-title"><b>{t('settings.fontSize')}</b><span>{t('settings.fontSizeHint')}</span></div>
          <div className="font-scale-pills">
            {FONT_STEPS.map(([key, v]) => (
              <button key={v} className={'fsize-pill' + (s.fontScale === v ? ' sel' : '')} onClick={() => setFont(v)}>{t(key)}</button>
            ))}
          </div>
        </div>

        {/* ---------- زبان ---------- */}
        <div className="setting-row">
          <div className="setting-title"><b>{t('settings.language')}</b><span>{t('settings.languageHint')}</span></div>
          <div className="lang-switch" role="group" aria-label={t('settings.language')}>
            <button className={'lang-opt' + (lang === 'fa' ? ' sel' : '')} onClick={() => setLang('fa')} lang="fa" dir="rtl">فارسی</button>
            <button className={'lang-opt' + (lang === 'en' ? ' sel' : '')} onClick={() => setLang('en')} lang="en" dir="ltr">English</button>
          </div>
        </div>
      </motion.div>

      {/* ---------- حساب کاربری ---------- */}
      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title">{t('settings.sectionAccount')}</div>
        <div className="setting-row">
          <div className="setting-title">
            <b>{t('settings.changePassword')}</b>
            <span>{t('settings.changePasswordHint')}</span>
          </div>
          {!pwOpen
            ? <button className="btn ghost" onClick={() => setPwOpen(true)}>{t('settings.changePassword')}</button>
            : null}
        </div>

        {pwOpen && (
          <form className="pw-form" onSubmit={submitPw} noValidate>
            <div className="field">
              <label htmlFor="pw-cur">{t('settings.pwCurrent')}</label>
              <input className="input" id="pw-cur" type={showPw ? 'text' : 'password'} dir="ltr"
                value={cur} onChange={(e) => setCur(e.target.value)} autoComplete="current-password" required />
            </div>
            <div className="field">
              <label htmlFor="pw-new">{t('settings.pwNew')}</label>
              <input className="input" id="pw-new" type={showPw ? 'text' : 'password'} dir="ltr"
                value={nw} onChange={(e) => setNw(e.target.value)} autoComplete="new-password" minLength={6} required />
            </div>
            <div className="field">
              <label htmlFor="pw-new2">{t('settings.pwRepeat')}</label>
              <input className="input" id="pw-new2" type={showPw ? 'text' : 'password'} dir="ltr"
                value={nw2} onChange={(e) => setNw2(e.target.value)} autoComplete="new-password" minLength={6} required />
            </div>
            {pwErr && <div className="auth-error" role="alert">{pwErr}</div>}
            <div className="pw-form-btns">
              <label className="pw-show-toggle">
                <input type="checkbox" checked={showPw} onChange={(e) => setShowPw(e.target.checked)} />
                {t('settings.pwShow')}
              </label>
              <span style={{ flex: 1 }} />
              <button type="button" className="btn ghost" onClick={closePw}>{t('settings.cancel')}</button>
              <button type="submit" className="btn" disabled={pwBusy}>{pwBusy ? '…' : t('settings.pwSave')}</button>
            </div>
          </form>
        )}
      </motion.div>

      {/* ---------- تعامل ---------- */}
      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title">{t('settings.sectionInteraction')}</div>
        <div className="setting-row">
          <div className="setting-title"><b>{t('settings.sound')}</b><span>{t('settings.soundHint')}</span></div>
          <button className={'switch' + (s.sound ? ' on' : '')} onClick={() => toggle('sound')} role="switch" aria-checked={!!s.sound} />
        </div>
        <div className="setting-row">
          <div className="setting-title">
            <b>{t('settings.browserNotify')}</b><span>{t('settings.browserNotifyHint')}</span>
            <span style={{ fontSize: 11, color: 'var(--muted)' }}>{t('settings.notifyStatus', { status: notifStatus })}</span>
          </div>
          <button className={'switch' + (s.notify ? ' on' : '')} onClick={() => toggle('notify')} role="switch" aria-checked={!!s.notify} disabled={!notifySupported()} />
        </div>
        <div className="setting-row">
          <div className="setting-title"><b>{t('settings.wakeNotify')}</b><span>{t('settings.wakeNotifyHint')}</span></div>
          <button className={'switch' + (s.wakeNotify ? ' on' : '')} onClick={() => toggle('wakeNotify')} role="switch" aria-checked={!!s.wakeNotify} />
        </div>
      </motion.div>

      {/* ---------- داده‌ها ---------- */}
      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title">{t('settings.sectionData')}</div>
        <div className="setting-row">
          <div className="setting-title"><b>{t('settings.backup')}</b><span>{t('settings.backupHint')}</span></div>
          <button className="btn ghost" onClick={exportData}>{t('settings.exportJson')}</button>
        </div>
        <div className="setting-row">
          <div className="setting-title"><b>{t('settings.restore')}</b><span>{t('settings.restoreHint')}</span></div>
          <label className="btn ghost" style={{ display: 'inline-flex' }}>
            {t('settings.restoreFile')}
            <input type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => { if (e.target.files[0]) importData(e.target.files[0]) }} />
          </label>
        </div>
      </motion.div>
    </motion.div>
  )
}
