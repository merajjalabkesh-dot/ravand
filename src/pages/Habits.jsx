import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp, toFa, todayISO, isoAddDays } from '../lib/store'
import { useI18n } from '../lib/i18n'

const fadeUp = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 10 }, transition: { duration: .35, ease: [0.22, 1, 0.36, 1] } }
const HABIT_COLORS = ['#8b5cf6', '#43e8a8', '#f5a623', '#f87171', '#38bdf8', '#a78bfa', '#fb923c']
const WD_KEYS = ['habits.weekdaySunday', 'habits.weekdayMonday', 'habits.weekdayTuesday', 'habits.weekdayWednesday', 'habits.weekdayThursday', 'habits.weekdayFriday', 'habits.weekdaySaturday']

export default function Habits() {
  const { db, mutate, toast } = useApp()
  const { t } = useI18n()
  const [name, setName] = useState('')
  const [type, setType] = useState('good')
  const [days, setDays] = useState([])
  const [color, setColor] = useState(HABIT_COLORS[0])
  const [startTime, setStartTime] = useState('')
  const [endTime, setEndTime] = useState('')
  const [editingHabitId, setEditingHabitId] = useState(null)

  const dayIds = (iso) => { const d = db.days[iso]; if (!d) return new Set(); return new Set(Object.keys(d.habits || {}).filter((k) => d.habits[k])) }
  const habitStreak = (id) => { let s = 0, x = todayISO(); if (!dayIds(x).has(id)) x = isoAddDays(x, -1); while (dayIds(x).has(id)) { s++; x = isoAddDays(x, -1) }; return s }
  const cleanStreak = (id) => { const h = db.habits.find((y) => y.id === id); let st = 0, x = todayISO(); const start = h ? h.createdAt : x; while (x >= start) { if (dayIds(x).has(id)) break; st++; x = isoAddDays(x, -1) }; return st }
  const bestClean = (id) => { const h = db.habits.find((y) => y.id === id); let b = 0, c = 0, start = h ? h.createdAt : todayISO(); for (let i = 399; i >= 0; i--) { const x = isoAddDays(todayISO(), -i); if (x < start) break; if (!dayIds(x).has(id)) { c++; if (c > b) b = c } else c = 0 }; return b }
  const cleanCount30 = (id) => { const h = db.habits.find((y) => y.id === id); let n = 0, start = h ? h.createdAt : todayISO(); for (let i = 0; i < 30; i++) { const x = isoAddDays(todayISO(), -i); if (x < start) break; if (!dayIds(x).has(id)) n++ }; return n }
  const habitDone30 = (id) => { let n = 0; for (let i = 0; i < 30; i++) if (dayIds(isoAddDays(todayISO(), -i)).has(id)) n++; return n }
  const weekDone = (id) => { let n = 0; for (let i = 0; i < 7; i++) if (dayIds(isoAddDays(todayISO(), -i)).has(id)) n++; return n }

  const resetForm = () => {
    setName('')
    setType('good')
    setDays([])
    setColor(HABIT_COLORS[0])
    setStartTime('')
    setEndTime('')
    setEditingHabitId(null)
  }

  const startEdit = (h) => {
    setEditingHabitId(h.id)
    setName(h.name || '')
    setType(h.type || 'good')
    setDays(h.days ? [...h.days] : [])
    setColor(h.color || HABIT_COLORS[0])
    setStartTime(h.startTime || '')
    setEndTime(h.endTime || '')
    try {
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch { /* noop */ }
  }

  const saveOrAdd = () => {
    if (!name.trim()) { toast(t('habits.nameRequiredToast')); return }
    const good = type === 'good'
    const sTime = startTime.trim() || undefined
    const eTime = endTime.trim() || undefined

    if (editingHabitId) {
      mutate((s) => {
        const target = s.habits.find((h) => h.id === editingHabitId)
        if (target) {
          target.name = name.trim()
          target.type = type
          target.color = color
          target.days = good && days.length ? [...days] : null
          if (sTime) target.startTime = sTime; else delete target.startTime
          if (eTime) target.endTime = eTime; else delete target.endTime
        }
      })
      toast(t('habits.habitUpdatedToast', { name: name.trim() }))
      resetForm()
      return
    }

    mutate((s) => {
      s.habits.push({
        id: Math.random().toString(36).slice(2, 7),
        name: name.trim(),
        color,
        type,
        weeklyGoal: 7,
        days: good && days.length ? [...days] : null,
        startTime: sTime,
        endTime: eTime,
        createdAt: todayISO()
      })
    })
    toast(t(good ? 'habits.habitCreatedToastGood' : 'habits.habitCreatedToastBad', { name: name.trim() }))
    resetForm()
  }
  const del = (id) => { if (!confirm(t('habits.deleteConfirm'))) return; mutate((s) => { s.habits = s.habits.filter((h) => h.id !== id) }); toast(t('habits.deletedToast')) }
  const relapse = (id) => { if (!confirm(t('habits.relapseConfirm'))) return; mutate((s) => { const day = s.days[todayISO()] || (s.days[todayISO()] = { habits: {}, tasks: [], journal: { mood: 0, text: '' } }); day.habits = day.habits || {}; delete day.habits[id]; const h = s.habits.find((y) => y.id === id); if (h) h.lastRelapse = todayISO() }); toast(t('habits.relapseToast')) }

  const formatTimeSpan = (s, e) => {
    if (!s && !e) return null
    if (s && e) return `${toFa(s)} - ${toFa(e)}`
    if (s) return `${toFa(s)}`
    return `${toFa(e)}`
  }

  const list = db.habits.length === 0 ? <div className="empty-state"><div className="big">✦</div><p>{t('habits.emptyStateLine1')}<br />{t('habits.emptyStateLine2')}</p></div>
      : db.habits.map((h) => {
        const bad = h.type === 'bad'
        const timeBadge = formatTimeSpan(h.startTime, h.endTime)
        if (bad) {
        const cs = cleanStreak(h.id), bs = bestClean(h.id)
        const csFa = toFa(cs)
        const cleanParts = t('habits.cleanStreakLabel', { days: csFa }).split(csFa)
        let msg = ''
        if (cs >= 180) msg = t('habits.milestone180')
        else if (cs >= 30) msg = t('habits.milestone30')
        else if (cs >= 7) msg = t('habits.milestone7')
        else if (cs >= 1) msg = t('habits.milestone1')
        return (
                  <div className="habit-manage-row bad" key={h.id}>
                    <span className="habit-color" style={{ background: h.color, width: 16, height: 16 }} />
                    <span className="hname">{h.name}</span>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="badge" style={{ fontSize: 9, background: 'rgba(248,113,113,.16)', color: '#f87171' }}>{t('habits.badgeBad')}</span>
              {timeBadge && (
                <span className="badge" style={{ fontSize: 11, background: 'rgba(139,92,246,.15)', color: 'var(--accent)', direction: 'ltr', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                  <span>⏰</span> {timeBadge}
                </span>
              )}
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>{cleanParts[0]}<b style={{ color: 'var(--accent)' }}>{csFa}{cleanParts[1]}</b></span>
              <span className="mini-stat">{t('habits.bestCleanLabel', { count: toFa(bs) })}</span>
              {msg && <span className="milestone">{msg}</span>}
            </div>
            <button className="relapse-btn" onClick={() => relapse(h.id)} title={t('habits.relapseButtonTitle')}>{t('habits.relapseButton')}</button>
            <button className="delete-habit" onClick={() => startEdit(h)} title={t('habits.editButtonTitle')} style={{ color: 'var(--accent)' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
            </button>
            <button className="delete-habit" onClick={() => del(h.id)} title={t('habits.deleteButtonTitle')}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>
          </div>
        )
      }
      const st = habitStreak(h.id), done30 = habitDone30(h.id), goal = h.weeklyGoal || 7, wg = weekDone(h.id)
      const gp = Math.min(100, Math.round(wg / goal * 100))
      const stFa = toFa(st)
      const streakParts = t('habits.currentStreakLabel', { days: stFa }).split(stFa)
      const streakTail = streakParts.length > 1 ? streakParts[1] : ''
      return (
              <div className="habit-manage-row" key={h.id}>
                <span className="habit-color" style={{ background: h.color, width: 16, height: 16 }} />
                <span className="hname">{h.name}</span>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="badge good-badge">{t('habits.badgeGood')}</span>
            {timeBadge && (
              <span className="badge" style={{ fontSize: 11, background: 'rgba(139,92,246,.15)', color: 'var(--accent)', direction: 'ltr', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                <span>⏰</span> {timeBadge}
              </span>
            )}
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{st > 0 ? t('habits.streakConsecutivePrefix', { days: stFa }) : ''}<b>{stFa}</b>{streakTail}</span>
            <span className="mini-stat">{t('habits.doneLast30Days', { count: toFa(done30) })}</span>
            <span className="mini-stat goal-label">{t('habits.weeklyGoalLabel', { done: toFa(wg), goal: toFa(goal) })}</span>
          </div>
          <button className="delete-habit" onClick={() => startEdit(h)} title={t('habits.editButtonTitle')} style={{ color: 'var(--accent)' }}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
          </button>
          <button className="delete-habit" onClick={() => del(h.id)} title={t('habits.deleteButtonTitle')}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>
        </div>
      )
    })

  return (
    <motion.div variants={{ animate: { transition: { staggerChildren: 0.05 } } }} initial="initial" animate="animate" exit="exit">
      <motion.div variants={fadeUp} className="page-head"><h1>{t('habits.pageTitle')}</h1><div className="sub">{t('habits.pageSubtitle')}</div></motion.div>

      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg>
          {editingHabitId ? t('habits.formTitleEdit') : t('habits.formTitle')}
        </div>
        <div className="field" style={{ marginBottom: 12 }}>
          <input className="input" style={{ maxWidth: 420 }} maxLength={50} placeholder={type === 'good' ? t('habits.namePlaceholderGood') : t('habits.namePlaceholderBad')} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && saveOrAdd()} />
        </div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <button className={'type-btn good' + (type === 'good' ? ' sel' : '')} onClick={() => setType('good')}>{t('habits.typeGood')}</button>
          <button className={'type-btn bad' + (type === 'bad' ? ' sel' : '')} onClick={() => { setType('bad'); setDays([]) }}>{t('habits.typeBad')}</button>
        </div>
        {type === 'good' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{t('habits.weekdaysQuestion')}</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <button key={d} className={'day-chip' + (days.includes(d) ? ' on' : '')} onClick={() => setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d])}>{t(WD_KEYS[d])}</button>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>{t('habits.timeOptionalLabel')}</span>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
            <input
              type="time"
              className="input"
              style={{ width: 130, padding: '7px 10px', fontSize: 13, textAlign: 'center' }}
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              placeholder={t('habits.startTimePlaceholder')}
              title={t('habits.startTimePlaceholder')}
            />
            <span style={{ color: 'var(--muted)', fontSize: 13 }}>تا</span>
            <input
              type="time"
              className="input"
              style={{ width: 130, padding: '7px 10px', fontSize: 13, textAlign: 'center' }}
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              placeholder={t('habits.endTimePlaceholder')}
              title={t('habits.endTimePlaceholder')}
            />
            {(startTime || endTime) && (
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: 12, padding: '4px 8px', color: 'var(--muted)' }}
                onClick={() => { setStartTime(''); setEndTime('') }}
              >
                پاک کردن زمان
              </button>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>{t('habits.colorLabel')}</span>
          <div className="color-swatches">
            {HABIT_COLORS.map((c) => <button key={c} className={'swatch' + (c === color ? ' sel' : '')} style={{ background: c }} onClick={() => setColor(c)} aria-label={t('habits.pickColorAria')} />)}
          </div>
          <button className="btn" onClick={saveOrAdd}>{editingHabitId ? t('habits.saveChanges') : t('habits.addHabit')}</button>
          {editingHabitId && (
            <button className="btn-ghost" onClick={resetForm} style={{ fontSize: 13 }}>{t('habits.cancelEdit')}</button>
          )}
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5"/><path d="M9 19v-6"/><path d="M14 19V8"/><path d="M19 19v-10"/></svg> {t('habits.listTitle')}</div>
        {list}
        {db.habits.some((h) => h.type !== 'bad') && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed rgba(255,255,255,.06)' }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>{t('habits.weeklyScheduleLabel')}</div>
            {db.habits.filter((h) => h.type !== 'bad').map((h) => {
              const ds = (h.days && h.days.length) ? h.days : [0, 1, 2, 3, 4, 5, 6]
              return (
                <div className="sched-row" key={h.id}>
                  <span className="mini-dot" style={{ background: h.color, width: 8, height: 8 }} />
                  <span className="mini-name">{h.name}</span>
                  {[0, 1, 2, 3, 4, 5, 6].map((d) => <span key={d} className={'sch-chip' + (ds.includes(d) ? ' on' : '')}>{t(WD_KEYS[d])}</span>)}
                </div>
              )
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}