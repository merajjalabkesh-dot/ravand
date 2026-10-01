import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useApp, toFa, todayISO, isoAddDays, faDate, minOf, fmtMin, nextEventISO } from '../lib/store'
import EventCard from '../components/EventCard'
import JalaliDatePicker from '../components/JalaliDatePicker'
import PricingTable from '../components/app/PricingTable'
import { useI18n } from '../lib/i18n'

const fadeUp = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 10 }, transition: { duration: .35, ease: [0.22, 1, 0.36, 1] } }

export default function Reports() {
  const { db, mutate, toast } = useApp()
  const { t, num } = useI18n()
  const [tab, setTab] = useState('overview')
  const [range, setRange] = useState('week') // week | month | qtr | all
  const [selectedDay, setSelectedDay] = useState(null)

  const dayIds = (iso) => { const d = db.days[iso]; if (!d) return new Set(); return new Set(Object.keys(d.habits || {}).filter((k) => d.habits[k])) }
  const dayPct = (iso) => {
    const goods = db.habits.filter((h) => h.type !== 'bad')
    if (!goods.length) return 0
    const ids = dayIds(iso); let n = 0
    goods.forEach((g) => { if (ids.has(g.id)) n++ })
    return Math.round((n / goods.length) * 100)
  }
  const taskStats = (iso) => {
    const d = db.days[iso]
    if (!d || !d.tasks || !d.tasks.length) return null
    const done = d.tasks.filter((t) => t.done).length
    return { done, total: d.tasks.length, pct: Math.round(done / d.tasks.length * 100) }
  }
  const rangeDays = () => {
    if (range === 'week') return 7
    if (range === 'month') return 30
    if (range === 'qtr') return 90
    return Math.max(7, ...db.habits.map((h) => { const c = h.createdAt ? Math.round((Date.now() - new Date(h.createdAt + 'T00:00:00').getTime()) / 86400000) : 0; return c }), ...Object.keys(db.days).filter((k) => db.days[k] && (db.days[k].habits && Object.keys(db.days[k].habits).length || (db.days[k].tasks && db.days[k].tasks.length) || db.days[k].journal && (db.days[k].journal.text || db.days[k].journal.mood))).map((k) => Math.round((Date.now() - new Date(k + 'T00:00:00').getTime()) / 86400000)))
  }
  const ds = (() => { const n = rangeDays(); const a = []; for (let i = n - 1; i >= 0; i--) a.push(isoAddDays(todayISO(), -i)); return a })()

  const tabs = [['overview', 'reports.tabOverview'], ['habits', 'reports.tabHabits'], ['pricing', 'reports.tabPricing'], ['day', 'reports.tabDay'], ['sleep', 'reports.tabSleep'], ['events', 'reports.tabEvents']]

  // ---- overview computations ----
  const avgPct = (arr) => arr.length ? Math.round(arr.reduce((s, x) => s + dayPct(x), 0) / arr.length) : 0
  const cur = ds.filter((x) => x <= todayISO())
  const prevN = range === 'week' ? 7 : range === 'month' ? 30 : 45
  const prevDs = (() => { const a = []; for (let i = prevN - 1; i >= 0; i--) a.push(isoAddDays(todayISO(), -prevN - i)); return a })()
  const curAvg = avgPct(cur)
  const prevAvg = avgPct(prevDs)
  const dPct = curAvg - prevAvg
  const maxPct = Math.max(1, ...cur.map(dayPct))

  const moodArr = cur.filter((iso) => db.days[iso] && db.days[iso].journal && db.days[iso].journal.mood).map((iso) => db.days[iso].journal.mood)
  const avgMood = moodArr.length ? Math.round(moodArr.reduce((a, b) => a + b, 0) / moodArr.length) : 0
  const moodLvl = (m) => t(['reports.moodDash', 'reports.moodLow', 'reports.moodLazy', 'reports.moodNormal', 'reports.moodGood', 'reports.moodGreat'][m])

  const tasksTotal = cur.reduce((s, x) => { const ts = taskStats(x); return s + (ts ? ts.done : 0) }, 0)
  const tasksAll = cur.reduce((s, x) => { const ts = taskStats(x); return s + (ts ? ts.total : 0) }, 0)
  const tasksPct = tasksAll ? Math.round(tasksTotal / tasksAll * 100) : 0

  const sleepTimes = cur.filter((iso) => db.days[iso] && db.days[iso].sleep && db.days[iso].wake).map((iso) => ({ wake: minOf(db.days[iso].wake), sleep: minOf(db.days[iso].sleep), json: iso }))
  const avgSleep = sleepTimes.length ? Math.round(sleepTimes.reduce((s, x) => s + (x.sleep >= 720 ? x.sleep : x.sleep + 1440), 0) / sleepTimes.length) : null
  const avgWake = sleepTimes.length ? Math.round(sleepTimes.reduce((s, x) => s + x.wake, 0) / sleepTimes.length) : null

  // ---- per-habit compliance ----
  const habitStats = (h) => {
    const isBad = h.type === 'bad'
    let scheduled = 0, relapsed = 0
    const start = h.createdAt || todayISO()
    cur.forEach((iso) => {
      if (iso < start) return
      scheduled++
      if (dayIds(iso).has(h.id)) relapsed++ // done day = relapse for bad habits
    })
    const done = isBad ? 0 : scheduled - relapsed
    const clean = isBad ? scheduled - relapsed : 0
    const rate = scheduled ? Math.round(done / scheduled * 100) : 0
    return { scheduled, done, relapsed, rate, clean }
  }

  // ---- modal for a single day ----
  const DayModal = ({ iso }) => {
    const d = db.days[iso]
    const closed = () => setSelectedDay(null)
    return (
      <div className="day-modal-backdrop" onClick={closed}>
        <div className="day-modal" onClick={(e) => e.stopPropagation()}>
          <div className="day-modal-head">
            <div>
              <div className="day-modal-title">{faDate(iso, true)}</div>
              <div className="day-modal-sub"><span className="mini-stat">{t('reports.dayModalHabitsStat', { pct: toFa(dayPct(iso)) })}</span>{d && d.journal && d.journal.mood > 0 && <span className="mini-stat">{t('reports.feelingLabel')}<b>{moodLvl(d.journal.mood)}</b></span>}</div>
            </div>
            <button className="btn ghost small" onClick={closed}>{t('reports.close')}</button>
          </div>

          {db.habits.length > 0 && <div className="day-modal-section">
            <div className="day-modal-label">{t('reports.habitsSection')}</div>
            {db.habits.map((h) => {
              const on = d && d.habits && d.habits[h.id]
              const bad = h.type === 'bad'
              return (
                <div className="day-modal-row" key={h.id}>
                  <span className="mini-dot" style={{ background: h.color }} />
                  <span className="mini-name">{h.name}</span>
                  <span className={'day-modal-status' + (on ? ' on' : ' off')}>{bad ? (on ? t('reports.statusDoneSad') : t('reports.statusClean')) : (on ? t('reports.statusDone') : t('reports.statusNotDone'))}</span>
                </div>
              )
            })}
          </div>}

          {d && d.tasks && d.tasks.length > 0 && <div className="day-modal-section">
            <div className="day-modal-label">{t('reports.tasksSection')}</div>
            {d.tasks.map((t, i) => (
              <div className="day-modal-row" key={i}>
                <span className={'task-box done' + (t.done ? '' : ' todo')} />
                <span className={'ttext' + (t.done ? ' done' : '')}>{t.text}</span>
              </div>
            ))}
          </div>}

          {d && d.journal && (d.journal.text || d.journal.mood) && <div className="day-modal-section">
            <div className="day-modal-label">{t('reports.journalSection')}{d.journal.mood > 0 && <span className="mini-stat" style={{ marginRight: 8 }}>{t('reports.feelingLabel')}{moodLvl(d.journal.mood)}</span>}</div>
            {d.journal.text ? <div className="day-modal-journal">{d.journal.text}</div> : <div className="day-modal-sub">{t('reports.journalNoNote')}</div>}
          </div>}

          {/* sleep */}
          <div className="day-modal-section">
            <div className="day-modal-label">{t('reports.sleepSection')}</div>
            <div className="day-modal-row">
              <span className="mini-stat">{t('reports.dayModalWakeStat', { time: d && d.wake ? fmtMin(minOf(d.wake)) : t('reports.moodDash') })}</span>
              <span className="mini-stat">{t('reports.dayModalSleepStat', { time: d && d.sleep ? fmtMin(minOf(d.sleep)) : t('reports.moodDash') })}</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  const body = (() => {
      if (tab === 'pricing') {
        return <PricingTable mode="month" />
      }
      if (tab === 'day') {
      return (
        <div className="glass">
          <div className="glass-title">{t('reports.recentDaysTitle')}</div>
          {ds.slice().reverse().map((iso2) => {
            const p = dayPct(iso2), d = db.days[iso2]
            const isT = iso2 === todayISO()
            return (
              <div className="journal-entry clickable" key={iso2} onClick={() => setSelectedDay(iso2)}>
                <div className="journal-head">
                  <span className="journal-date">{faDate(iso2, true)}{isT && <span style={{ color: 'var(--accent)', fontWeight: 700, marginRight: 8 }}>{t('reports.today')}</span>}</span>
                  <span className="journal-mood"><span className="mini-stat">{t('reports.dayTabHabitsStat', { pct: toFa(p) })}</span>{d && d.tasks && d.tasks.length > 0 && <span className="mini-stat" style={{ marginRight: 10 }}>{t('reports.dayTabTasksStat', { done: toFa(d.tasks.filter((t) => t.done).length), total: toFa(d.tasks.length) })}</span>}<span style={{ color: 'var(--accent)', fontSize: 13 }}>{t('reports.detailsHint')}</span></span>
                </div>
                <div className="dots30">
                  {db.habits.map((h) => <span key={h.id} className="dot" style={{ background: (d && d.habits && d.habits[h.id]) ? h.color : 'rgba(255,255,255,.06)' }} title={h.name} />)}
                </div>
              </div>
            )
          })}
          {ds.length === 0 && <div className="empty-state"><div className="big">✦</div><p>{t('reports.dayEmpty')}</p></div>}
        </div>
      )
    }
    if (tab === 'habits') {
      if (!db.habits.length) return <div className="empty-state"><div className="big">✦</div><p>{t('reports.habitsEmpty')}</p></div>
      return (
        <div className="glass">
          <div className="glass-title">{t('reports.habitsAnalysisTitle')}</div>
          {db.habits.map((h) => {
            const bad = h.type === 'bad'
            const st = habitStats(h)
            const rate = Math.min(100, Math.round(bad ? (st.clean / Math.max(1, st.scheduled)) * 100 : st.rate))
            return (
              <div className="analy-row" key={h.id}>
                <div className="analy-top"><span className="habit-color" style={{ background: h.color, width: 14, height: 14, borderRadius: '50%' }} /><span className="analy-name">{h.name}</span><span className="analy-rate">{bad ? t('reports.cleanDaysStat', { clean: toFa(st.clean), scheduled: toFa(st.scheduled) }) : t('reports.doneStat', { done: toFa(st.done), scheduled: toFa(st.scheduled) })}{t('reports.dotSeparator')}<b style={{ color: 'var(--accent)' }}>{toFa(rate)}{t('reports.percentSign')}</b></span></div>
                <div className="analy-bar"><div className="analy-fill" style={{ width: rate + '%' }} /></div>
                <div className="dots30">{cur.map((x) => <span key={x} className={'dot' + (bad ? (dayIds(x).has(h.id) ? '' : ' on') : (dayIds(x).has(h.id) ? ' on' : ''))} title={faDate(x)} />)}</div>
              </div>
            )
          })}
        </div>
      )
    }
    if (tab === 'sleep') {
      return (
        <div className="glass">
          <div className="glass-title">{t('reports.sleepTrendTitle', { days: num(range === 'qtr' ? 90 : range === 'month' ? 30 : 7) })}</div>
          {sleepTimes.length === 0 ? <div className="empty-state"><div className="big">🌙</div><p>{t('reports.sleepEmpty')}</p></div> : (
            <>
              <div className="sleep-chart">
                {sleepTimes.map(({ wake, sleep, json }) => {
                  const wn = wake / 1440 * 100, sn = ((sleep >= 720 ? sleep : sleep + 1440) % 1440) / 1440 * 100
                  return (
                    <div className="sleep-col" key={json} title={faDate(json)}>
                      <div className="sleep-band" style={{ top: `${Math.min(wn, sn)}%`, height: `${Math.max(2, Math.abs(wn - sn))}%` }} />
                      <div className="sleep-dot" style={{ top: `${wn}%` }} />
                    </div>
                  )
                })}
              </div>
              <div className="chart-caption">
                {t('reports.avgWakeStat', { time: avgWake !== null ? fmtMin(avgWake) : t('reports.moodDash') })}{t('reports.avgSleepStat', { time: avgSleep !== null ? fmtMin(avgSleep) : t('reports.moodDash') })}
              </div>
            </>
          )}
          <div className="chart-caption" style={{ marginTop: 14 }}>{t('reports.sleepChartLegend')}</div>
        </div>
      )
    }
    if (tab === 'events') {
      return <EventsTab db={db} mutate={mutate} toast={toast} t={t} />
    }
    // ---- overview (default) ----
    const wMax = Math.max(1, ...cur.map((x) => taskStats(x) ? taskStats(x).total : 0))
    return (
      <div className="glass">
        <div className="glass-title">{t('reports.overviewTitle', { range: t(range === 'week' ? 'reports.overviewRangeWeek' : range === 'month' ? 'reports.overviewRangeMonth' : range === 'qtr' ? 'reports.overviewRangeQtr' : 'reports.overviewRangeAll') })}</div>

        {/* habits bar chart */}
        <div className="chart">
          {cur.map((iso2) => {
            const p = dayPct(iso2), h2 = Math.max(4, p / maxPct * 100)
            const isT = iso2 === todayISO()
            return (
              <div className="bar-col" key={iso2} onClick={() => setSelectedDay(iso2)} title={t('reports.barTitle', { date: faDate(iso2) })} style={{ cursor: 'pointer' }}>
                <div className="bar-val">{toFa(p)}</div>
                <div className={'bar' + (p === 100 ? ' full' : '')} style={{ height: h2.toFixed(1) + 'px' }} />
                <div className="bar-day">{range === 'week' || range === 'month' ? t(['reports.weekdaySun', 'reports.weekdayMon', 'reports.weekdayTue', 'reports.weekdayWed', 'reports.weekdayThu', 'reports.weekdayFri', 'reports.weekdaySat'][new Date(iso2.split('-').map(Number)).getDay()]) : ''}</div>
              </div>
            )
          })}
        </div>

        {/* delta + stats */}
        <div className="report-stats">
          <div className="kpi"><div className="n">{toFa(curAvg)}<span style={{ fontSize: 12, color: 'var(--muted)' }}>{t('reports.percentSign')}</span></div><div className="l">{t('reports.avgHabits')}</div></div>
          <div className="kpi"><div className={'n ' + (dPct >= 0 ? 'up' : 'down')}>{dPct >= 0 ? t('reports.trendArrowUp') : t('reports.trendArrowDown')} {toFa(Math.abs(dPct))}<span style={{ fontSize: 12, color: 'var(--muted)' }}>{t('reports.percentSign')}</span></div><div className="l">{t('reports.vsPrevious')}</div></div>
          <div className="kpi"><div className="n">{toFa(tasksPct)}<span style={{ fontSize: 12, color: 'var(--muted)' }}>{t('reports.percentSign')}</span></div><div className="l">{t('reports.tasksDoneKpi')}</div></div>
          <div className="kpi"><div className="n">{avgMood ? moodLvl(avgMood) : t('reports.moodDash')}</div><div className="l">{t('reports.avgFeelingKpi')}</div></div>
        </div>

        {/* tasks + sleep mini */}
        <div className="report-mini-grid">
          <div className="mini-panel">
            <div className="mini-panel-title">{t('reports.tasksInRangeTitle')}</div>
            {tasksAll === 0 ? <div className="mini-panel-empty">{t('reports.tasksNoneRecorded')}</div> : (
              <>
                <div className="mini-panel-bar"><div className="analy-fill" style={{ width: tasksPct + '%' }} /></div>
                <div className="mini-panel-caption">{t('reports.tasksRangeCaption', { done: toFa(tasksTotal), total: toFa(tasksAll), perDay: toFa(Math.round(tasksTotal / Math.max(1, cur.filter((x) => taskStats(x)).length))) })}</div>
              </>
            )}
          </div>
          <div className="mini-panel">
            <div className="mini-panel-title">{t('reports.sleepMiniTitle')}</div>
            {avgWake === null ? <div className="mini-panel-empty">{t('reports.sleepMiniEmpty')}</div> : (
              <>
                <div className="mini-panel-big">{fmtMin(avgWake)} <span className="mini-panel-lbl">{t('reports.sleepMiniWakeLabel')}</span>{t('reports.dotSeparator')}{fmtMin(avgSleep)} <span className="mini-panel-lbl">{t('reports.sleepMiniSleepLabel')}</span></div>
                <div className="mini-panel-caption">{t('reports.sleepMiniDaysStat', { count: toFa(sleepTimes.length) })}</div>
              </>
            )}
          </div>
        </div>
      </div>
    )
  })()

  return (
    <motion.div variants={{ animate: { transition: { staggerChildren: 0.05 } } }} initial="initial" animate="animate" exit="exit">
      <motion.div variants={fadeUp} className="page-head">
        <h1>{t('reports.pageTitle')}</h1>
        <div className="sub">{t('reports.pageSubtitle')}</div>
        <div className="report-range">
          {[['week', 'reports.rangeWeek'], ['month', 'reports.rangeMonth'], ['qtr', 'reports.rangeQtr'], ['all', 'reports.rangeAll']].map(([k, l]) => (
            <button key={k} className={range === k ? 'active' : ''} onClick={() => setRange(k)}>{t(l)}</button>
          ))}
        </div>
      </motion.div>

      <motion.div variants={fadeUp}>
        <div className="report-tabs">{tabs.map(([k, l]) => <button key={k} className={tab === k ? 'active' : ''} onClick={() => setTab(k)}>{t(l)}</button>)}</div>
        {body}
      </motion.div>

      <AnimatePresence>{selectedDay && <DayModal iso={selectedDay} />}</AnimatePresence>
    </motion.div>
  )
}

function EventsTab({ db, mutate, toast, t }) {
  const [showForm, setShowForm] = useState(false)
  const [en, setEn] = useState('')
  const [type, setType] = useState('recurring') // recurring | once
  const [dte, setDte] = useState('')
  const events = [...(db.events || [])].map((ev) => ({ ...ev, next: nextEventISO(ev) })).filter((ev) => ev.next).sort((a, b) => (a.next < b.next ? -1 : 1))
  const add = () => {
    if (!en.trim() || !dte) { toast(t('reports.toastNameDateRequired')); return }
    const recurring = type === 'recurring'
    const date = recurring ? String(dte).slice(5) : String(dte)
    mutate((s) => { s.events = s.events || []; s.events.push({ id: Math.random().toString(36).slice(2, 8), name: en.trim(), date, recurring }) })
    toast(t('reports.toastEventAdded', { name: en.trim() }))
    setEn(''); setDte(''); setShowForm(false)
  }
  const del = (id) => { if (!confirm(t('reports.confirmDeleteEvent'))) return; mutate((s) => { s.events = (s.events || []).filter((e) => e.id !== id) }); toast(t('reports.toastEventDeleted')) }
  return (
    <div className="glass">
      <div className="glass-title"><span>{t('reports.eventsTitle')}</span><button className="btn ghost small" onClick={() => setShowForm((v) => !v)}>{showForm ? t('reports.closeForm') : t('reports.newEvent')}</button></div>
      {showForm && (
        <div className="event-form">
          <div className="field" style={{ marginBottom: 10 }}>
            <label>{t('reports.eventNameLabel')}</label>
            <input className="input" maxLength={40} placeholder={t('reports.eventNamePlaceholder')} value={en} onChange={(e) => setEn(e.target.value)} />
          </div>
          <div className="event-form-row">
            <div className="field" style={{ flex: 1, marginBottom: 10 }}>
              <label>{t('reports.repeatLabel')}</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <button className={'type-btn good' + (type === 'recurring' ? ' sel' : '')} onClick={() => setType('recurring')}>{t('reports.repeatYearly')}</button>
                <button className={'type-btn bad' + (type === 'once' ? ' sel' : '')} onClick={() => setType('once')}>{t('reports.repeatOnce')}</button>
              </div>
            </div>
            <div className="field" style={{ flex: 1, marginBottom: 10 }}>
              <label>{type === 'recurring' ? t('reports.dayMonthLabel') : t('reports.dateLabel')}</label>
              <JalaliDatePicker value={dte} onChange={(v) => v && setDte(v)} min={type === 'once' ? todayISO() : undefined} />
            </div>
          </div>
          <button className="btn" onClick={add}>{t('reports.addEvent')}</button>
        </div>
      )}
      {events.length === 0 ? <div className="empty-state"><div className="big">📅</div><p>{t('reports.eventsEmpty')}<br />{t('reports.eventsEmptyHint')}</p></div>
        : <>
          <div className="event-list">
            {events.map((ev) => <EventCard key={ev.id} ev={ev} onDelete={() => del(ev.id)} />)}
          </div>
          <div className="chart-caption">{t('reports.eventsCaption')}</div>
        </>}
    </div>
  )
}