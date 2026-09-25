import React, { useState } from 'react'
import { toFa, fmtMin } from '../lib/store'
import { useI18n } from '../lib/i18n'

const CYCLE = 90
const LATENCY = 15

// ASCII HH:MM for <input type="time"> (browser wants Latin digits, "06:45")
const enNum = (m) => {
  const mm = ((m % 1440) + 1440) % 1440
  const h = String(Math.floor(mm / 60)).padStart(2, '0')
  const mi = String(mm % 60).padStart(2, '0')
  return h + ':' + mi
}

export default function SleepCycle() {
  const { t } = useI18n()
  const [bed, setBed] = useState('23:00')        // "من ساعت X می‌خوابم"
  const [wake, setWake] = useState('06:30')      // "می‌خواهم ساعت Y بیدار شوم"

  const toMin = (t) => { const p = String(t || '').split(':'); return p.length === 2 ? +p[0] * 60 + +p[1] : 0 }
  const norm = (m) => ((m % 1440) + 1440) % 1440

  // ---- scenario A: from bedtime → suggests wake-up times (end of each cycle) ----
  const bedMin = toMin(bed)
  const wakeOpts = [4, 5, 6, 7].map((n) => ({ n, min: norm(bedMin + LATENCY + n * CYCLE) }))
  const bestWake = wakeOpts[1] // 5 cycles ≈ 7.75h — closest to ideal adult sleep

  // ---- scenario B: from desired wake time → suggests bedtimes ----
  const wakeMin = toMin(wake)
  const bedOpts = [4, 5, 6, 7].map((n) => ({ n, min: norm(wakeMin - LATENCY - n * CYCLE) }))
  const bestBed = bedOpts[1] // 5 cycles — same recommendation as scenario A

  return (
    <div className="glass sleep-cycle">
      <div className="glass-title"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg> {t('sleep.title')}</div>
      <p className="glass-hint" style={{ marginTop: -6, marginBottom: 14 }}>{t('sleep.hint')}</p>

      <div className="sleep-cycle-grid">
        {/* A: bedtime → wake times */}
        <div className="sleep-cycle-card">
          <div className="sleep-cycle-label">{t('sleep.wakeTimeLabel')}</div>
          <input className="input" type="time" value={bed} style={{ width: 'auto' }} onChange={(e) => setBed(e.target.value)} />
          <div className="sleep-cycle-label" style={{ marginTop: 6 }}>{t('sleep.sleepThenWake')}</div>
          <div className="sleep-cycle-opts">
            {wakeOpts.map((o) => (
              <button key={o.n} className={'sleep-opt' + (o.n === bestWake.n ? ' best' : '')} onClick={() => setWake(enNum(o.min))}>
                <span className="sleep-opt-time">{fmtMin(o.min)}</span>
                <span className="sleep-opt-info">{t('sleep.optInfoWake', { cycles: toFa(o.n), minutes: toFa(o.n * 90 + 15) })}</span>
                {o.n === bestWake.n && <span className="sleep-opt-tag">{t('sleep.recommendedTag')}</span>}
              </button>
            ))}
          </div>
          <p className="glass-hint" style={{ marginTop: 10 }}>{t('sleep.balanced', { cycles: toFa(5), hours: toFa(7), minutes: toFa(45) })}<br />{t('sleep.balancedNote')}</p>
        </div>

        {/* B: desired wake → bedtimes */}
        <div className="sleep-cycle-card">
          <div className="sleep-cycle-label">{t('sleep.bedTimeLabel')}</div>
          <input className="input" type="time" value={wake} style={{ width: 'auto' }} onChange={(e) => setWake(e.target.value)} />
          <div className="sleep-cycle-label" style={{ marginTop: 6 }}>{t('sleep.bedThenWake')}</div>
          <div className="sleep-cycle-opts">
            {bedOpts.map((o) => (
              <button key={o.n} className={'sleep-opt' + (o.n === bestBed.n ? ' best' : '')} onClick={() => setBed(enNum(o.min))}>
                <span className="sleep-opt-time">{fmtMin(o.min)}</span>
                <span className="sleep-opt-info">{t('sleep.optInfoBed', { cycles: toFa(o.n), minutes: toFa(o.n * 90) })}</span>
                {o.n === bestBed.n && <span className="sleep-opt-tag">{t('sleep.recommendedTagReverse')}</span>}
              </button>
            ))}
          </div>
          <p className="glass-hint" style={{ marginTop: 10 }}>{t('sleep.balancedReverse', { cycles: toFa(5), hours: toFa(7), minutes: toFa(45) })}<br />{t('sleep.balancedNoteReverse', { latency: toFa(15) })}</p>
        </div>
      </div>
    </div>
  )
}