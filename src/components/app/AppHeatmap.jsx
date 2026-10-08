import React, { useMemo, useRef, useState } from 'react'
import {
  useApp, jalaliOf, isoAddDays, todayISO, jalaliToISO, jalaliMonthLen,
  monthName, toFa, faDate, minOf, fmtMin, moodWord, MOOD_COLORS,
} from '../../lib/store'
import { useI18n } from '../../lib/i18n'

const RANGE_CLASS = { week: 'app-hm--week', month: 'app-hm--month', qtr: 'app-hm--qtr', all: 'app-hm--all' }
const DOW_KEYS = ['reports.gridDow0', 'reports.gridDow1', 'reports.gridDow2', 'reports.gridDow3', 'reports.gridDow4', 'reports.gridDow5', 'reports.gridDow6']

// شنبه = 0
const dowSatOf = (iso) => (jalaliOf(iso).jw + 1) % 7

// سطح رنگِ یک روز از روی داده‌های همان روز و فهرست عادت‌های خوب.
// تابع خالص و ماژولی است تا در memo یک‌بار برای هر سلول حساب شود، نه در
// هر رندر (هاور روی جدول مدام re-render می‌دهد و قبلاً هر بار همهٔ ~۷۳۰
// سلول دوباره سطح‌بندی می‌شدند).
function levelOf(d, goods) {
  if (!d) return 0
  const ids = new Set(Object.keys(d.habits || {}).filter((k) => d.habits[k]))
  let n = 0
  goods.forEach((g) => { if (ids.has(g.id)) n += 1 })
  const hp = goods.length ? n / goods.length : 0
  const tasks = d.tasks || []
  const tp = tasks.length ? tasks.filter((x) => x.done).length / tasks.length : 0
  const j = d.journal || {}
  const entries = (j.text ? 1 : 0) + (j.img ? 1 : 0)
  const score = hp * 3 + tp * 4 + Math.min(entries, 2) * 2.5 + (j.mood ? 1 : 0)
  if (score <= 0) return 0
  if (score <= 1) return 1
  if (score <= 3) return 2
  if (score <= 5.5) return 3
  return 4
}

/**
 * جدول heatmap (سبک گیت‌هاب) برای تب «جدول» گزارش‌ها.
 * ردیف‌ها = روزهای هفته، ستون‌ها = هفته‌ها؛ بالای هر بخش نام ماه نوشته می‌شود.
 */
export default function AppHeatmap({ range = 'week' }) {
  const { db } = useApp()
  const { t } = useI18n()
  const [sel, setSel] = useState(null)
  const [tip, setTip] = useState(null)
  const rootRef = useRef(null)

  const today = todayISO()

  /* ---------- پنجرهٔ زمانی + ساخت سلول‌ها ---------- */
  const { cells, cols, segs } = useMemo(() => {
    const { jy, jm } = jalaliOf(today)
    let start; let end

    if (range === 'week') {
      start = isoAddDays(today, -dowSatOf(today))
      end = isoAddDays(start, 6)
    } else if (range === 'month') {
      start = jalaliToISO(jy, jm, 1)
      end = jalaliToISO(jy, jm, jalaliMonthLen(jy, jm))
    } else if (range === 'qtr') {
      // فصل جاریِ تقویم جلالی: مثلاً ۱ مهر تا ۳۰ آذر
      const qm = Math.floor((jm - 1) / 3) * 3 + 1
      start = jalaliToISO(jy, qm, 1)
      end = jalaliToISO(jy, qm + 2, jalaliMonthLen(jy, qm + 2))
    } else {
      // «کل»: از اولین روز داده‌دار تا پایان ماه جاری (حداکثر ۲ سال)
      let first = null
      Object.keys(db.days || {}).forEach((iso) => {
        if (iso <= today && (!first || iso < first)) first = iso
      })
      const cap = isoAddDays(today, -730)
      if (!first || first < cap) first = cap
      const monthEnd = jalaliToISO(jy, jm, jalaliMonthLen(jy, jm))
      start = first < monthEnd ? first : monthEnd
      end = monthEnd
    }

    // تراز با شنبه/جمعه تا ردیف‌ها درست بنشینند
    const gridStart = isoAddDays(start, -dowSatOf(start))
    const gridEnd = isoAddDays(end, 6 - dowSatOf(end))

    const out = []
    for (let iso = gridStart; iso <= gridEnd; iso = isoAddDays(iso, 1)) {
      const j = jalaliOf(iso)
      out.push({
        iso,
        jy: j.jy,
        jm: j.jm,
        jd: j.jd,
        visible: iso >= start && iso <= end,
        future: iso > today,
        isToday: iso === today,
        mstart: j.jd === 1,
      })
    }

    const group = []
    for (let i = 0; i < out.length; i += 7) group.push(out.slice(i, i + 7))

    // بخش‌بندی ماه‌ها: ستونی که روز اولِ ماه داخلش است، شروعِ همان ماه است
    const segments = []
    let cur = null
    group.forEach((col, ci) => {
      const vis = col.filter((c) => c.visible)
      if (!vis.length) return
      const first = vis.find((c) => c.jd === 1) || vis[0]
      const key = `${first.jy}-${first.jm}`
      if (!cur || cur.key !== key) {
        if (cur) { cur.end = ci - 1; segments.push(cur) }
        cur = { key, jm: first.jm, start: ci }
      }
    })
    if (cur) { cur.end = group.length - 1; segments.push(cur) }

    return { cells: out, cols: group, segs: segments }
  }, [db, range, today])

  /* ---------- آمار یک روز ---------- */
  const goods = useMemo(() => db.habits.filter((h) => h.type !== 'bad'), [db])

  // سطح و درصدِ هر روز یک‌بار برای همهٔ روزها حساب می‌شود، نه در هر رندر.
  // هاور روی جدول مرتب setTip می‌کند و کل کامپوننت دوباره رندر می‌شود؛ قبلاً
  // هر بار برای ~۷۳۰ سلول دوباره سطح‌بندی انجام می‌شد.
  const { levels, pcts } = useMemo(() => {
    const lv = {}
    const pc = {}
    const days = db.days || {}
    Object.keys(days).forEach((iso) => {
      const d = days[iso]
      lv[iso] = levelOf(d, goods)
      if (!d || !goods.length) { pc[iso] = 0; return }
      const ids = new Set(Object.keys(d.habits || {}).filter((k) => d.habits[k]))
      let n = 0
      goods.forEach((g) => { if (ids.has(g.id)) n += 1 })
      pc[iso] = Math.round(n * 100 / goods.length)
    })
    return { levels: lv, pcts: pc }
  }, [db, goods])

  const pctOf = (iso) => pcts[iso] || 0
  const cellLevel = (iso) => levels[iso] || 0

  const tipSub = (iso) => {
    const d = db.days[iso]
    const bits = []
    const p = pctOf(iso)
    if (p > 0) bits.push(t('reports.dayModalHabitsStat', { pct: toFa(p) }))
    if (d && d.tasks && d.tasks.length) {
      bits.push(t('reports.dayTabTasksStat', {
        done: toFa(d.tasks.filter((x) => x.done).length),
        total: toFa(d.tasks.length),
      }))
    }
    if (d && d.journal && d.journal.mood > 0) bits.push(moodWord(d.journal.mood))
    return bits.join('  ·  ')
  }

  const showTip = (c, r, e) => {
    const root = rootRef.current
    if (!root) return
    const rr = root.getBoundingClientRect()
    const cr = e.currentTarget.getBoundingClientRect()
    const below = r < 4
    setTip({
      x: cr.left + cr.width / 2 - rr.left,
      y: below ? cr.bottom - rr.top : cr.top - rr.top,
      below,
      title: faDate(c.iso, true),
      sub: tipSub(c.iso),
    })
  }

  /* ---------- پنل اتفاقات روز ---------- */
  const selCell = sel ? cells.find((c) => c.iso === sel) : null
  const showDetail = !!(sel && selCell && selCell.visible)
  const d = showDetail ? (db.days[sel] || null) : null
  const journal = (d && d.journal) || null
  const tasks = d ? (d.tasks || []) : []
  const ids = d ? new Set(Object.keys(d.habits || {}).filter((k) => d.habits[k])) : new Set()
  const pct = showDetail ? pctOf(sel) : 0
  const hasAny = !!d && (
    db.habits.some((h) => ids.has(h.id)) ||
    tasks.length > 0 ||
    !!(journal && (journal.text || journal.good || journal.img || journal.mood > 0)) ||
    !!(d.wake || d.sleep)
  )

  const colHead = (label) => <h4>{label}</h4>

  return (
    <div ref={rootRef} className={`app-hm ${RANGE_CLASS[range] || RANGE_CLASS.week}`}>
      <div className="hm-wrap">
        <div className="hm-body">
          {/* Grid layout: col 1 = day labels (54px), col 2 = main content (flex-1) */}
          {/* Row 1: spacer (col 1) + month labels (col 2) */}
          {/* Row 2: day labels (col 1) + grid (col 2) */}
          <div className="app-hm-spacer" aria-hidden="true" />
          <div className="app-hm-months" style={{ gridTemplateColumns: `repeat(${cols.length}, var(--hm-cell))` }}>
            {segs.map((s) => (
              <div
                key={s.key}
                className="app-hm-month"
                style={{ gridColumn: `${s.start + 1} / span ${s.end - s.start + 1}` }}
              >
                {monthName(s.jm)}
              </div>
            ))}
          </div>
          <div className="hm-days">
            {DOW_KEYS.map((k) => <span key={k}>{t(k)}</span>)}
          </div>
          <div className="hm-grid" onMouseLeave={() => setTip(null)}>
            {cols.map((col) => col.map((c, r) => (
                c.visible ? (
                  <button
                    key={c.iso}
                    type="button"
                    data-iso={c.iso}
                    aria-label={faDate(c.iso, true)}
                    className={[
                      'hm-cell',
                      `lv${cellLevel(c.iso)}`,
                      c.future ? 'future' : '',
                      c.isToday ? 'today' : '',
                      c.mstart ? 'mstart' : '',
                      sel === c.iso ? 'selected' : '',
                    ].filter(Boolean).join(' ')}
                    onClick={() => setSel(sel === c.iso ? null : c.iso)}
                    onMouseEnter={(e) => showTip(c, r, e)}
                    onMouseMove={(e) => showTip(c, r, e)}
                  />
                ) : (
                  <span key={`b-${c.iso}`} className="hm-cell app-hm-blank" aria-hidden="true" />
                )
              )))}
        </div>
      </div>
    </div>

      {tip && (
        <div
          className="hm-tip"
          style={{
            left: tip.x,
            top: tip.y,
            transform: tip.below ? 'translate(-50%, 6px)' : 'translate(-50%, calc(-100% - 6px))',
          }}
        >
          <div>{tip.title}</div>
          {tip.sub ? <div className="hm-tip-sub">{tip.sub}</div> : null}
        </div>
      )}

      <div className="hm-foot">
        <span className="hm-hint">{t('reports.gridHint')}</span>
        <div className="hm-legend">
          <span className="hm-legend-label">{t('reports.gridLess')}</span>
          {[0, 1, 2, 3, 4].map((l) => <span key={l} className={`hm-cell lv${l}`} />)}
          <span className="hm-legend-label">{t('reports.gridMore')}</span>
        </div>
      </div>

      {showDetail && (
        <div className="hm-detail">
          <div className="hm-detail-head">
            <div style={{ minWidth: 0 }}>
              <div className="hm-detail-title">{faDate(sel, true)}</div>
              <div className="hm-detail-sub">
                <span className="hm-chip">{t('reports.dayModalHabitsStat', { pct: toFa(pct) })}</span>
                {tasks.length > 0 && (
                  <span className="hm-chip">
                    {t('reports.dayTabTasksStat', {
                      done: toFa(tasks.filter((x) => x.done).length),
                      total: toFa(tasks.length),
                    })}
                  </span>
                )}
                {journal && journal.mood > 0 && (
                  <span className="hm-chip" style={{ color: MOOD_COLORS[journal.mood] }}>
                    {moodWord(journal.mood)}
                  </span>
                )}
                {d && Array.isArray(d.wake) && d.wake.length > 0 && (
                  <span className="hm-chip">{t('reports.dayModalWakeStat', { time: fmtMin(minOf(d.wake)) })}</span>
                )}
                {d && Array.isArray(d.sleep) && d.sleep.length > 0 && (
                  <span className="hm-chip">{t('reports.dayModalSleepStat', { time: fmtMin(minOf(d.sleep)) })}</span>
                )}
              </div>
            </div>
            <button type="button" className="hm-close" aria-label={t('reports.close')} onClick={() => setSel(null)}>×</button>
          </div>

          {!hasAny ? (
            <div className="hm-empty">{t('reports.gridEmpty')}</div>
          ) : (
            <div className="hm-detail-grid">
              <div className="hm-detail-col">
                {colHead(t('reports.habitsSection'))}
                {db.habits.length === 0 ? (
                  <div className="hm-empty">—</div>
                ) : db.habits.map((h) => {
                  const on = ids.has(h.id)
                  const bad = h.type === 'bad'
                  return (
                    <div className="hm-row" key={h.id}>
                      <span
                        className="hm-box"
                        style={on ? { background: `${h.color}33`, borderColor: h.color } : null}
                      >
                        {on && (
                          <svg viewBox="0 0 16 16" aria-hidden="true">
                            <polyline points="3.5,8.5 6.5,11.5 12.5,5" fill="none" stroke={h.color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </span>
                      <span className={`hm-row-text${on && !bad ? ' done' : ''}`}>{h.name}</span>
                      <span className={`hm-status${on ? ' on' : ' off'}`}>
                        {bad ? (on ? t('reports.statusDoneSad') : t('reports.statusClean')) : (on ? t('reports.statusDone') : t('reports.statusNotDone'))}
                      </span>
                    </div>
                  )
                })}
              </div>

              <div className="hm-detail-col">
                {colHead(t('reports.tasksSection'))}
                {tasks.length === 0 ? (
                  <div className="hm-empty">—</div>
                ) : tasks.map((task, i) => (
                  <div className="hm-row" key={`${task.text}-${i}`}>
                    <span className="hm-box">
                      {task.done && (
                        <svg viewBox="0 0 16 16" aria-hidden="true">
                          <polyline points="3.5,8.5 6.5,11.5 12.5,5" fill="none" stroke="#43e8a8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className={`hm-row-text${task.done ? ' done' : ''}`}>{task.text}</span>
                  </div>
                ))}
              </div>

              <div className="hm-detail-col">
                {colHead(t('reports.journalSection'))}
                {journal && (journal.text || journal.good || journal.img) ? (
                  <div className="hm-journal">
                    {journal.mood > 0 && (
                      <div className="hm-journal-mood">
                        <span>{t('reports.feelingLabel')}</span>
                        <b style={{ color: MOOD_COLORS[journal.mood] }}>{moodWord(journal.mood)}</b>
                      </div>
                    )}
                    {journal.text ? <p className="hm-journal-text">{journal.text}</p> : null}
                    {journal.good ? (
                      <>
                        <div className="hm-journal-label">{t('journal.goodThingsLabel')}</div>
                        <p className="hm-journal-text">{journal.good}</p>
                      </>
                    ) : null}
                    {journal.img && (
                      <div className="journal-img-area">
                        <img src={journal.img} alt={t('journal.photoAlt')} />
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="hm-empty">{t('reports.journalNoNote')}</div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
