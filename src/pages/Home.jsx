import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { useApp, toFa, todayISO, isoAddDays, faDate, fmtMin, minOf, phaseOfHour, nextEventISO, isScheduled } from '../lib/store'
import { useI18n } from '../lib/i18n'
import EventCard from '../components/EventCard'

function useHabitData(db) {
  const today = todayISO()
  // همهٔ این توابع از db می‌خوانند؛ یک‌بار در هر تغییرِ db ساخته می‌شوند نه
  // در هر رندر. bestStreak روی ۴۰۱ روز حلقه می‌زند، پس این مهم است.
  return useMemo(() => {
    const dayIds = (iso) => {
      const d = db.days[iso]
      if (!d) return new Set()
      return new Set(Object.keys(d.habits || {}).filter((k) => d.habits[k]))
    }
    const dayPct = (iso) => {
      const goods = db.habits.filter((h) => h.type !== 'bad' && isScheduled(h, iso))
      if (!goods.length) return 0
      const ids = dayIds(iso)
      let n = 0
      goods.forEach((h) => { if (ids.has(h.id)) n++ })
      return Math.round((n / goods.length) * 100)
    }
    const isSched = (h, iso) => isScheduled(h, iso)
    const habitStreak = (id) => {
      let s = 0, iso = today
      if (!dayIds(iso).has(id)) iso = isoAddDays(iso, -1)
      while (dayIds(iso).has(id)) { s++; iso = isoAddDays(iso, -1) }
      return s
    }
    const bestStreak = (id) => {
      let best = 0, cur = 0
      for (let i = 400; i >= 0; i--) { if (dayIds(isoAddDays(today, -i)).has(id)) cur++; else { if (cur > best) best = cur; cur = 0 } }
      if (cur > best) best = cur
      return best
    }
    const weekDone = (id) => { let n = 0; for (let i = 0; i < 7; i++) if (dayIds(isoAddDays(today, -i)).has(id)) n++; return n }
    return { dayIds, dayPct, isSched, habitStreak, bestStreak, weekDone, today }
  }, [db])
}

const stagger = { animate: { transition: { staggerChildren: 0.07 } } }
const fadeUp = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 10 }, transition: { duration: .35, ease: [0.22, 1, 0.36, 1] } }

const CheckSvg = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
const FireSvg = ({ style }) => <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}><path d="M12 22c4.4 0 7-2.6 7-6.5 0-3-2-5-4.2-6.6C13.9 7.6 13 5.7 13 3c-4.2 1.6-6.5 5.6-6.5 9.5 0 .9.1 1.7.4 2.4-1.6-1.2-2.4-2.9-2.4-4.7-1.7 2-2.5 4-2.5 6 0 3.9 2.8 5.8 7 5.8z"/><path d="M12 22c2.2 0 3.5-1.3 3.5-3 0-1.3-1-2.3-1.8-3.1-.6.6-1 1.3-1 2 .7-.4 1.2-.9 1.5-1.5"/></svg>

const Ring = ({ pct, size = 112 }) => {
  // شعاع باید از روی ضخامتِ خط حساب شود، نه از یک عدد ثابت. قبلاً با
  // پیش‌فرض ۶ حساب می‌شد ولی خط ۱۱ پیکسلی است، پس لبهٔ بیرونیِ حلقه
  // از کادر SVG بیرون می‌زد و مرورگر می‌بریدش — دایره ناقص دیده می‌شد.
  const stroke = 11, pad = 1
  const r = (size - stroke - pad * 2) / 2, c = 2 * Math.PI * r
  return (
    <svg className="ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <circle className="bg" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
      <motion.circle
        className="fg"
        cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke}
        strokeDasharray={c}
        initial={{ strokeDashoffset: c }}
        animate={{ strokeDashoffset: c * (1 - Math.min(100, Math.max(0, pct)) / 100) }}
        transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
      />
    </svg>
  )
}

function StatCard({ color, icon, num, lbl, to, onClick }) {
  const bg = { accent: 'accbg', warm: 'accbg2', rose: 'rosebg' }[color] || 'accbg'
  return (
    <button className="stat clickable" onClick={onClick} style={{ textAlign: 'right' }} data-action={to ? 'goto' : undefined}>
      <span className={`stat-icon ${bg}`}>{icon}</span>
      <span><span className="num">{num}</span><br /><span className="lbl">{lbl}</span></span>
    </button>
  )
}

export default function Home() {
  const { db, mutate, toast } = useApp()
  const { t } = useI18n()
  const navigate = useNavigate()
  const H = useHabitData(db)
  const today = H.today
  const d = new Date()
  const ph = phaseOfHour(d.getHours())
  const iso = H.today
  const pct = H.dayPct(iso)
  const j = (db.days[iso] && db.days[iso].journal) || { mood: 0, text: '' }
  const tD = (db.days[iso] && db.days[iso].tasks) ? db.days[iso].tasks.filter((t2) => t2.done).length : 0
  const tC = (db.days[iso] && db.days[iso].tasks) ? db.days[iso].tasks.length : 0
  const bestAll = db.habits.reduce((m, h) => Math.max(m, H.bestStreak(h.id)), 0)
  const wake = db.days[iso] && db.days[iso].wake
  const sleepLogged = !!(db.days[iso] && db.days[iso].sleep)
  const showSleep = !!wake && !sleepLogged && (d.getHours() * 60 + d.getMinutes()) >= 19 * 60
  const avgW = db.settings.curWake || null

  // Unified list for Home: today's scheduled habits + real tasks
  const isScheduledToday = (h) => H.isSched(h, iso)
  const toggleHabit = (id) => {
    if (db.settings.sound) { try { const AC = window.AudioContext || window.webkitAudioContext; const ac = new AC(); const o = ac.createOscillator(); const g = ac.createGain(); o.type = 'sine'; o.frequency.value = 760; g.gain.setValueAtTime(0.0001, ac.currentTime); g.gain.exponentialRampToValueAtTime(0.1, ac.currentTime + 0.012); g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + 0.13); o.connect(g); g.connect(ac.destination); o.start(); o.stop(ac.currentTime + 0.15) } catch (e) {} }
    mutate((s) => { const day = s.days[iso] || (s.days[iso] = { habits: {}, tasks: [], journal: { mood: 0, text: '' } }); day.habits = day.habits || {}; if (day.habits[id]) delete day.habits[id]; else day.habits[id] = true })
  }
  const toggleTask = (id) => {
    mutate((s) => { const day = s.days[iso] || (s.days[iso] = { habits: {}, tasks: [], journal: { mood: 0, text: '' } }); const task = (day.tasks || []).find((x) => x.id === id); if (task) task.done = !task.done })
  }
  const todayHabits = db.habits.filter(isScheduledToday)
  const todayTasks = (db.days[iso] && db.days[iso].tasks) || []

  // چیدمان ترکیبی (Interleaved): عادت‌ها و کارها با هم در یک لیست قابل جابه‌جایی
  const combinedItems = useMemo(() => {
    const habitItems = todayHabits.map((h) => ({ key: 'h-' + h.id, type: 'habit', data: h }))
    const taskItems = todayTasks.map((task) => ({ key: 't-' + task.id, type: 'task', data: task }))
    const allItems = [...habitItems, ...taskItems]
    const itemMap = new Map(allItems.map((item) => [item.key, item]))

    const homeOrder = (db.days[iso] && db.days[iso].homeOrder) || []
    const ordered = []
    const seen = new Set()

    for (const key of homeOrder) {
      if (itemMap.has(key)) {
        ordered.push(itemMap.get(key))
        seen.add(key)
      }
    }
    for (const item of allItems) {
      if (!seen.has(item.key)) {
        ordered.push(item)
      }
    }
    return ordered
  }, [todayHabits, todayTasks, db.days[iso]?.homeOrder])

  const moveItem = (idx, dir) => {
    const targetIdx = idx + dir
    if (idx < 0 || targetIdx < 0 || targetIdx >= combinedItems.length) return
    const newOrder = combinedItems.map((item) => item.key)
    const [moved] = newOrder.splice(idx, 1)
    newOrder.splice(targetIdx, 0, moved)

    mutate((s) => {
      const day = s.days[iso] || (s.days[iso] = { habits: {}, tasks: [], journal: { mood: 0, text: '' } })
      day.homeOrder = newOrder
    })
  }

  const getItemStartMin = (item) => {
    const s = item.data?.startTime
    if (s && typeof s === 'string' && s.includes(':')) {
      const [h, m] = s.split(':').map(Number)
      if (!isNaN(h) && !isNaN(m)) return h * 60 + m
    }
    const e = item.data?.endTime
    if (e && typeof e === 'string' && e.includes(':')) {
      const [h, m] = e.split(':').map(Number)
      if (!isNaN(h) && !isNaN(m)) return h * 60 + m
    }
    return null
  }

  const sortByTime = () => {
    if (combinedItems.length <= 1) return
    const sorted = [...combinedItems].sort((a, b) => {
      const minA = getItemStartMin(a)
      const minB = getItemStartMin(b)
      if (minA !== null && minB !== null) return minA - minB
      if (minA !== null) return -1
      if (minB !== null) return 1
      return 0
    })
    const newOrder = sorted.map((item) => item.key)
    mutate((s) => {
      const day = s.days[iso] || (s.days[iso] = { habits: {}, tasks: [], journal: { mood: 0, text: '' } })
      day.homeOrder = newOrder
    })
    toast(t('home.sortedToast'))
  }

  const formatTimeSpan = (s, e) => {
    if (!s && !e) return null
    if (s && e) return `${toFa(s)} - ${toFa(e)}`
    if (s) return `${toFa(s)}`
    return `${toFa(e)}`
  }

  // دایرهٔ «حرکت در روز» کل روز را نشان می‌دهد: عادت‌ها و کارها با هم.
  // وزن هر دسته برابر تعدادش است، پس اگر کارها بیشتر باشند سهم بیشتری
  // می‌گیرند؛ و اگر فقط عادت باشد، همان درصد عادت‌ها می‌شود.
  const hTotal = todayHabits.length
  const hDone = todayHabits.filter((h) => H.dayIds(iso).has(h.id)).length
  const dayAllPct = (hTotal + todayTasks.length) ? Math.round(((hDone + tD) / (hTotal + todayTasks.length)) * 100) : 0

  const [wakeTime, setWakeTime] = useState('')
  const wakeUp = () => {
    const now = new Date()
    const nowStr = String(now.getHours()).padStart(2, '0') + ':' + String(now.getMinutes()).padStart(2, '0')
    const finalTime = wakeTime || nowStr
    mutate((s) => { const day = s.days[todayISO()] || (s.days[todayISO()] = { habits: {}, tasks: [], journal: { mood: 0, text: '' } }); day.wake = finalTime })
    setWakeTime('')
    toast(wakeTime ? t('home.wakeLoggedToast', { time: toFa(wakeTime) }) : t('home.morningToast'))
  }
  const logSleep = (time) => { mutate((s) => { const day = s.days[todayISO()] || (s.days[todayISO()] = { habits: {}, tasks: [], journal: { mood: 0, text: '' } }); day.sleep = time }); toast(t('home.sleepLoggedToast')) }

  const habitNext = (db.events || []).map((ev) => ({ ...ev, nextISO: nextEventISO(ev) })).filter((e) => e.nextISO).sort((a, b) => (a.nextISO < b.nextISO ? -1 : 1))[0]

  // این لیست باید یک عنصرِ واقعی باشد نه fragment: قانون
  // .home-sections > .glass > *:last-child فقط یک فرزندِ واقعی را
  // می‌بیند، و fragment (یعنی <>...</>) در DOM اصلاً وجود ندارد.
  // برای همین وقتی فقط یک کار بود، آن کل ارتفاع را می‌گرفت و وسط
  // می‌نشست. با div واقعی، قوانین درست رویش اعمال می‌شود.
  const habitsHtml = combinedItems.length === 0
    ? <div className="empty-state"><div className="big">✦</div><p className="preline">{t('home.emptyTasks')}</p></div>
    : <div className="home-task-list">
        {combinedItems.map((item, idx) => {
          if (item.type === 'habit') {
            const h = item.data
            const done = H.dayIds(iso).has(h.id)
            const isBad = h.type === 'bad'
            const timeBadge = formatTimeSpan(h.startTime, h.endTime)
            return (
              <div className="task-row" key={item.key} onClick={() => toggleHabit(h.id)} style={{ cursor: 'pointer', opacity: .96 }}>
                <span className="task-box" style={{ background: done ? h.color : 'var(--surface-hover)' }} />
                {isBad && <span className="badge bad" style={{ fontSize: 10, marginLeft: 6 }}>{t('home.quitBadge')}</span>}
                <span className="ttext" style={{ textDecoration: done ? 'line-through' : 'none', opacity: done ? .55 : 1 }}>
                  {h.name}
                  {timeBadge && (
                    <span className="badge" style={{ fontSize: 10, background: 'rgba(139,92,246,.15)', color: 'var(--accent)', direction: 'ltr', display: 'inline-flex', alignItems: 'center', gap: 3, marginInlineStart: 6 }}>
                      <span>⏰</span> {timeBadge}
                    </span>
                  )}
                </span>
                {isBad ? <span className="mini-stat bad" style={{ fontSize: 11 }}>{t('home.habitTypeBad')}</span> : <span className="mini-stat good" style={{ fontSize: 11 }}>{t('home.habitTypeGood')}</span>}
                <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                  <button className="task-move" onClick={(e) => { e.stopPropagation(); moveItem(idx, -1) }} disabled={idx === 0} title={t('home.moveUp')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>
                  <button className="task-move" onClick={(e) => { e.stopPropagation(); moveItem(idx, 1) }} disabled={idx === combinedItems.length - 1} title={t('home.moveDown')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg></button>
                </span>
              </div>
            )
          }
          const task = item.data
          const timeBadge = formatTimeSpan(task.startTime, task.endTime)
          return (
            <div className="task-row" key={item.key} onClick={() => toggleTask(task.id)} style={{ cursor: 'pointer' }}>
              <span className="task-box" style={{ background: task.done ? 'var(--accent-2)' : 'var(--surface-hover)' }} />
              <span className="ttext" style={{ textDecoration: task.done ? 'line-through' : 'none', opacity: task.done ? .55 : 1 }}>
                {task.text}
                {timeBadge && (
                  <span className="badge" style={{ fontSize: 10, background: 'rgba(56,189,248,.14)', color: '#38bdf8', direction: 'ltr', display: 'inline-flex', alignItems: 'center', gap: 3, marginInlineStart: 6 }}>
                    <span>⏰</span> {timeBadge}
                  </span>
                )}
              </span>
              <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                <button className="task-move" onClick={(e) => { e.stopPropagation(); moveItem(idx, -1) }} disabled={idx === 0} title={t('home.moveUp')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>
                <button className="task-move" onClick={(e) => { e.stopPropagation(); moveItem(idx, 1) }} disabled={idx === combinedItems.length - 1} title={t('home.moveDown')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg></button>
              </span>
            </div>
          )
        })}
      </div>

  return (
    <motion.div variants={stagger} initial="initial" animate="animate" exit="exit" className="home-page">
      <motion.div variants={fadeUp}>
        <div className="glass" style={{ background: 'linear-gradient(150deg,rgba(18,20,28,.95) 0%,rgba(124,92,252,.2) 65%,rgba(67,232,168,.1) 100%)', border: '1px solid var(--glass-border)', borderRadius: 24, padding: '28px 32px', marginBottom: 22, position: 'relative', overflow: 'hidden' }}>
          {!wake ? (
            <>
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 30, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 230 }}>
                  <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4, letterSpacing: .5, textTransform: 'uppercase' }}>{faDate(iso, true)}</div>
                  <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-.6px' }}>{t('home.greetingMorning', { name: db.user.first })}</h2>
                  <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 10 }}>{t('home.notStartedYet')}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18, flexWrap: 'wrap' }}>
                    <button className="btn" onClick={wakeUp}>{t('home.wakeUp')}</button>
                    <input className="input" type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)} style={{ width: 'auto' }} title={t('home.wakeTimeTitle')} />
                    <span style={{ fontSize: 12, color: 'var(--muted)' }}>{t('home.wakeTimeHint')}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 30, flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 230 }}>
                <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 4, letterSpacing: .5, textTransform: 'uppercase' }}>{faDate(iso, true)} · {t('home.wokeUpAt', { time: fmtMin(minOf(wake)) })}</div>
                <h2 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-.6px' }}>{t('home.greetingDay', { name: db.user.first })}</h2>
                <div style={{ color: 'var(--muted)', fontSize: 14, marginTop: 10 }}>{t('home.keepGoing')}</div>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="stat-grid">
        <StatCard color="accent" icon={<CheckSvg />} num={toFa(pct) + t('home.percentSign')} lbl={t('home.todaysHabitsStat')} onClick={() => navigate('/app/today')} />
        <StatCard color="warm" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>} num={toFa(tD) + '/' + toFa(tC)} lbl={t('home.todaysTasksTitle')} onClick={() => navigate('/app/today')} />
        <StatCard color="warm" icon={<FireSvg />} num={toFa(bestAll)} lbl={t('home.bestRecordStat')} onClick={() => navigate('/app/habits')} />
        <StatCard color="rose" icon={<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 4h12a2 2 0 0 1 2 2v14H7a2 2 0 0 1-2-2z"/><path d="M9 8h6M9 12h6"/></svg>} num={j.text ? t('home.journalWritten') : t('home.journalEmpty')} lbl={t('home.todaysJournalStat')} onClick={() => navigate('/app/journal')} />
      </motion.div>

      {habitNext && (
        <motion.div variants={fadeUp} className="glass home-event">
          <div className="glass-title"><span>{t('home.nextEvent')}</span><button className="btn ghost small" onClick={() => navigate('/app/reports')} style={{ marginRight: 'auto' }}>{t('home.allEvents')}</button></div>
          <EventCard ev={habitNext} />
        </motion.div>
      )}

      <div className="home-sections">
        <motion.div variants={fadeUp} className="glass">
          <div className="glass-title" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <FireSvg />
              <span>{t('home.todaysTasksTitle')}</span>
            </div>
            {combinedItems.length > 1 && (
              <button
                type="button"
                className="btn ghost small"
                onClick={sortByTime}
                title={t('home.sortByTimeTooltip')}
                style={{ fontSize: 11, padding: '4px 8px', display: 'inline-flex', alignItems: 'center', gap: 5, borderRadius: 8 }}
              >
                <span>⏰</span>
                <span>{t('home.sortByTime')}</span>
              </button>
            )}
          </div>
          {habitsHtml}
        </motion.div>
        <motion.div variants={fadeUp} className="glass">
          <div className="glass-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 1.8"/></svg> {t('home.dayActivityTitle')}</div>
          <div className="ring-wrap">
            <Ring pct={dayAllPct} />
            <div className="kpis">
              <div className="kpi"><div className="n">{toFa(pct)}<span className="kpi-suffix">{t('home.percentSign')}</span></div><div className="l">{t('today.habitsKpiLabel')}</div></div>
              <div className="kpi"><div className="n">{toFa(tD)} / {toFa(tC)}</div><div className="l">{t('today.tasksKpiLabel')}</div></div>
              {j.mood > 0 && <div className="kpi"><div className="n mood-face">{t(['home.moodNone', 'home.moodTired', 'home.moodLazy', 'home.moodNormal', 'home.moodGood', 'home.moodGreat'][j.mood])}</div><div className="l">{t('home.todaysFeeling')}</div></div>}
            </div>
          </div>
          <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,.06)' }}>
            <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 8 }}>{t('home.sleepWakeTitle')}</div>
            {showSleep ? (
              <div className="sleep-card" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ flex: 1 }}><div className="sleep-now" style={{ fontSize: 13, color: 'var(--muted)' }}>{t('home.sleepQuestion')}</div></div>
                {['21:00', '21:30', '22:00', '22:30', '23:00', '23:30', '00:00'].map((t) => (
                  <button key={t} className={'sleep-pill' + (minOf(t) === minOf(db.settings.sleepGoal) ? ' active' : '')} onClick={() => logSleep(t)}>{toFa(t)}</button>
                ))}
              </div>
            ) : sleepLogged ? (
              <div className="sleep-now" style={{ fontSize: 13, color: 'var(--muted)' }}>{t('home.sleepPlannedAt', { time: fmtMin(minOf(db.days[iso].sleep)) })}</div>
            ) : null}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}