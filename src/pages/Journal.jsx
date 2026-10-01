import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp, toFa, todayISO, isoAddDays, faDate, moodFace, moodWord } from '../lib/store'
import JalaliDatePicker from '../components/JalaliDatePicker'
import { useI18n } from '../lib/i18n'

const fadeUp = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 10 }, transition: { duration: .35, ease: [0.22, 1, 0.36, 1] } }

// vivid colors for the mood map cells (same family as mood faces)
const MOOD_HEX = { 1: '#f87171', 2: '#fb923c', 3: '#fbbf24', 4: '#4ade80', 5: '#38bdf8' }

export default function Journal() {
  const { db, mutate, toast } = useApp()
  const { t } = useI18n()
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
    toast(t('journal.savedToast'))
  }
  const setMood = (m) => {
    mutate((s) => {
      const d = s.days[date] || (s.days[date] = { habits: {}, tasks: [], journal: { mood: 0, text: '', good: '', img: null } })
      d.journal.mood = m
    })
    toast(t('journal.moodSavedToast'))
  }
  const delEntry = (dt) => {
    if (!confirm(t('journal.deleteConfirm'))) return
    mutate((s) => { const d = s.days[dt]; if (d) d.journal = { mood: 0, text: '', good: '', img: null } })
    if (dt === date) { setText(''); setGood('') }
    toast(t('journal.deletedToast'))
  }
  const onPickImage = (e) => {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    if (f.size > 1.8 * 1024 * 1024) { toast(t('journal.imageTooLargeToast')); return }
    const fr = new FileReader()
    fr.onload = () => { setPreviewImg(fr.result) }
    fr.readAsDataURL(f)
  }
  const attachImage = () => {
    if (!previewImg) { toast(t('journal.pickImageFirstToast')); return }
    mutate((s) => {
      const d = s.days[date] || (s.days[date] = { habits: {}, tasks: [], journal: { mood: 0, text: '', good: '', img: null } })
      d.journal.img = previewImg
    })
    toast(t('journal.imageAddedToast'))
  }
  const removeImage = () => {
    mutate((s) => { const d = s.days[date]; if (d && d.journal) d.journal.img = null })
    setPreviewImg(null)
    toast(t('journal.imageRemovedToast'))
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
    const gTxt = dd.journal.good
    const gFull = t('journal.entryGoodThingsPrefix', { text: gTxt })
    const gi = gFull.lastIndexOf(gTxt)
    const gPre = gFull.slice(0, gi), gPost = gFull.slice(gi + gTxt.length)
    return (
      <div className="journal-entry" key={iso}>
        <div className="journal-head">
          <span className="journal-date">{faDate(iso, true)}{iso === todayISO() && <span style={{ color: 'var(--accent)', fontWeight: 700, marginRight: 8 }}>{t('journal.today')}</span>}</span>
          {dd.journal.mood > 0 && <span className="journal-mood" dangerouslySetInnerHTML={{ __html: moodFace(dd.journal.mood, 20) }} />}
          {dd.journal.img && <button className="journal-thumb" onClick={() => setPreviewImg(dd.journal.img)}><img src={dd.journal.img} alt="" /></button>}
          <span className="journal-actions">
            <button onClick={() => { setDate(iso); setText(dd.journal.text || ''); setGood(dd.journal.good || '') }}>{t('journal.entryEdit')}</button>
            <button className="del" onClick={() => delEntry(iso)}>{t('journal.entryDelete')}</button>
          </span>
        </div>
        {gTxt && <div className="journal-good"><b>{gPre}</b>{gTxt}{gPost}</div>}
        {dd.journal.text && <div className="journal-text">{dd.journal.text}</div>}
      </div>
    )
  }).filter(Boolean)

  return (
    <motion.div variants={{ animate: { transition: { staggerChildren: 0.05 } } }} initial="initial" animate="animate" exit="exit">
      <motion.div variants={fadeUp} className="page-head"><h1>{t('journal.pageTitle')}</h1><div className="sub">{t('journal.pageSubtitle')}</div></motion.div>

      {/* Mood map */}
      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title"><span>{t('journal.moodMapTitle')}</span><button className="btn ghost small" onClick={() => setDate(todayISO())}>{t('journal.today')}</button></div>
        <div className="mood-map">
          {moodMap.map((c) => (
                      <button key={c.iso} className={'mood-cell' + (c.mood ? ' has' : '') + (c.iso === date ? ' sel' : '')}
                                              style={c.mood ? { background: MOOD_HEX[c.mood] } : {}}
                                              title={faDate(c.iso) + (c.mood ? ' · ' + moodWord(c.mood) : '') + (c.hasText ? t('journal.moodMapHasNoteSuffix') : '')}
                                              onClick={() => { setDate(c.iso); setText((db.days[c.iso] && db.days[c.iso].journal) ? db.days[c.iso].journal.text || '' : ''); setGood((db.days[c.iso] && db.days[c.iso].journal) ? db.days[c.iso].journal.good || '' : ''); setPreviewImg((db.days[c.iso] && db.days[c.iso].journal) ? db.days[c.iso].journal.img || null : null) }}>
                                              <span className="mood-cell-day">{toFa(jalaliOf(c.iso).jd)}</span>
                                            </button>
                    ))}
        </div>
        <div className="mood-map-legend">
          {[1, 2, 3, 4, 5].map((m) => <span key={m} className="mood-legend-item"><span className="mood-legend-dot" style={{ background: MOOD_HEX[m] }} />{moodWord(m)}</span>)}
        </div>
      </motion.div>

      {/* Editor */}
      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title">{t('journal.editorTitle')}</div>
        <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap', marginBottom: 18 }}>
          <label style={{ fontSize: 13, color: 'var(--muted)', fontWeight: 600 }}>{t('journal.dateLabel')}</label>
          <JalaliDatePicker value={date} onChange={(v) => { if (!v) return; setDate(v); setText((db.days[v] && db.days[v].journal) ? db.days[v].journal.text || '' : ''); setGood((db.days[v] && db.days[v].journal) ? db.days[v].journal.good || '' : ''); setPreviewImg((db.days[v] && db.days[v].journal) ? db.days[v].journal.img || null : null) }} />
          {date === todayISO() && <span style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 600 }}>{t('journal.today')}</span>}
        </div>
        <div className="field">
          <label>{t('journal.moodQuestion')}</label>
          <div className="mood-row">
            {[1, 2, 3, 4, 5].map((m) => (
              <button key={m} className={'mood-btn' + (mood === m ? ' sel' : '')} onClick={() => setMood(m)} dangerouslySetInnerHTML={{ __html: moodFace(m, 26) }} />
            ))}
          </div>
          <div className="mood-label">{mood > 0 ? <>{t('journal.moodSelectedPrefix', { mood: '' })}<b style={{ color: 'var(--accent)' }}>{moodWord(mood)}</b></> : t('journal.moodNoneYet')}</div>
        </div>
        <div className="field">
          <label>{t('journal.goodThingsLabel')}</label>
          <input className="input" value={good} onChange={(e) => setGood(e.target.value)} maxLength={140} placeholder={t('journal.goodThingsPlaceholder')} />
        </div>
        <div className="field">
          <label>{t('journal.dayNotesLabel')}</label>
          <textarea className="input" value={text} onChange={(e) => setText(e.target.value)} placeholder={t('journal.dayNotesPlaceholder')} />
        </div>
        <div className="field">
          <label>{t('journal.photoLabel')}</label>
          {(previewImg || day.journal.img) ? (
            <div className="journal-img-area">
              <img src={previewImg || day.journal.img} alt={t('journal.photoAlt')} onClick={() => setPreviewImg(previewImg || day.journal.img)} />
              <div className="journal-img-actions">
                <label className="btn ghost small">{t('journal.photoReplace')}<input type="file" accept="image/*" style={{ display: 'none' }} onChange={onPickImage} /></label>
                <button className="btn ghost danger-ghost small" onClick={removeImage}>{t('journal.removePhoto')}</button>
              </div>
            </div>
          ) : (
            <label className="btn ghost small">{t('journal.photoChoose')}<input type="file" accept="image/*" style={{ display: 'none' }} onChange={onPickImage} /></label>
          )}
          {previewImg && !day.journal.img && <button className="btn small" style={{ marginTop: 8 }} onClick={attachImage}>{t('journal.photoAttach')}</button>}
        </div>
        <button className="btn" onClick={save}>{t('journal.saveNote')}</button>
      </motion.div>

      {/* History */}
      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title">{t('journal.historyTitle')}</div>
        {list.length ? list : <p className="glass-hint">{t('journal.historyEmpty')}</p>}
      </motion.div>

      {previewImg && (
        <div className="journal-lightbox" onClick={() => setPreviewImg(null)}>
          <img src={previewImg} alt="" />
        </div>
      )}
    </motion.div>
  )
}