import React from 'react'
import { motion } from 'framer-motion'
import SleepCycle from '../components/SleepCycle'
import { useApp, toFa, todayISO, isoAddDays, fmtMin, minOf, faDate } from '../lib/store'

const fadeUp = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 10 }, transition: { duration: .35, ease: [0.22, 1, 0.36, 1] } }

export default function Wake() {
  const { db, mutate, toast } = useApp()
  const s = db.settings

  const setTime = (key, v) => { mutate((d) => { d.settings[key] = v }); toast('ذخیره شد') }
  const startPlan = () => { mutate((d) => { d.settings.planStart = todayISO() }); toast('پلن ۵ دقیقه‌ای از امروز شروع شد 🌱') }
  const stopPlan = () => { mutate((d) => { d.settings.planStart = null }); toast('پلن متوقف شد') }

  // helpers for plan
  const planDays = (() => {
    if (!s.planStart) return 0
    const d0 = new Date(s.planStart.split('-').map(Number)), d1 = new Date()
    return Math.max(0, Math.floor((d1 - d0) / 86400000))
  })()
  const sleepNorm = (m) => (m < 12 * 60 ? m + 1440 : m)

  /* baseline از ساعت فعلی (یا ثبت‌شده) */
  const baseW = minOf(s.curWake || s.wakeGoal)
  const baseS = sleepNorm(minOf(s.curSleep || s.sleepGoal))
  const goalW = minOf(s.wakeGoal)
  const goalS = sleepNorm(minOf(s.sleepGoal))
  const diffW = baseW - goalW          /* منفی = باید زودتر بیدار شود */
  const diffS = baseS - goalS          /* منفی = باید زودتر بخوابد */

  /* هر روز یک گام ۵ دقیقه‌ای به سمت هدف */
  const stepDaysW = Math.min(planDays, Math.ceil(Math.abs(diffW) / 5))
  const stepDaysS = Math.min(planDays, Math.ceil(Math.abs(diffS) / 5))
  const movedW = stepDaysW * 5 * (diffW > 0 ? -1 : 1)
  const movedS = stepDaysS * 5 * (diffS > 0 ? -1 : 1)
  const curPlanWake = (((baseW + movedW) % 1440) + 1440) % 1440
  const curPlanSleep = (((baseS + movedS) % 1440) + 1440) % 1440

  const needW = Math.ceil(Math.abs(diffW) / 5)
  const needS = Math.ceil(Math.abs(diffS) / 5)
  const remainW = Math.max(0, needW - planDays)
  const remainS = Math.max(0, needS - planDays)
  const pctDoneW = needW ? Math.min(100, Math.round(planDays / needW * 100)) : 100
  const pctDoneS = needS ? Math.min(100, Math.round(planDays / needS * 100)) : 100
  const histDays = (() => { const a = []; for (let i = 6; i >= 0; i--) a.push(isoAddDays(todayISO(), -i)); return a })()
  const wokeToday = !!(db.days[todayISO()] && db.days[todayISO()].wake)

  return (
    <motion.div variants={{ animate: { transition: { staggerChildren: 0.05 } } }} initial="initial" animate="animate" exit="exit">
      <motion.div variants={fadeUp} className="page-head"><h1>سحرخیزی <span className="page-title-sep">|</span> سیکل خواب</h1><div className="sub">ساعت فعلی‌ات را تنظیم کن؛ با قانون ۵ دقیقه‌ای به ساعت ایده‌آل می‌رسی.</div></motion.div>

      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title">ساعت فعلی تو</div>
        <div className="setting-row">
          <div className="setting-title"><b>الان معمولاً ساعت چند بیدار می‌شوی؟</b><span>مبنای محاسبهٔ قانون ۵ دقیقه‌ای</span></div>
          <input className="input" type="time" value={s.curWake || s.wakeGoal} style={{ width: 'auto' }} onChange={(e) => setTime('curWake', e.target.value)} />
        </div>
        <div className="setting-row">
          <div className="setting-title"><b>الان معمولاً ساعت چند می‌خوابی؟</b><span>مبنای محاسبهٔ قانون ۵ دقیقه‌ای</span></div>
          <input className="input" type="time" value={s.curSleep || s.sleepGoal} style={{ width: 'auto' }} onChange={(e) => setTime('curSleep', e.target.value)} />
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title">ساعت ایده‌آل</div>
        <div className="setting-row">
          <div className="setting-title"><b>دوست داری صبح‌ها ساعت چند بیدار شوی؟</b><span>هدف نهاییِ بیداری</span></div>
          <input className="input" type="time" value={s.wakeGoal} style={{ width: 'auto' }} onChange={(e) => setTime('wakeGoal', e.target.value)} />
        </div>
        <div className="setting-row">
          <div className="setting-title"><b>دوست داری شب‌ها ساعت چند بخوابی؟</b><span>هدف نهاییِ خواب</span></div>
          <input className="input" type="time" value={s.sleepGoal} style={{ width: 'auto' }} onChange={(e) => setTime('sleepGoal', e.target.value)} />
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title">پلن ۵ دقیقه‌ای</div>
        {s.planStart ? (
          <>
            <div className="setting-row">
              <div className="setting-title"><b>پلن فعال است — روز {toFa(planDays + 1)}</b><span>هر روز ۵ دقیقه زودتر می‌خوابی و بیدار می‌شوی</span></div>
              <button className="btn ghost danger-ghost" onClick={stopPlan}>توقف پلن</button>
            </div>
            <div className="kpis" style={{ margin: '8px 0 4px' }}>
              <div className="kpi"><div className="n" style={{ color: 'var(--accent-2)' }}>{fmtMin(curPlanWake)}</div><div className="l">بیداریِ امروز</div></div>
              <div className="kpi"><div className="n" style={{ color: 'var(--accent)' }}>{fmtMin(curPlanSleep)}</div><div className="l">خوابِ امشب</div></div>
              <div className="kpi"><div className="n">{toFa(remainW)}</div><div className="l">روز تا هدفِ بیداری</div></div>
              <div className="kpi"><div className="n">{toFa(remainS)}</div><div className="l">روز تا هدفِ خواب</div></div>
            </div>
            <div className="goal-wrap" style={{ marginTop: 10 }}>
              <span className="goal-label" style={{ minWidth: 70 }}>بیداری</span>
              <div className="goal-bar"><div className="goal-fill" style={{ width: pctDoneW + '%' }} /></div>
              <span className="goal-label">{fmtMin(curPlanWake)} ← {fmtMin(goalW)}</span>
            </div>
            <div className="goal-wrap">
              <span className="goal-label" style={{ minWidth: 70 }}>خواب</span>
              <div className="goal-bar"><div className="goal-fill" style={{ width: pctDoneS + '%' }} /></div>
              <span className="goal-label">{fmtMin(curPlanSleep)} ← {fmtMin(goalS)}</span>
            </div>
          </>
        ) : (
          <div className="setting-row">
            <div className="setting-title"><b>شروع پلن ۵ دقیقه‌ای</b><span>{needW + needS > 0 ? 'حدود ' + toFa(Math.max(needW, needS)) + ' روز تا رسیدن به ساعت ایده‌آلت' : 'ساعت فعلی‌ات با هدف فاصلهٔ کمی دارد — کار تمام است!'}</span></div>
            <button className="btn ghost" onClick={startPlan}>شروع پلن</button>
          </div>
        )}
      </motion.div>

      <SleepCycle />

      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title">هفت روزِ اخیر</div>
        {histDays.map((iso) => {
          const w = db.days[iso] && db.days[iso].wake
          const sl = db.days[iso] && db.days[iso].sleep
          return (
            <div className="mini-row" key={iso}>
              <span className="mini-name" style={{ flex: '0 0 auto', minWidth: 120 }}>{faDate(iso, false)}</span>
              <span className="mini-stat">🌅 {w ? fmtMin(minOf(w)) : '—'}</span>
              <span className="mini-stat">🌙 {sl ? fmtMin(minOf(sl)) : '—'}</span>
            </div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}