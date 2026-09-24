import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp, toFa, todayISO, isoAddDays, faDate, moodFace, MOOD_WORDS } from '../lib/store'
import JalaliDatePicker from '../components/JalaliDatePicker'

const fadeUp = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 10 }, transition: { duration: .35, ease: [0.22, 1, 0.36, 1] } }

// vivid colors for the mood map cells (same family as mood faces)
const MOOD_HEX = { 1: '#f87171', 2: '#fb923c', 3: '#fbbf24', 4: '#4ade80', 5: '#38bdf8' }

export default function Journal() {
  const { db, mutate, toast } = useApp()
  const [date, setDate] = useState(todayISO())
  const [text, setText] = useState('')
  const [good, setGood] = useState('')
  const [previewImg, setPreviewImg] = useState(null)
  const day = db.days[date] || { journal: { mood: 0, text: '', good: '', img: null } }
  const mood = day.journal.mood

  const save = () => {
    mutate((s) => {
      const d = s.days[date] || (s.days[date] = { habits: {}, tasks: [], journal: { mood: 0, text: '', good: '', img: null } })
      d.journal.text = text.trim()
      d.journal.good = good.trim()
    })
    toast('یادداشت ذخیره شد')
  }
  const setMood = (m) => {
    mutate((s) => {
      const d = s.days[date] || (s.days[date] = { habits: {}, tasks: [], journal: { mood: 0, text: '', good: '', img: null } })
      d.journal.mood = m
    })
    toast('حس ثبت شد')
  }
  const delEntry = (dt) => {
    if (!confirm('یادداشت این روز حذف شود؟')) return
    mutate((s) => { const d = s.days[dt]; if (d) d.journal = { mood: 0, text: '', good: '', img: null } })
    if (dt === date) { setText(''); setGood('') }
    toast('یادداشت حذف شد')
  }
  const onPickImage = (e) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    if (f.size > 1.8 * 1024 * 1024) { toast('تصویر باید کمتر از ~۱.۸ مگابایت باشد'); return }
    const fr = new FileReader()
    fr.onload = () => { setPreviewImg(fr.result) }
    fr.readAsDataURL(f)
  }
  const attachImage = () => {
    if (!previewImg) { toast('اول یک تصویر انتخاب کن'); return }
    mutate((s) => {
      const d = s.days[date] || (s.days[date] = { habits: {}, tasks: [], journal: { mood: 0, text: '', good: '', img: null } })
      d.journal.img = previewImg
    })
    toast('تصویر اضافه شد')
  }
  const removeImage = () => {
    mutate((s) => { const d = s.days[date]; if (d && d.journal) d.journal.img = null })
    setPreviewImg(null)
    toast('تصویر حذف شد')
  }

  /* ---- 30-day mood map ---- */
  const last30 = (() => { const a = []; for (let i = 29; i >= 0; i--) a.push(isoAddDays(todayISO(), -i)); return a })()
  const moodMap = last30.map((iso) => {
    const j = db.days[iso] && db.days[iso].journal
    return { iso, mood: j ? (j.mood || 0) : 0, hasText: !!(j && (j.text || j.good || j.img)) }
  })

  const list = Object.keys(db.days).sort().reverse().map((iso) => {
    const dd = db.days[iso]
    if (!dd || !dd.journal || (!dd.journal.text && !dd.journal.good && !dd.journal.img && !dd.journal.mood)) return null
    return (
      <div className="journal-entry" key={iso}>
        <div className="journal-head">
          <span className="journal-date">{faDate(iso, true)}{iso === todayISO() && <span style={{ color: 'var(--accent)', fontWeight: 700, marginRight: 8 }}>امروز</span>}</span>
          {dd.journal.mood > 0 && <span className="journal-mood" dangerouslySetInnerHTML={{ __html: moodFace(dd.journal.mood, 20) }} />}
          {dd.journal.img && <button className="journal-thumb" onClick={() => setPreviewImg(dd.journal.img)}><img src={dd.journal.img} alt="" /></button>}
          <span className="journal-actions">
            <button onClick={() => { setDate(iso); setText(dd.journal.text || ''); setGood(dd.journal.good || '') }}>ویرایش</button>
            <button className="del" onClick={() => delEntry(iso)}>حذف</button>
          </span>
        </div>
        {dd.journal.good && <div className="journal-good"><b>✨ چیزهای خوب:</b> {dd.journal.good}</div>}
        {dd.journal.text && <div className="journal-text">{dd.journal.text}</div>}
      </div>
    )
  }).filter(Boolean)

  return (
    <motion.div variants={{ animate: { transition: { staggerChildren: 0.05 } } }} initial="initial" animate="animate" exit="exit">
      <motion.div variants={fadeUp} className="page-head"><h1>ژورنال</h1><div className="sub">پایانِ هر روز؛ حس و رخدادهایش را اینجا بنویس.</div></motion.div>

      {/* Mood map */}
      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title"><span>نقشهٔ حس — ۳۰ روز اخیر</span><button className="btn ghost small" onClick={() => setDate(todayISO())}>امروز</button></div>
        <div className="mood-map">
          {moodMap.map((c) => (
            <button key={c.iso} className={'mood-cell' + (c.mood ? ' has' : '') + (c.iso === date ? ' sel' : '')}
              style={c.mood ? { background: MOOD_HEX[c.mood] } : {}}
              title={faDate(c.iso) + (c.mood ? ' · ' + MOOD_WORDS[c.mood] : '') + (c.hasText ? ' · دارای یادداشت' : '')}
              onClick={() => { setDate(c.iso); setText((db.days[c.iso] && db.days[c.iso].journal) ? db.days[c.iso].journal.text || '' : ''); setGood((db.days[c.iso] && db.days[c.iso].journal) ? db.days[c.iso].journal.good || '' : '') }}>
              <span className="mood-cell-day">{toFa(+(c.iso.slice(8, 10)))}</span>
            </button>
          ))}
        </div>
        <div className="mood-map-legend">
          {[1, 2, 3, 4, 5].map((m) => <span key={m} className="mood-legend-item"><span className="mood-legend-dot" style={{ background: MOOD_HEX[m] }} />{MOOD_WORDS[m]}</span>)}
        </div>
      </motion.div>

      {/* Editor */}
      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title">یادداشت روز</div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
          <label style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>تاریخ:</label>
          <JalaliDatePicker value={date} onChange={(v) => { if (!v) return; setDate(v); setText((db.days[v] && db.days[v].journal) ? db.days[v].journal.text || '' : ''); setGood((db.days[v] && db.days[v].journal) ? db.days[v].journal.good || '' : '') }} />
          {date === todayISO() && <span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>امروز</span>}
        </div>
        <div className="field">
          <label>حس امروزت چه بود؟</label>
          <div className="mood-row">
            {[1, 2, 3, 4, 5].map((m) => (
              <button key={m} className={'mood-btn' + (mood === m ? ' sel' : '')} onClick={() => setMood(m)} dangerouslySetInnerHTML={{ __html: moodFace(m, 26) }} />
            ))}
          </div>
          <div className="mood-label">{mood > 0 ? <>حس انتخاب‌شده: <b style={{ color: 'var(--accent)' }}>{MOOD_WORDS[mood]}</b></> : 'هنوز حسی انتخاب نکردی.'}</div>
        </div>
        <div className="field">
          <label>چیزهای خوبِ امروز؟ ✨</label>
          <input className="input" value={good} onChange={(e) => setGood(e.target.value)} maxLength={140} placeholder="مثلاً: بارون اومد، با دوستم حرف زدم، یه چیز جدید یاد گرفتم…" />
        </div>
        <div className="field">
          <label>امروز چه گذشت؟ — کارها، افکار و هر چه می‌خواهی یادت بماند</label>
          <textarea className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder="دیر یا زود، هرچه نوشتی برای خودِ آینده‌ات‌ گنج است…" />
        </div>
        <div className="field">
          <label>تصویر روز (اختیاری)</label>
          {(previewImg || day.journal.img) ? (
            <div className="journal-img-area">
              <img src={previewImg || day.journal.img} alt="تصویر روز" onClick={() => setPreviewImg(previewImg || day.journal.img)} />
              <div className="journal-img-actions">
                <label className="btn ghost small">تعویض<input type="file" accept="image/*" style={{ display: 'none' }} onChange={onPickImage} /></label>
                <button className="btn ghost danger-ghost small" onClick={removeImage}>حذف</button>
              </div>
            </div>
          ) : (
            <label className="btn ghost small">انتخاب تصویر ✨<input type="file" accept="image/*" style={{ display: 'none' }} onChange={onPickImage} /></label>
          )}
          {previewImg && !day.journal.img && <button className="btn small" style={{ marginTop: 8 }} onClick={attachImage}>پیوست به این روز</button>}
        </div>
        <button className="btn" onClick={save}>ذخیرهٔ یادداشت</button>
      </motion.div>

      {/* History */}
      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title">یادداشت‌های گذشته</div>
        {list.length ? list : <p className="glass-hint">هنوز یادداشتی نداری. اولین حس امروزت را بنویس.</p>}
      </motion.div>

      {previewImg && (
        <div className="journal-lightbox" onClick={() => setPreviewImg(null)}>
          <img src={previewImg} alt="" />
        </div>
      )}
    </motion.div>
  )
}