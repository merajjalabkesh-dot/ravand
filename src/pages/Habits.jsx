import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { useApp, toFa, todayISO, isoAddDays } from '../lib/store'

const fadeUp = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 10 }, transition: { duration: .35, ease: [0.22, 1, 0.36, 1] } }
const HABIT_COLORS = ['#8b5cf6', '#43e8a8', '#f5a623', '#f87171', '#38bdf8', '#a78bfa', '#fb923c']
const JW = ['یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه']

export default function Habits() {
  const { db, mutate, toast } = useApp()
  const [name, setName] = useState('')
  const [type, setType] = useState('good')
  const [days, setDays] = useState([])
  const [color, setColor] = useState(HABIT_COLORS[0])

  const dayIds = (iso) => { const d = db.days[iso]; if (!d) return new Set(); return new Set(Object.keys(d.habits || {}).filter((k) => d.habits[k])) }
  const habitStreak = (id) => { let s = 0, x = todayISO(); if (!dayIds(x).has(id)) x = isoAddDays(x, -1); while (dayIds(x).has(id)) { s++; x = isoAddDays(x, -1) }; return s }
  const cleanStreak = (id) => { const h = db.habits.find((y) => y.id === id); let st = 0, x = todayISO(); const start = h ? h.createdAt : x; while (x >= start) { if (dayIds(x).has(id)) break; st++; x = isoAddDays(x, -1) }; return st }
  const bestClean = (id) => { const h = db.habits.find((y) => y.id === id); let b = 0, c = 0, start = h ? h.createdAt : todayISO(); for (let i = 399; i >= 0; i--) { const x = isoAddDays(todayISO(), -i); if (x < start) break; if (!dayIds(x).has(id)) { c++; if (c > b) b = c } else c = 0 }; return b }
  const cleanCount30 = (id) => { const h = db.habits.find((y) => y.id === id); let n = 0, start = h ? h.createdAt : todayISO(); for (let i = 0; i < 30; i++) { const x = isoAddDays(todayISO(), -i); if (x < start) break; if (!dayIds(x).has(id)) n++ }; return n }
  const habitDone30 = (id) => { let n = 0; for (let i = 0; i < 30; i++) if (dayIds(isoAddDays(todayISO(), -i)).has(id)) n++; return n }
  const weekDone = (id) => { let n = 0; for (let i = 0; i < 7; i++) if (dayIds(isoAddDays(todayISO(), -i)).has(id)) n++; return n }

  const add = () => {
    if (!name.trim()) { toast('نام عادت را بنویس'); return }
    const good = type === 'good'
    mutate((s) => { s.habits.push({ id: Math.random().toString(36).slice(2, 7), name: name.trim(), color, type, weeklyGoal: 7, days: good && days.length ? [...days] : null, createdAt: todayISO() }) })
    toast((good ? 'عادت خوب' : 'ترک عادت بد') + ' «' + name.trim() + '» ساخته شد')
    setName(''); setType('good'); setDays([]); setColor(HABIT_COLORS[0])
  }
  const del = (id) => { if (!confirm('این عادت و سابقهٔ تمام روزهایش حذف می‌شود. مطمئنی؟')) return; mutate((s) => { s.habits = s.habits.filter((h) => h.id !== id) }); toast('عادت حذف شد') }
  const relapse = (id) => { if (!confirm('این عادت بد را امروز انجام دادی و پشیمونی؟ نگران نباش، همه گاهی می‌لغزن؛ مهم ادامه دادن است.')) return; mutate((s) => { const day = s.days[todayISO()] || (s.days[todayISO()] = { habits: {}, tasks: [], journal: { mood: 0, text: '' } }); day.habits = day.habits || {}; delete day.habits[id]; const h = s.habits.find((y) => y.id === id); if (h) h.lastRelapse = todayISO() }); toast('اشکالی نداره؛ از امروز دوباره شروع کن 💪') }

  const list = db.habits.length === 0 ? <div className="empty-state"><div className="big">✦</div><p>هنوز عادتی ثبت نکرده‌ای.<br />اولین عادتت — مثل «ورزش صبحگاهی» یا «کتاب خواندن» — را همین‌جا بساز.</p></div>
    : db.habits.map((h) => {
      const bad = h.type === 'bad'
      if (bad) {
        const cs = cleanStreak(h.id), bs = bestClean(h.id)
        let msg = ''
        if (cs >= 180) msg = 'شش ماهِ پاکِ باشکوه!'
        else if (cs >= 30) msg = 'یک ماهِ پاکِ عالی!'
        else if (cs >= 7) msg = 'یک هفتهٔ پاکِ شگفت‌انگیز!'
        else if (cs >= 1) msg = 'روز پاکِ اول — ادامه بده!'
        return (
          <div className="habit-manage-row bad" key={h.id}>
            <span className="habit-color" style={{ background: h.color, width: 16, height: 16 }} />
            <span className="hname">{h.name}</span>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className="badge" style={{ fontSize: 9, background: 'rgba(248,113,113,.16)', color: '#f87171' }}>ترک عادت</span>
              <span style={{ fontSize: 13, color: 'var(--muted)' }}>پاکی: <b style={{ color: 'var(--accent)' }}>{toFa(cs)} روز</b></span>
              <span className="mini-stat">بهترین: {toFa(bs)}</span>
              {msg && <span className="milestone">{msg}</span>}
            </div>
            <button className="relapse-btn" onClick={() => relapse(h.id)} title="امروز انجامش دادم و پشیمونم">😔 انجام دادم و پشیمونم</button>
            <button className="delete-habit" onClick={() => del(h.id)} title="حذف عادت"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>
          </div>
        )
      }
      const st = habitStreak(h.id), done30 = habitDone30(h.id), goal = h.weeklyGoal || 7, wg = weekDone(h.id)
      const gp = Math.min(100, Math.round(wg / goal * 100))
      return (
        <div className="habit-manage-row" key={h.id}>
          <span className="habit-color" style={{ background: h.color, width: 16, height: 16 }} />
          <span className="hname">{h.name}</span>
          <div style={{ display: 'flex', gap: 14, alignItems: 'center', flexWrap: 'wrap' }}>
            <span className="badge good-badge">عادت خوب</span>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{st > 0 ? toFa(st) + ' روز پیاپی · ' : ''}<b>{toFa(st)}</b> استریک فعلی</span>
            <span className="mini-stat">{toFa(done30)} / ۳۰ روز</span>
            <span className="mini-stat goal-label">هدف هفته: {toFa(wg)} / {toFa(goal)}</span>
          </div>
          <button className="delete-habit" onClick={() => del(h.id)} title="حذف عادت"><svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg></button>
        </div>
      )
    })

  return (
    <motion.div variants={{ animate: { transition: { staggerChildren: 0.05 } } }} initial="initial" animate="animate" exit="exit">
      <motion.div variants={fadeUp} className="page-head"><h1>عادت‌ها</h1><div className="sub">عادت‌های خوب را پیگیری کن، برای عادت‌های بد انگیزه بگیر.</div></motion.div>

      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 5v14M5 12h14"/></svg> عادت جدید</div>
        <div className="field" style={{ marginBottom: 12 }}><input className="input" style={{ maxWidth: 420 }} maxLength={50} placeholder={type === 'good' ? 'مثلاً ۳۰ دقیقه پیاده‌روی' : 'مثلاً سیگار کشیدن'} value={name} onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && add()} /></div>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 14 }}>
          <button className={'type-btn good' + (type === 'good' ? ' sel' : '')} onClick={() => setType('good')}><span>✓</span> عادت خوب</button>
          <button className={'type-btn bad' + (type === 'bad' ? ' sel' : '')} onClick={() => { setType('bad'); setDays([]) }}><span>✗</span> ترک عادت بد</button>
        </div>
        {type === 'good' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>کدام روزهای هفته انجامش بدهم؟ (خالی = همهٔ روزها)</span>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {[0, 1, 2, 3, 4, 5, 6].map((d) => (
                <button key={d} className={'day-chip' + (days.includes(d) ? ' on' : '')} onClick={() => setDays((prev) => prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d])}>{JW[d]}</button>
              ))}
            </div>
          </div>
        )}
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, color: 'var(--muted)' }}>رنگ:</span>
          <div className="color-swatches">
            {HABIT_COLORS.map((c) => <button key={c} className={'swatch' + (c === color ? ' sel' : '')} style={{ background: c }} onClick={() => setColor(c)} aria-label="انتخاب رنگ" />)}
          </div>
          <button className="btn" onClick={add}>افزودن عادت</button>
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19V5"/><path d="M9 19v-6"/><path d="M14 19V8"/><path d="M19 19v-10"/></svg> فهرست عادت‌ها</div>
        {list}
        {db.habits.some((h) => h.type !== 'bad') && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: '1px dashed rgba(255,255,255,.06)' }}>
            <div style={{ fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>برنامهٔ هفتگی:</div>
            {db.habits.filter((h) => h.type !== 'bad').map((h) => {
              const ds = (h.days && h.days.length) ? h.days : [0, 1, 2, 3, 4, 5, 6]
              return (
                <div className="sched-row" key={h.id}>
                  <span className="mini-dot" style={{ background: h.color, width: 8, height: 8 }} />
                  <span className="mini-name">{h.name}</span>
                  {[0, 1, 2, 3, 4, 5, 6].map((d) => <span key={d} className={'sch-chip' + (ds.includes(d) ? ' on' : '')}>{JW[d]}</span>)}
                </div>
              )
            })}
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}