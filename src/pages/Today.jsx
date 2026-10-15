import React, { useState, useMemo } from 'react'
import { motion } from 'framer-motion'
import { useApp, toFa, todayISO, isoAddDays, faDate, fmtMin, minOf, playTick, browserNotify, isScheduled } from '../lib/store'
import { useI18n } from '../lib/i18n'
import JalaliDatePicker from '../components/JalaliDatePicker'

const fadeUp = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 10 }, transition: { duration: .35, ease: [0.22, 1, 0.36, 1] } }

export default function Today() {
  const { db, mutate, toast } = useApp()
  const { t } = useI18n()
  const [iso, setIso] = useState(todayISO())
  const [taskDate, setTaskDate] = useState(todayISO())
  const [taskStartTime, setTaskStartTime] = useState('')
  const [taskEndTime, setTaskEndTime] = useState('')
  const [conflictModal, setConflictModal] = useState(null)
  const isToday = iso === todayISO()
  const d = db.days[iso] || { habits: {}, tasks: [], journal: { mood: 0, text: '' } }
  const ids = db.days[iso] ? new Set(Object.keys(d.habits || {}).filter((k) => d.habits[k])) : new Set()

  // pct و استریک‌ها از db و روز انتخابی مشتق می‌شوند و در هر رندر دوباره
  // حساب می‌شدند؛ cleanStreak می‌تواند تا createdAt صدها روز عقب برود.
  // حالا فقط با تغییر db یا روز دوباره حساب می‌شوند.
  const { pct, streaks, cleanStreaks } = useMemo(() => {
    const safeIso = (typeof iso === 'string' && iso.includes('-')) ? iso : todayISO()
    const pIso = safeIso.split('-').map(Number)
    const dow = new Date(pIso[0], pIso[1] - 1, pIso[2]).getDay()
    const goods = db.habits.filter((h) => h.type !== 'bad' && (h.type !== 'good' || (!(h.days || []).length) || (h.days || []).includes(dow)))
    let p = 0
    if (goods.length) {
      let n = 0
      goods.forEach((h) => { if (ids.has(h.id)) n++ })
      p = Math.round((n / goods.length) * 100)
    }
    const st = {}
    const cs = {}
    db.habits.forEach((h) => {
      let s = 0, x = iso
      if (!ids.has(h.id)) x = isoAddDays(x, -1)
      while (db.days[x] && db.days[x].habits && db.days[x].habits[h.id]) { s++; x = isoAddDays(x, -1) }
      st[h.id] = s
      let c = 0, y = todayISO()
      const start = h.createdAt || y
      while (y >= start) { if (db.days[y] && db.days[y].habits && db.days[y].habits[h.id]) break; c++; y = isoAddDays(y, -1) }
      cs[h.id] = c
    })
    return { pct: p, streaks: st, cleanStreaks: cs }
  }, [db, iso])

  const tD = (d.tasks || []).filter((t) => t.done).length
  const tC = (d.tasks || []).length

  const isSched = isScheduled
  const visibleHabits = db.habits.filter((h) => isSched(h, iso))
  const habitStreak = (id) => streaks[id] || 0
  const cleanStreak = (id) => cleanStreaks[id] || 0

  const toggleHabit = (id) => {
    const h = db.habits.find((y) => y.id === id)
    const wasOn = ids.has(id)
    if (db.settings.sound) playTick()
    mutate((s) => {
      const day = s.days[iso] || (s.days[iso] = { habits: {}, tasks: [], journal: { mood: 0, text: '' } })
      day.habits = day.habits || {}
      if (wasOn) delete day.habits[id]; else day.habits[id] = true
      if (h && h.type === 'bad' && !wasOn && isToday) {
        const cs = cleanStreak(id)
        if (cs === 1) toast(t('today.firstCleanDayToast'))
        else if (cs === 7) toast(t('today.cleanWeekToast'))
        else if (cs === 30) toast(t('today.cleanMonthToast'))
      }
      // day completed notification (only today)
      if (isToday) {
        const goods = db.habits.filter((x) => x.type !== 'bad')
        const schedIds = goods.filter((g) => isScheduled(g, iso))
        if (schedIds.length > 0 && schedIds.every((g) => day.habits && day.habits[g.id]) && db.settings.notify && !wasOn) {
          browserNotify(t('today.notifyTitle'), t('today.allHabitsDoneNotification'), { tag: 'day-complete' })
        }
      }
    })
  }
  const toggleTask = (id) => {
    // نام محلی «task» نه «t» — نام t تابع ترجمهٔ useI18n است و اگر
    // همین‌جا سایه می‌افتاد، فراخوانی t('today.allTasksDoneToast') هنگام
    // تیک زدن آخرین کار اپ را کرش می‌داد و صفحه سفید می‌شد.
    const existing = (d.tasks || []).find((x) => x.id === id)
    if (!existing) return
    if (db.settings.sound) playTick()
    mutate((s) => {
      const day = s.days[iso] || (s.days[iso] = { habits: {}, tasks: [], journal: { mood: 0, text: '' } })
      day.tasks = day.tasks || []
      const task = day.tasks.find((x) => x.id === id)
      if (task) task.done = !task.done
      if (task && task.done && day.tasks.length > 0 && day.tasks.every((x) => x.done)) toast(t('today.allTasksDoneToast'))
    })
  }
  const delTask = (id) => { mutate((s) => { const day = s.days[iso] || (s.days[iso] = { habits: {}, tasks: [], journal: { mood: 0, text: '' } }); day.tasks = (day.tasks || []).filter((x) => x.id !== id) }); toast(t('today.taskDeletedToast')) }
  const moveTask = (id, dir) => {
    mutate((s) => {
      const day = s.days[iso]
      if (!day || !day.tasks) return
      const list = day.tasks
      const i = list.findIndex((x) => x.id === id)
      const j = i + dir
      if (i < 0 || j < 0 || j >= list.length) return
      const [item] = list.splice(i, 1)
      list.splice(j, 0, item)
    })
  }
  const parseTimeToMin = (tStr) => {
    if (!tStr || typeof tStr !== 'string' || !tStr.includes(':')) return null
    const [h, m] = tStr.split(':').map(Number)
    if (isNaN(h) || isNaN(m)) return null
    return h * 60 + m
  }

  const formatTimeSpan = (s, e) => {
    if (!s && !e) return null
    if (s && e) return `${toFa(s)} - ${toFa(e)}`
    if (s) return `${toFa(s)}`
    return `${toFa(e)}`
  }

  const checkConflict = (targetIso, sTime, eTime) => {
    if (!sTime && !eTime) return null
    const taskStartMin = parseTimeToMin(sTime)
    const taskEndMin = parseTimeToMin(eTime)
    let tStart = taskStartMin !== null ? taskStartMin : (taskEndMin - 30)
    let tEnd = taskEndMin !== null ? taskEndMin : (taskStartMin + 30)
    if (tStart > tEnd) {
      const temp = tStart
      tStart = tEnd
      tEnd = temp
    }

    const scheduledHabits = db.habits.filter((h) => isScheduled(h, targetIso) && (h.startTime || h.endTime))
    for (const habit of scheduledHabits) {
      const hStartMin = parseTimeToMin(habit.startTime)
      const hEndMin = parseTimeToMin(habit.endTime)
      let hStart = hStartMin !== null ? hStartMin : (hEndMin - 30)
      let hEnd = hEndMin !== null ? hEndMin : (hStartMin + 30)
      if (hStart > hEnd) {
        const temp = hStart
        hStart = hEnd
        hEnd = temp
      }
      if (Math.max(tStart, hStart) < Math.min(tEnd, hEnd)) {
        return {
          habit,
          habitTimeStr: formatTimeSpan(habit.startTime, habit.endTime)
        }
      }
    }
    return null
  }

  const insertTask = (text, target, sTime, eTime) => {
    mutate((s) => {
      const day = s.days[target] || (s.days[target] = { habits: {}, tasks: [], journal: { mood: 0, text: '' } })
      day.tasks = day.tasks || []
      day.tasks.push({
        id: Math.random().toString(36).slice(2, 7),
        text,
        done: false,
        startTime: sTime || undefined,
        endTime: eTime || undefined
      })
    })
    const inp = document.getElementById('task-input')
    if (inp) inp.value = ''
    setTaskStartTime('')
    setTaskEndTime('')
    setConflictModal(null)
    toast(target === todayISO() ? t('today.taskAddedToast') : t('today.taskAddedForDateToast', { date: faDate(target, false) }))
  }

  const addTask = (force = false) => {
    const inp = document.getElementById('task-input')
    if (!inp || !inp.value.trim()) { toast(t('today.emptyTaskErrorToast')); return }
    const text = inp.value.trim()
    const target = taskDate
    const sTime = taskStartTime.trim() || undefined
    const eTime = taskEndTime.trim() || undefined

    if (!force && (sTime || eTime)) {
      const conflict = checkConflict(target, sTime, eTime)
      if (conflict) {
        setConflictModal({
          taskText: text,
          targetDate: target,
          sTime,
          eTime,
          habit: conflict.habit,
          habitTimeStr: conflict.habitTimeStr
        })
        return
      }
    }

    insertTask(text, target, sTime, eTime)
  }

  return (
    <motion.div variants={{ animate: { transition: { staggerChildren: 0.06 } } }} initial="initial" animate="animate" exit="exit">
      <motion.div variants={fadeUp} className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <button className="day-nav" onClick={() => setIso(isoAddDays(iso, -1))} title={t('today.prevDay')} aria-label={t('today.prevDay')}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
                    <div style={{ minWidth: 0 }}>
                      <h1 style={{ fontSize: 26 }}>{faDate(iso, true)}</h1>
                      <div className="sub">{isToday ? t('today.todaySubtitle') : t('today.otherDaySubtitle')}</div>
                    </div>
                    <button className="day-nav" onClick={() => setIso(isoAddDays(iso, 1))} title={t('today.nextDay')} aria-label={t('today.nextDay')} disabled={isToday}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>
                    <JalaliDatePicker value={iso} onChange={(v) => { if (v) { setIso(v); setTaskDate(v) } }} max={todayISO()} className="today-date-input" style={{ zIndex: 50 }} />
                    {!isToday && <button className="btn ghost small" onClick={() => { setIso(todayISO()); setTaskDate(todayISO()) }}>{t('today.backToToday')}</button>}
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5"/><path d="M9 19v-6"/><path d="M14 19V8"/><path d="M19 19v-10"/></svg> {isToday ? t('today.habitsTitleToday') : t('today.habitsTitleOtherDay')}</div>
        {visibleHabits.length === 0 ? <div className="empty-state"><div className="big">✦</div><p>{t('today.emptyHabits')}</p></div>
          : visibleHabits.map((h) => {
            const done = ids.has(h.id)
            const bad = h.type === 'bad'
            const timeBadge = formatTimeSpan(h.startTime, h.endTime)
            if (bad) {
              const cs = cleanStreak(h.id)
              return (
                <div className={'habit-check bad' + (done ? ' bad-done' : '')} key={h.id} onClick={() => toggleHabit(h.id)}>
                  <span className="habit-color" style={{ background: h.color }} />
                  <span className="hname">{h.name}</span>
                  {timeBadge && (
                    <span className="badge" style={{ fontSize: 11, background: 'rgba(139,92,246,.15)', color: 'var(--accent)', direction: 'ltr', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      <span>⏰</span> {timeBadge}
                    </span>
                  )}
                  {cs > 0 && <span className="streak">{toFa(cs)} {t('today.cleanStreakSuffix')}</span>}
                  <span className="check-circle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>
                </div>
              )
            }
            const st = habitStreak(h.id)
            return (
              <div className={'habit-check' + (done ? ' done' : '')} key={h.id} onClick={() => toggleHabit(h.id)}>
                <span className="habit-color" style={{ background: h.color }} />
                <span className="hname">{h.name}</span>
                {timeBadge && (
                  <span className="badge" style={{ fontSize: 11, background: 'rgba(139,92,246,.15)', color: 'var(--accent)', direction: 'ltr', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                    <span>⏰</span> {timeBadge}
                  </span>
                )}
                {st > 0 && <span className="streak">{toFa(st)} {t('today.streakDaysSuffix')}</span>}
                <span className="check-circle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>
              </div>
            )
          })}
        <p className="glass-hint">{t('today.habitsHint')}</p>
      </motion.div>

      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> {isToday ? 'کارهای روزانه' : 'کارهای این روز'}</div>
        {tC === 0 ? <p className="glass-hint">{isToday ? t('today.emptyTasksToday') : t('today.emptyTasksOtherDay')}</p>
          : (d.tasks || []).map((task, idx) => {
            const timeBadge = formatTimeSpan(task.startTime, task.endTime)
            return (
              <div className={'task-row' + (task.done ? ' done' : '')} key={task.id}>
                <span className="task-box" onClick={() => toggleTask(task.id)}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>
                <span className="ttext">
                  {task.text}
                  {timeBadge && (
                    <span className="badge" style={{ fontSize: 11, background: 'rgba(56,189,248,.14)', color: '#38bdf8', direction: 'ltr', display: 'inline-flex', alignItems: 'center', gap: 4, marginInlineStart: 8 }}>
                      <span>⏰</span> {timeBadge}
                    </span>
                  )}
                </span>
                <span style={{ display: 'inline-flex', gap: 4, alignItems: 'center' }}>
                  <button className="task-move" onClick={() => moveTask(task.id, -1)} disabled={idx === 0} title={t('today.moveUp')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 19V5M5 12l7-7 7 7"/></svg></button>
                  <button className="task-move" onClick={() => moveTask(task.id, 1)} disabled={idx === tC - 1} title={t('today.moveDown')}><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M19 12l-7 7-7-7"/></svg></button>
                </span>
                <button className="task-del" onClick={() => delTask(task.id)} title={t('today.deleteTask')}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
              </div>
            )
          })}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginTop: 12 }}>
          <div className="add-row">
            <input className="input" id="task-input" maxLength={120} placeholder={t('today.newTaskPlaceholder')} onKeyDown={(e) => e.key === 'Enter' && addTask()} />
            <JalaliDatePicker value={taskDate} onChange={(v) => v && setTaskDate(v)} min={iso} placeholder={t('today.pickDatePlaceholder')} />
            <button className="btn" onClick={() => addTask()}>{t('today.addTask')}</button>
          </div>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', paddingInlineStart: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>ساعت اختیاری:</span>
            <input
              type="time"
              className="input"
              style={{ width: 110, padding: '5px 8px', fontSize: 12, textAlign: 'center' }}
              value={taskStartTime}
              onChange={(e) => setTaskStartTime(e.target.value)}
              placeholder={t('today.startTimePlaceholder')}
              title={t('today.startTimePlaceholder')}
            />
            <span style={{ fontSize: 12, color: 'var(--muted)' }}>تا</span>
            <input
              type="time"
              className="input"
              style={{ width: 110, padding: '5px 8px', fontSize: 12, textAlign: 'center' }}
              value={taskEndTime}
              onChange={(e) => setTaskEndTime(e.target.value)}
              placeholder={t('today.endTimePlaceholder')}
              title={t('today.endTimePlaceholder')}
            />
            {(taskStartTime || taskEndTime) && (
              <button
                type="button"
                className="btn-ghost"
                style={{ fontSize: 11, padding: '2px 6px', color: 'var(--muted)' }}
                onClick={() => { setTaskStartTime(''); setTaskEndTime('') }}
              >
                پاک کردن
              </button>
            )}
          </div>
        </div>
      </motion.div>

      {conflictModal && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.68)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16
          }}
          onClick={() => setConflictModal(null)}
        >
          <div
            className="glass"
            style={{
              maxWidth: 420,
              width: '100%',
              background: '#0d1326',
              border: '1px solid rgba(245,166,35,0.4)',
              boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
              padding: 20
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#f5a623', marginBottom: 12, fontSize: 16, fontWeight: 700 }}>
              <span style={{ fontSize: 20 }}>⚠️</span>
              <span>{t('today.conflictModalTitle')}</span>
            </div>
            <p style={{ fontSize: 14, lineHeight: 1.7, color: 'var(--fg)', marginBottom: 20 }}>
              {t('today.conflictModalDesc', {
                task: conflictModal.taskText,
                habit: conflictModal.habit?.name || '',
                time: conflictModal.habitTimeStr || ''
              })}
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
              <button
                className="btn-ghost"
                style={{ fontSize: 13, padding: '8px 14px' }}
                onClick={() => {
                  insertTask(
                    conflictModal.taskText,
                    conflictModal.targetDate,
                    conflictModal.sTime,
                    conflictModal.eTime
                  )
                }}
              >
                {t('today.conflictIgnore')}
              </button>
              <button
                className="btn"
                style={{ fontSize: 13, padding: '8px 16px', background: 'var(--accent)' }}
                onClick={() => setConflictModal(null)}
              >
                {t('today.conflictRemindThanks')}
              </button>
            </div>
          </div>
        </div>
      )}

      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 1.8"/></svg> {t('today.dayReportTitle')}</div>
        <div className="ring-wrap">
          {/* شعاع از روی ضخامتِ خط حساب می‌شود (نه عدد ثابت) تا لبهٔ
              بیرونیِ حلقه از کادر SVG بیرون نزند و بریده نشود. */}
          {(() => { const stroke = 11, pad = 1, size = 112; const r = (size - stroke - pad * 2) / 2, c = 2 * Math.PI * r; return (
          <svg className="ring" width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
            <circle className="bg" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke} />
            <motion.circle className="fg" cx={size / 2} cy={size / 2} r={r} strokeWidth={stroke}
              strokeDasharray={c}
              initial={{ strokeDashoffset: c }}
              animate={{ strokeDashoffset: c * (1 - pct / 100) }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
          </svg>
          ) })()}
          <div className="kpis">
            <div className="kpi"><div className="n">{toFa(pct)}<span style={{ fontSize: 13, color: 'var(--muted)' }}>{t('today.percentKpiSuffix')}</span></div><div className="l">{t('today.habitsKpiLabel')}</div></div>
            <div className="kpi"><div className="n">{toFa(tD)} / {toFa(tC)}</div><div className="l">{t('today.tasksKpiLabel')}</div></div>
            {pct === 100 && <div className="kpi"><div className="v" style={{ color: 'var(--accent-warm)' }}>{t('today.greatKpiValue')}</div><div className="l">{t('today.fullDayKpiLabel')}</div></div>}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}