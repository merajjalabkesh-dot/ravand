import React from 'react'
import { motion } from 'framer-motion'
import SleepCycle from '../components/SleepCycle'
import { useApp, toFa, todayISO, isoAddDays, fmtMin, minOf, faDate } from '../lib/store'
import { useI18n } from '../lib/i18n'

const fadeUp = { initial: { opacity: 0, y: 18 }, animate: { opacity: 1, y: 0 }, exit: { opacity: 0, y: 10 }, transition: { duration: .35, ease: [0.22, 1, 0.36, 1] } }

export default function Wake() {
  const { db, mutate, toast } = useApp()
  const { t } = useI18n()
  const s = db.settings

  const setTime = (key, v) => { mutate((d) => { d.settings[key] = v }); toast(t('wake.toastSaved')) }
  const startPlan = () => { mutate((d) => { d.settings.planStart = todayISO() }); toast(t('wake.toastPlanStarted')) }
  const stopPlan = () => { mutate((d) => { d.settings.planStart = null }); toast(t('wake.toastPlanStopped')) }

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
      <motion.div variants={fadeUp} className="page-head"><h1>{t('wake.titleWake')}<span className="page-title-sep">{t('wake.titleSeparator')}</span>{t('wake.titleSleepCycle')}</h1><div className="sub">{t('wake.pageSubtitle')}</div></motion.div>

      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title">{t('wake.currentTimeTitle')}</div>
        <div className="setting-row">
          <div className="setting-title"><b>{t('wake.currentWakeQuestion')}</b><span>{t('wake.currentWakeHint')}</span></div>
          <input className="input" type="time" value={s.curWake || s.wakeGoal} style={{ width: 'auto' }} onChange={(e) => setTime('curWake', e.target.value)} />
        </div>
        <div className="setting-row">
          <div className="setting-title"><b>{t('wake.currentSleepQuestion')}</b><span>{t('wake.currentSleepHint')}</span></div>
          <input className="input" type="time" value={s.curSleep || s.sleepGoal} style={{ width: 'auto' }} onChange={(e) => setTime('curSleep', e.target.value)} />
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title">{t('wake.idealTimeTitle')}</div>
        <div className="setting-row">
          <div className="setting-title"><b>{t('wake.idealWakeQuestion')}</b><span>{t('wake.idealWakeHint')}</span></div>
          <input className="input" type="time" value={s.wakeGoal} style={{ width: 'auto' }} onChange={(e) => setTime('wakeGoal', e.target.value)} />
        </div>
        <div className="setting-row">
          <div className="setting-title"><b>{t('wake.idealSleepQuestion')}</b><span>{t('wake.idealSleepHint')}</span></div>
          <input className="input" type="time" value={s.sleepGoal} style={{ width: 'auto' }} onChange={(e) => setTime('sleepGoal', e.target.value)} />
        </div>
      </motion.div>

      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title">{t('wake.fiveMinutePlan')}</div>
        {s.planStart ? (
          <>
            <div className="setting-row">
              <div className="setting-title"><b>{t('wake.planActiveDay', { day: toFa(planDays + 1) })}</b><span>{t('wake.planActiveHint')}</span></div>
              <button className="btn ghost danger-ghost" onClick={stopPlan}>{t('wake.stopPlan')}</button>
            </div>
            <div className="kpis" style={{ margin: '8px 0 4px' }}>
              <div className="kpi"><div className="n" style={{ color: 'var(--accent-2)' }}>{fmtMin(curPlanWake)}</div><div className="l">{t('wake.todaysWake')}</div></div>
              <div className="kpi"><div className="n" style={{ color: 'var(--accent)' }}>{fmtMin(curPlanSleep)}</div><div className="l">{t('wake.tonightsSleep')}</div></div>
              <div className="kpi"><div className="n">{toFa(remainW)}</div><div className="l">{t('wake.daysToWakeGoal')}</div></div>
              <div className="kpi"><div className="n">{toFa(remainS)}</div><div className="l">{t('wake.daysToSleepGoal')}</div></div>
            </div>
            <div className="goal-wrap" style={{ marginTop: 10 }}>
              <span className="goal-label" style={{ minWidth: 70 }}>{t('wake.wakeGoalBarLabel')}</span>
              <div className="goal-bar"><div className="goal-fill" style={{ width: pctDoneW + '%' }} /></div>
              <span className="goal-label">{fmtMin(curPlanWake)} ← {fmtMin(goalW)}</span>
            </div>
            <div className="goal-wrap">
              <span className="goal-label" style={{ minWidth: 70 }}>{t('wake.sleepGoalBarLabel')}</span>
              <div className="goal-bar"><div className="goal-fill" style={{ width: pctDoneS + '%' }} /></div>
              <span className="goal-label">{fmtMin(curPlanSleep)} ← {fmtMin(goalS)}</span>
            </div>
          </>
        ) : (
          <div className="setting-row">
            <div className="setting-title"><b>{t('wake.startPlanTitle')}</b><span>{needW + needS > 0 ? t('wake.planEstimate', { days: toFa(Math.max(needW, needS)) }) : t('wake.goalReached')}</span></div>
            <button className="btn ghost" onClick={startPlan}>{t('wake.startPlan')}</button>
          </div>
        )}
      </motion.div>

      <SleepCycle />

      <motion.div variants={fadeUp} className="glass">
        <div className="glass-title">{t('wake.lastSevenDays')}</div>
        {histDays.map((iso) => {
          const w = db.days[iso] && db.days[iso].wake
          const sl = db.days[iso] && db.days[iso].sleep
          return (
            <div className="mini-row" key={iso}>
              <span className="mini-name" style={{ flex: '0 0 auto', minWidth: 120 }}>{faDate(iso, false)}</span>
              <span className="mini-stat">{t('wake.historyWakeIcon')} {w ? fmtMin(minOf(w)) : '—'}</span>
              <span className="mini-stat">{t('wake.historySleepIcon')} {sl ? fmtMin(minOf(sl)) : '—'}</span>
            </div>
          )
        })}
      </motion.div>
    </motion.div>
  )
}