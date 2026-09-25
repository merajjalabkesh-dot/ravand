import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp, toFa, todayISO, isoAddDays, faDate, fmtMin, minOf, playTick, browserNotify } from '../lib/store'
import JalaliDatePicker from '../components/JalaliDatePicker'

const fadeUp = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 10 }, transition: { duration: .35, ease: [0.22, 1, 0.36, 1] } }

export default function Today() {
  const { db, mutate, toast } = useApp()
  const [iso, setIso] = useState(todayISO())
  const isToday = iso === todayISO()
  const d = db.days[iso] || { habits: {}, tasks: [], journal: { mood: 0, text: '' } }
  const ids = db.days[iso] ? new Set(Object.keys(d.habits || {}).filter((k) => d.habits[k])) : new Set()
  const pct = (() => {
    const goods = db.habits.filter((h) => h.type !== 'bad' && (h.type !== 'good' || (!(h.days || []).length) || (h.days || []).includes(new Date(iso.split('-').map(Number)).getDay())))
    if (!goods.length) return 0
    let n = 0
    goods.forEach((h) => { if (ids.has(h.id)) n++ })
    return Math.round((n / goods.length) * 100)
  })()
  const tD = (d.tasks || []).filter((t) => t.done).length
  const tC = (d.tasks || []).length

  const isSched = (h) => { if (h.type === 'bad') return true; const dd = h.days || []; if (!dd.length) return true; return dd.includes(new Date(iso.split('-').map(Number)).getDay()) }
  const habitStreak = (id) => { let s = 0, x = iso; if (!ids.has(id)) x = isoAddDays(x, -1); while ((db.days[x] && db.days[x].habits && db.days[x].habits[id])) { s++; x = isoAddDays(x, -1) }; return s }
  const cleanStreak = (id) => { const h = db.habits.find((y) => y.id === id); let st = 0, x = todayISO(); const start = h ? h.createdAt : x; while (x >= start) { if (db.days[x] && db.days[x].habits && db.days[x].habits[id]) break; st++; x = isoAddDays(x, -1) } return st }

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
        if (cs === 1) toast('روز اولِ پاک مبارک! 🌱')
        else if (cs === 7) toast('یک هفتهٔ پاک! 🎉')
        else if (cs === 30) toast('یک ماهِ پاک! 🏆')
      }
      // day completed notification (only today)
      if (isToday) {
        const goods = db.habits.filter((x) => x.type !== 'bad')
        const schedIds = goods.filter((g) => !(g.days || []).length || (g.days || []).includes(new Date(iso.split('-').map(Number)).getDay()))
        if (schedIds.length > 0 && schedIds.every((g) => day.habits && day.habits[g.id]) && db.settings.notify && !wasOn) {
          browserNotify('روند', 'آفرین! همهٔ عادت‌های امروزت را تمام کردی 🎉', { tag: 'day-complete' })
        }
      }
    })
  }
  const toggleTask = (id) => {
    const t = (d.tasks || []).find((x) => x.id === id)
    if (!t) return
    if (db.settings.sound) playTick()
    mutate((s) => {
      const day = s.days[iso] || (s.days[iso] = { habits: {}, tasks: [], journal: { mood: 0, text: '' } })
      const task = day.tasks.find((x) => x.id === id)
      if (task) task.done = !task.done
      if (task && task.done && day.tasks.length > 0 && day.tasks.every((x) => x.done)) toast('همهٔ کارها تمام شد! ✅')
    })
  }
  const delTask = (id) => { mutate((s) => { const day = s.days[iso] || (s.days[iso] = { habits: {}, tasks: [], journal: { mood: 0, text: '' } }); day.tasks = day.tasks.filter((x) => x.id !== id) }); toast('کار حذف شد') }
  const addTask = () => {
    const inp = document.getElementById('task-input')
    const when = document.getElementById('task-date')
    if (!inp || !inp.value.trim()) { toast('کار را بنویس'); return }
    const target = when && when.value ? when.value : iso
    mutate((s) => { const day = s.days[target] || (s.days[target] = { habits: {}, tasks: [], journal: { mood: 0, text: '' } }); day.tasks = day.tasks || []; day.tasks.push({ id: Math.random().toString(36).slice(2, 7), text: inp.value.trim(), done: false }) })
    inp.value = ''
    toast(target === iso ? 'کار اضافه شد' : 'کار برای ' + faDate(target, false) + ' ثبت شد')
  }

  return (
    <motion.div variants={{ animate: { transition: { staggerChildren: 0.06 } } }} initial="initial" animate="animate" exit="exit">
      <motion.div variants={fadeUp} className="page-head">
        <div style={{ display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
          <button className="day-nav" onClick={() => setIso(isoAddDays(iso, -1))} title="روز قبل" aria-label="روز قبل"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 26 }}>{faDate(iso, true)}</h1>
            <div className="sub">{isToday ? 'گزارش همین امروز — عادت‌ها و کارهایی که ثبت شد.' : 'بازبینی و ویرایش این روز.'}</div>
          </div>
          <button className="day-nav" onClick={() => setIso(isoAddDays(iso, 1))} title="روز بعد" aria-label="روز بعد" disabled={isToday}><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>
          <JalaliDatePicker value={iso} onChange={(v) => v && setIso(v)} max={todayISO()} className="today-date-input" />
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5"/><path d="M9 19v-6"/><path d="M14 19V8"/><path d="M19 19v-10"/></svg> {isToday ? 'عادت‌های امروز' : 'عادت‌های این روز'}</div>
        {db.habits.length === 0 ? <div className="empty-state"><div className="big">✦</div><p>هنوز عادتی نداری. اول از صفحهٔ «عادت‌ها» یکی بساز.</p></div>
          : db.habits.map((h) => {
            const done = ids.has(h.id)
            const bad = h.type === 'bad'
            if (bad) {
              const cs = cleanStreak(h.id)
              return (
                <div className={'habit-check bad' + (done ? ' bad-done' : '')} key={h.id} onClick={() => toggleHabit(h.id)}>
                  <span className="habit-color" style={{ background: h.color }} />
                  <span className="hname">{h.name}</span>
                  {cs > 0 && <span className="streak">{toFa(cs)} روز پاک 🔥</span>}
                  <span className="check-circle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>
                </div>
              )
            }
            const sched = isSched(h)
            const st = habitStreak(h.id)
            return (
              <div className={'habit-check' + (done ? ' done' : '')} key={h.id} onClick={() => toggleHabit(h.id)} style={sched ? {} : { opacity: .55 }}>
                <span className="habit-color" style={{ background: h.color }} />
                <span className="hname">{h.name}{!sched && <small style={{ color: 'var(--muted)' }}> (امروز برنامه نیست)</small>}</span>
                {st > 0 && <span className="streak">{toFa(st)} روز</span>}
                <span className="check-circle"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>
              </div>
            )
          })}
        <p className="glass-hint">روی هر عادت بزن تا انجام‌شده علامت بخورد.</p>
      </motion.div>

      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg> {isToday ? 'کارهای روزانه' : 'کارهای این روز'}</div>
        {tC === 0 ? <p className="glass-hint">{isToday ? 'کارهای امروزت را بنویس تا گزارش روز کامل شود.' : 'کاری برای این روز ثبت نشده.'}</p>
          : (d.tasks || []).map((t) => (
            <div className={'task-row' + (t.done ? ' done' : '')} key={t.id}>
              <span className="task-box" onClick={() => toggleTask(t.id)}><svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>
              <span className="ttext">{t.text}</span>
              <button className="task-del" onClick={() => delTask(t.id)} title="حذف"><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>
            </div>
          ))}
        <div className="add-row">
          <input className="input" id="task-input" maxLength={120} placeholder="کار جدید را بنویس…" onKeyDown={(e) => e.key === 'Enter' && addTask()} />
          <input className="input" type="date" id="task-date" defaultValue={iso} min={iso} max="2099-12-31" title="تاریخ انجام کار" style={{ width: 'auto' }} />
          <button className="btn" onClick={addTask}>افزودن</button>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3.2 1.8"/></svg> گزارش روز</div>
        <div className="ring-wrap">
          <svg className="ring" width="112" height="112" viewBox="0 0 112 112">
            <circle className="bg" cx="56" cy="56" r="53" />
            <motion.circle className="fg" cx="56" cy="56" r="53"
              strokeDasharray={2 * Math.PI * 53}
              initial={{ strokeDashoffset: 2 * Math.PI * 53 }}
              animate={{ strokeDashoffset: 2 * Math.PI * 53 * (1 - pct / 100) }}
              transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }} />
          </svg>
          <div className="kpis">
            <div className="kpi"><div className="n">{toFa(pct)}<span style={{ fontSize: 13, color: 'var(--muted)' }}>٪</span></div><div className="l">عادت‌ها</div></div>
            <div className="kpi"><div className="n">{toFa(tD)} / {toFa(tC)}</div><div className="l">کارها</div></div>
            {pct === 100 && <div className="kpi"><div className="v" style={{ color: 'var(--accent-warm)' }}>عالی</div><div className="l">روز کامل</div></div>}
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}