import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'

/*
 * جدول هر روز — همان چیزی که نشانهٔ برند از آن آمده.
 * ۱۸ هفته × ۷ روز، رنگ هر خانه از نسبت عادت‌های انجام‌شدهٔ آن روز.
 * با حرکت ماوس یا لمس، روز زیر انگشت نمایش داده می‌شود.
 */

const LEVELS = 5
const DAY_LABELS = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج']
const MONTHS = ['فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور', 'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند']

const pad = (n) => String(n).padStart(2, '0')
const fa = (n) => String(n).replace(/[0-9]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])

function toISO(d) {
  return d.getFullYear() + '-' + pad(d.getMonth() + 1) + '-' + pad(d.getDate())
}

/** تبدیل تاریخ میلادی به شمسی (کپی الگوریتم استاندار) */
function g2j(gy, gm, gd) {
  const gdm = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]
  const gy2 = gm > 2 ? gy + 1 : gy
  let days = 355666 + 365 * gy + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + gdm[gm - 1]
  let jy = -1595 + 33 * Math.floor(days / 12053)
  days %= 12053
  jy += 4 * Math.floor(days / 1461)
  days %= 1461
  if (days > 365) { jy += Math.floor((days - 1) / 365); days = (days - 1) % 365 }
  let jm, jd
  if (days < 186) { jm = 1 + Math.floor(days / 31); jd = 1 + (days % 31) }
  else { jm = 7 + Math.floor((days - 186) / 30); jd = 1 + ((days - 186) % 30) }
  return { jy, jm, jd }
}

const faLong = (iso) => {
  const p = iso.split('-').map(Number)
  const j = g2j(p[0], p[1], p[2])
  return fa(j.jd) + ' ' + MONTHS[j.jm - 1]
}

/** تاریخ میلادی — تقویم هفته از شنبه شروع می‌شود */
function buildGrid(weeks) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  // آخرین شنبهٔ این هفته (یا امروز اگر شنبه است)
  const dowSat = (today.getDay() + 1) % 7 // 0 = شنبه
  const end = new Date(today)
  end.setDate(end.getDate() + (6 - dowSat))
  const start = new Date(end)
  start.setDate(start.getDate() - (weeks * 7 - 1))

  const cols = []
  for (let w = 0; w < weeks; w++) {
    const col = []
    for (let d = 0; d < 7; d++) {
      const date = new Date(start)
      date.setDate(start.getDate() + w * 7 + d)
      col.push({
        iso: toISO(date),
        day: date.getDate(),
        month: date.getMonth(),
        future: date > today,
      })
    }
    cols.push(col)
  }
  return { cols, today: toISO(today) }
}

/** دادهٔ نمونه با الگوی واقع‌گرایانه: اوایل کم، وسط خوب، آخر افت */
function sampleData(weeks, todayIso) {
  const { cols } = buildGrid(weeks)
  const total = 5
  const out = {}
  cols.flat().forEach((cell, i) => {
    if (cell.future) return
    const prog = i / (weeks * 7)
    let ratio
    if (prog < 0.12) ratio = 0.05 + Math.random() * 0.15
    else if (prog < 0.3) ratio = 0.2 + Math.random() * 0.35
    else if (prog < 0.75) ratio = 0.55 + Math.random() * 0.45
    else if (prog < 0.88) ratio = 0.5 + Math.random() * 0.5
    else ratio = 0.1 + Math.random() * 0.3
    const done = Math.round(ratio * total)
    out[cell.iso] = { done, total }
  })
  out[todayIso] = { done: 4, total }
  return out
}

const levelOf = (cell) => {
  if (!cell || !cell.total) return 0
  const r = cell.done / cell.total
  if (r >= 1) return 4
  if (r >= 0.66) return 3
  if (r >= 0.4) return 2
  if (r > 0) return 1
  return 0
}

export default function Heatmap({ weeks = 18, labels }) {
  const { cols, today } = useMemo(() => buildGrid(weeks), [weeks])
  const data = useMemo(() => sampleData(weeks, today), [weeks, today])
  const [active, setActive] = useState(null)
  const [seeded, setSeeded] = useState(false)
  const tipRef = useRef(null)
  const gridRef = useRef(null)

  // لیست روزهای آخر برای پیام «برای شروع بزن»
  useEffect(() => {
    const t = setTimeout(() => setSeeded(true), 900)
    return () => clearTimeout(t)
  }, [])

  const showTip = useCallback((cell, x, y) => {
    setActive({ ...cell, x, y })
  }, [])

  const onEnter = (cell, e) => {
    const r = gridRef.current ? gridRef.current.getBoundingClientRect() : { left: 0, top: 0, width: 400 }
    const rect = e.currentTarget.getBoundingClientRect()
    showTip(cell, rect.left + rect.width / 2 - r.left, rect.top - r.top - 10)
  }
  const onLeave = () => setActive(null)
  const onMove = (cell, e) => {
    if (!e.currentTarget.matches(':hover')) return
    const r = gridRef.current ? gridRef.current.getBoundingClientRect() : { left: 0, top: 0, width: 400 }
    const rect = e.currentTarget.getBoundingClientRect()
    showTip(cell, rect.left + rect.width / 2 - r.left, rect.top - r.top - 10)
  }

  // متن راهنما
  const L = labels || {}
  const tipText = (cell) => {
    const c = data[cell.iso]
    if (cell.future) return ''
    if (!c || c.done === 0) return (L.tooltipEmpty || '{date} — بدون ثبت').replace('{date}', faLong(cell.iso))
    if (c.done >= c.total) return (L.tooltipClean || '{date} — روز کامل').replace('{date}', faLong(cell.iso))
    return (L.tooltipPartial || '{date} — {count} عادت')
      .replace('{date}', faLong(cell.iso))
      .replace('{count}', fa(c.done))
  }

  const legend = L.legend || [
    { label: 'کم', key: 'low' }, { label: 'کم‌رنگ', key: 'mid' },
    { label: 'بیشتر', key: 'high' }, { label: 'کامل', key: 'full' },
  ]
  const legendKey = { none: 0, low: 1, mid: 2, high: 3, full: 4 }

  // برچسب ماه‌ها روی بالا
  const monthMarks = useMemo(() => {
    const out = []
    let last = -1
    cols.forEach((col, i) => {
      const m = col[0].month
      if (m !== last) { out.push({ i, m }); last = m }
    })
    return out
  }, [cols])

  return (
    <div className="hm-wrap">
      <div className="hm-months" style={{ gridTemplateColumns: `repeat(${cols.length}, var(--hm-cell))` }}>
        {monthMarks.map((m) => (
          <span key={m.i} style={{ gridColumnStart: m.i + 1 }}>{MONTHS[g2j(new Date().getFullYear(), m.m + 1, 15).jm - 1]}</span>
        ))}
      </div>

      <div className="hm-body">
        <div className="hm-days" aria-hidden="true">
          {DAY_LABELS.map((d) => <span key={d}>{d}</span>)}
        </div>

        <div className="hm-grid" ref={gridRef} style={{ gridTemplateColumns: `repeat(${cols.length}, var(--hm-cell))` }}
          role="img" aria-label="جدول فعالیت سه ماه گذشته">
          {cols.map((col, ci) => col.map((cell) => {
            const lvl = cell.future ? -1 : levelOf(data[cell.iso])
            return (
              <span
                key={cell.iso}
                className={'hm-cell lv' + (lvl < 0 ? ' future' : lvl) + (cell.iso === today ? ' today' : '')}
                onMouseEnter={(e) => onEnter(cell, e)}
                onMouseMove={(e) => onMove(cell, e)}
                onMouseLeave={onLeave}
              />
            )
          }))}

          {active && (
            <div className="hm-tip" ref={tipRef} style={{ left: active.x, top: active.y }} role="status">
              {tipText(active)}
            </div>
          )}
        </div>
      </div>

      <div className="hm-foot">
        <span className="hm-hint">{L.hint || 'برای شروع بزن'}</span>
        <div className="hm-legend">
          <span className="hm-legend-label">کمتر</span>
          {legend.map((l) => <span key={l.key} className={'hm-cell lv' + legendKey[l.key]} title={l.label} />)}
          <span className="hm-legend-label">بیشتر</span>
        </div>
      </div>
    </div>
  )
}
