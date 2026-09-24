import React from 'react'
import { motion } from 'framer-motion'
import { useApp, ACCENTS, notifySupported, notifyPermission, requestNotifyPermission } from '../lib/store'
import { THEMES } from '../config/themes'

const fadeUp = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 10 }, transition: { duration: .35, ease: [0.22, 1, 0.36, 1] } }

const ACCENT_NAMES = { purple: 'بنفش', teal: 'فیروزه‌ای', sakura: 'صورتی', ocean: 'آبی', amber: 'کهربایی', emerald: 'زمردی' }

const NOTIF_LABEL = { granted: 'فعال', denied: 'مسدود', default: 'خواسته نشده' }

export default function Settings() {
  const { db, mutate, toast } = useApp()
  const s = db.settings

  const setAccent = (v) => { mutate((d) => { d.settings.accent = v }); toast('رنگ تغییر کرد') }
  const setFont = (v) => { mutate((d) => { d.settings.fontScale = v }); toast('اندازه فونت تغییر کرد') }
  const setTheme = (tid) => { mutate((d) => { d.settings.theme = tid }); toast('تم تغییر کرد') }
  const toggle = async (k) => {
    if (k === 'notify' && !db.settings.notify) {
      if (!notifySupported()) { toast('مرورگرت از اعلان پشتیبانی نمی‌کند'); return }
      const perm = await requestNotifyPermission()
      if (perm !== 'granted') { toast('برای دریافت اعلان، اجازه را در مرورگر بده'); return }
    }
    mutate((d) => { d.settings[k] = !d.settings[k] })
    toast(k === 'sound' ? (db.settings.sound ? 'صدا خاموش شد' : 'صدا روشن شد') : k === 'notify' ? 'اعلان فعال شد' : 'تنظیم شد')
  }

  const exportData = () => {
    const blob = new Blob([JSON.stringify(db, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = 'roozegar-backup-' + new Date().toISOString().split('T')[0] + '.json'
    a.click()
    setTimeout(() => URL.revokeObjectURL(a.href), 3000)
    toast('فایل پشتیبان ساخته شد')
  }
  const importData = (file) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result)
        if (!data || typeof data !== 'object') throw 0
        mutate((d) => { Object.assign(d, data) })
        toast('داده‌ها با موفقیت بازیابی شد')
      } catch (e) { toast('فایل پشتیبان نامعتبر است') }
    }
    reader.readAsText(file)
  }

  return (
    <motion.div variants={{ animate: { transition: { staggerChildren: 0.05 } } }} initial="initial" animate="animate" exit="exit">
      <motion.div variants={fadeUp} className="page-head"><h1>تنظیمات</h1><div className="sub">ظاهر اپ، صدا و پشتیبان‌گیری از داده‌هایت.</div></motion.div>

      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title">ظاهر</div>
        <div className="setting-row">
          <div className="setting-title"><b>تم رنگی</b><span>بک‌گراند و باکس‌های کل اپ را با هم عوض کن</span></div>
          <div className="theme-picker">
            {THEMES.map((t) => (
              <button key={t.id} className={'theme-card' + (s.theme === t.id ? ' sel' : '')} onClick={() => setTheme(t.id)}>
                <span className="theme-swatches">
                  <span className="theme-swatch" style={{ background: t.bg }} />
                  <span className="theme-swatch" style={{ background: t.glass !== 'rgba(255,255,255,.05)' ? t.glass : (t.mode === 'light' ? 'rgba(255,255,255,.6)' : 'rgba(255,255,255,.08)') }} />
                  <span className="theme-swatch accent" style={{ background: t.accent }} />
                </span>
                <span className="theme-name">{t.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-title"><b>رنگ اصلی</b><span>رنگ تأکیدی کل اپ را عوض کن</span></div>
          <div className="app-accent-swatches">
            {Object.entries(ACCENTS).map(([k, v]) => (
              <button key={k} className={'app-swatch' + (s.accent === v ? ' sel' : '')} style={{ background: v }} onClick={() => setAccent(v)} title={ACCENT_NAMES[k]} aria-label={'رنگ ' + ACCENT_NAMES[k]} />
            ))}
          </div>
        </div>
        <div className="setting-row">
          <div className="setting-title"><b>اندازه فونت</b><span>بزرگ‌نمایی متن برای خوانایی بیشتر</span></div>
          <div className="font-scale-pills">
            {[['کوچک', 0.9], ['عادی', 1], ['بزرگ', 1.2], ['خیلی بزرگ', 1.4]].map(([l, v]) => (
              <button key={v} className={'fsize-pill' + (s.fontScale === v ? ' sel' : '')} onClick={() => setFont(v)}>{l}</button>
            ))}
          </div>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title">تعامل</div>
        <div className="setting-row">
          <div className="setting-title"><b>صدا</b><span>صدای ظریف هنگام تیک‌زدن عادت‌ها</span></div>
          <button className={'switch' + (s.sound ? ' on' : '')} onClick={() => toggle('sound')} role="switch" aria-checked={!!s.sound} />
        </div>
        <div className="setting-row">
          <div className="setting-title"><b>اعلان مرورگر</b><span>هنگام کامل‌شدن روز یا رکورد جدید پیام بگیر</span><span style={{ fontSize: 11, color: 'var(--muted)' }}>وضعیت: {notifySupported() ? NOTIF_LABEL[notifyPermission()] || '—' : 'پشتیبانی نمی‌شود'}</span></div>
          <button className={'switch' + (s.notify ? ' on' : '')} onClick={() => toggle('notify')} role="switch" aria-checked={!!s.notify} disabled={!notifySupported()} />
        </div>
        <div className="setting-row">
          <div className="setting-title"><b>یادآوری بیدار شدی؟</b><span>اگر سر ساعتِ معمولت بیدار نشدی، اعلان بفرست</span></div>
          <button className={'switch' + (s.wakeNotify ? ' on' : '')} onClick={() => toggle('wakeNotify')} role="switch" aria-checked={!!s.wakeNotify} />
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title">داده‌ها</div>
        <div className="setting-row">
          <div className="setting-title"><b>پشتیبان‌گیری</b><span>همهٔ عادت‌ها، تاریخچه و ژورنال را به‌صورت فایل JSON خروجی بگیر</span></div>
          <button className="btn ghost" onClick={exportData}>خروجی JSON</button>
        </div>
        <div className="setting-row">
          <div className="setting-title"><b>بازیابی</b><span>فایل پشتیبان را انتخاب کن تا داده‌ها جایگزین شوند</span></div>
          <label className="btn ghost" style={{ display: 'inline-flex' }}>
            بازیابی فایل
            <input type="file" accept=".json,application/json" style={{ display: 'none' }} onChange={(e) => { if (e.target.files[0]) importData(e.target.files[0]) }} />
          </label>
        </div>
      </motion.div>
    </motion.div>
  )
}