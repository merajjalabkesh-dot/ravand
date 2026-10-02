import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react'

/*
 * جدول هر روز — همان چیزی که نشانهٔ برند از آن آمده.
 * هفته × ۷ روز (شنبه تا جمعه)، رنگ هر خانه از نسبت عادت‌های انجام‌شدهٔ آن روز.
 * با بردن موس یا لمس، روز زیر انگشت نمایش داده می‌شود و با کلیک،
 * جزئیات کامل همان روز باز می‌شود: عادت‌ها، کارها، حس و حال و خواب.
 */

const DAY_LABELS = ['شنبه', 'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'پنجشنبه', 'جمعه']
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

/* ------------------------------------------------------------------ */
/*  آدم فرضی: سارا                                                     */
/* ------------------------------------------------------------------ */
/*  یک زندگی واقع‌گرایانه می‌سازیم — اوایل شلوغ و نامنظم، بعد منظم‌تر،
    آخر دوباره شلوغ. هر روز کارها، عادت‌ها، حس و حال و خواب خودش دارد. */

const HABITS = [
  { name: 'صبح زود بیدار شدن', color: '#f5a623' },
  { name: 'دو liter آب', color: '#38bdf8' },
  { name: 'پیاده‌روی ۳۰ دقیقه', color: '#43e8a8' },
  { name: 'کتاب خواندن', color: '#a78bfa' },
  { name: 'بدون گوشی تا ناهار', color: '#fb923c' },
]

const TASK_POOL = [
  'خرید مواد غذایی', 'جواب به ایمیل‌های کاری', 'تمرین ریاضی', 'تماس با مامان',
  'آماده کردن ارائه', 'ورزش باشگاه', 'نوشتن گزارش', 'خرید کتاب دست‌دوم',
  'مرتب کردن اتاق', 'برنامه‌ریزی فردا', 'تمدید اینترنت', 'دیدار با دوستان',
]

const MOODS = [
  { v: 1, word: 'خسته', hex: '#f87171' },
  { v: 2, word: 'بی‌حوصله', hex: '#fb923c' },
  { v: 3, word: 'معمولی', hex: '#fbbf24' },
  { v: 4, word: 'خوب', hex: '#4ade80' },
  { v: 5, word: 'عالی', hex: '#38bdf8' },
]

const JOURNAL_LINES = [
  'صبح زود بیدار شدم و قبل از همه کارهایم را نوشتم.',
  'روز شلوغی بود، ولی هر چهز دقیقه را هم قاطی نکردم.',
  'بعدازظهر خسته شدم و استراحت کوتاهی زدم.',
  'یک کار کوچک که مدت‌ها عقب انداخته بودم را تمام کردم.',
  'هوا خوب بود و پیاده‌روی حالم را بهتر کرد.',
  'امروز کمتر حرف زدم ولی بیشتر فکر کردم.',
  'شب فیلم دیدم و زود خوابیدم.',
]

/* شروع و پایان هر فصل (نسبی) — اول ماه نامنظم، میانه منظم، آخر دوباره شلوغ */
function buildStory(weeks) {
  const { cols } = buildGrid(weeks)
  const total = weeks * 7
  const out = {}
  cols.flat().forEach((cell, i) => {
    if (cell.future) return
    const prog = i / total
    let density
    if (prog < 0.1) density = 0.25
    else if (prog < 0.25) density = 0.55
    else if (prog < 0.5) density = 0.85
    else if (prog < 0.72) density = 0.95
    else if (prog < 0.86) density = 0.6
    else density = 0.35

    // تعداد کارهای روز
    const nTasks = density > 0.8 ? 4 : density > 0.55 ? 3 : density > 0.3 ? 2 : (Math.random() < 0.7 ? 1 : 0)
    const tasks = []
    for (let k = 0; k < nTasks; k++) {
      const seed = (i * 7 + k * 13) % TASK_POOL.length
      tasks.push({ text: TASK_POOL[seed], done: Math.random() < density })
    }

    // عادت‌های انجام‌شده
    const doneCount = Math.round(density * HABITS.length + (Math.random() - 0.5) * 0.8)
    const habits = HABITS.map((h, hi) => ({
      ...h,
      done: ((i * 5 + hi * 11) % 10) / 10 < density,
    }))
    const habitsDone = habits.filter((h) => h.done).length

    // حس و حال، خواب و بیداری
    const mood = Math.max(1, Math.min(5, Math.round(1 + density * 3.4 + (Math.random() - 0.5))))
    const wake = 6 * 60 + Math.round(60 + (1 - density) * 90 + Math.random() * 40)
    const sleep = (21 * 60 + Math.round(density * 120 + Math.random() * 50)) % 1440

    out[cell.iso] = {
      done: habitsDone,
      total: HABITS.length,
      tasks,
      habits,
      tasksDone: tasks.filter((t) => t.done).length,
      mood,
      wake,
      sleep,
      journal: tasks.length > 0 && ((i * 3) % 5 !== 0) ? JOURNAL_LINES[(i * 11) % JOURNAL_LINES.length] : '',
    }
  })
  return out
}

/** تاریخ میلادی — تقویم هفته از شنبه شروع می‌شود */
function buildGrid(weeks) {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
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
      const g = [date.getFullYear(), date.getMonth() + 1, date.getDate()]
      const j = g2j(g[0], g[1], g[2])
      col.push({
        iso: toISO(date),
        jy: j.jy,
        jm: j.jm,
        jd: j.jd,
        future: date > today,
      })
    }
    cols.push(col)
  }
  return { cols, today: toISO(today) }
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

const fmtMin = (m) => fa(String(Math.floor(m / 60) % 24).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'))

export default function Heatmap({ weeks = 20, labels }) {
  const { cols, today } = useMemo(() => buildGrid(weeks), [weeks])
  const story = useMemo(() => buildStory(weeks), [weeks])
  const [active, setActive] = useState(null)
  const [openDay, setOpenDay] = useState(null)
  const gridRef = useRef(null)
  const detailRef = useRef(null)

  useEffect(() => {
    if (!openDay) return
    const onKey = (e) => { if (e.key === 'Escape') setOpenDay(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openDay])

  // باکس که باز شد اگر پایین دید باشد، نرم اسکرول می‌شود تا دیده شود
  useEffect(() => {
    if (!openDay || !detailRef.current) return
    const el = detailRef.current
    const t = setTimeout(() => {
      const r = el.getBoundingClientRect()
      if (r.top > window.innerHeight - 120 || r.top < 0) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
    }, 60)
    return () => clearTimeout(t)
  }, [openDay])

  const showTip = useCallback((cell, x, y) => setActive({ ...cell, x, y }), [])

  const onEnter = (cell, e) => {
    const r = gridRef.current ? gridRef.current.getBoundingClientRect() : { left: 0, top: 0, width: 400 }
    const rect = e.currentTarget.getBoundingClientRect()
    showTip(cell, rect.left + rect.width / 2 - r.left, rect.top - r.top - 10)
  }
  const onMove = (cell, e) => {
    if (!e.currentTarget.matches(':hover')) return
    const r = gridRef.current ? gridRef.current.getBoundingClientRect() : { left: 0, top: 0, width: 400 }
    const rect = e.currentTarget.getBoundingClientRect()
    showTip(cell, rect.left + rect.width / 2 - r.left, rect.top - r.top - 10)
  }

  const L = labels || {}
  const tipText = (cell) => {
    const d = story[cell.iso]
    if (cell.future) return ''
    if (!d) return ''
    if (d.done === 0) return (L.tooltipEmpty || '{date} — بدون ثبت').replace('{date}', faLong(cell.iso))
    if (d.done >= d.total) return (L.tooltipClean || '{date} — روز کامل').replace('{date}', faLong(cell.iso))
    return (L.tooltipPartial || '{date} — {count} از {total} عادت')
      .replace('{date}', faLong(cell.iso))
      .replace('{count}', fa(d.done))
      .replace('{total}', fa(d.total))
  }

  const legend = L.legend || [
    { label: 'کم', key: 'low' }, { label: 'متوسط', key: 'mid' },
    { label: 'زیاد', key: 'high' }, { label: 'کامل', key: 'full' },
  ]
  const legendKey = { none: 0, low: 1, mid: 2, high: 3, full: 4 }

  /*
   * برچسب ماه — روی همان روزی می‌نشیند که اولِ ماه است، نه اولِ ستون.
   * چون ستون‌ها هفته‌ای‌اند، اولِ ماه می‌تواند وسط هفته باشد.
   * اگر دو ماه به هم نزدیک باشند، برچسب دوم حذف می‌شود تا کلمه‌ها
   * روی هم نریزند.
   */
  const detail = openDay ? story[openDay] : null
  const moodOf = (v) => MOODS[(v || 1) - 1]

  return (
    <div className="hm-wrap">
      <div className="hm-body">
        <div className="hm-days" aria-hidden="true">
          {DAY_LABELS.map((d) => <span key={d}>{d}</span>)}
        </div>

        <div className="hm-grid" ref={gridRef} style={{ gridTemplateColumns: `repeat(${cols.length}, var(--hm-cell))` }}
          role="img" aria-label="جدول فعالیت سه ماه گذشته">
          {cols.map((col) => col.map((cell) => {
            const lvl = cell.future ? -1 : levelOf(story[cell.iso])
            return (
                        <button
                            type="button"
                            key={cell.iso}
                            className={'hm-cell lv' + (lvl < 0 ? ' future' : lvl) + (cell.iso === today ? ' today' : '') + (cell.iso === openDay ? ' selected' : '')}
                            onMouseEnter={(e) => onEnter(cell, e)}
                            onMouseMove={(e) => onMove(cell, e)}
                            onMouseLeave={() => setActive(null)}
                            onFocus={(e) => onEnter(cell, e)}
                            onClick={() => !cell.future && setOpenDay(cell.iso)}
                            aria-label={faLong(cell.iso)}
                          />
            )
          }))}
        </div>

        {active && (
          <div className="hm-tip" style={{ left: active.x, top: active.y }} role="status">
            {tipText(active)}
          </div>
        )}
      </div>

      <div className="hm-foot">
        <span className="hm-hint">{L.hint || 'روی هر روز کلیک کن'}</span>
        <div className="hm-legend">
          <span className="hm-legend-label">کمتر</span>
          {legend.map((l) => <span key={l.key} className={'hm-cell lv' + legendKey[l.key]} title={l.label} />)}
          <span className="hm-legend-label">بیشتر</span>
        </div>
      </div>

      {/* ---------- جزئیات یک روز: درجا، درست زیر جدول ---------- */}
      {detail && (
        <div className="hm-detail" ref={detailRef} role="region" aria-label={'جزئیات ' + faLong(openDay)}>
          <div className="hm-detail-head">
            <div className="hm-detail-title">{faLong(openDay)}</div>
            <div className="hm-detail-sub">
              <span className="hm-chip">{fa(detail.done)} از {fa(detail.total)} عادت</span>
              {detail.tasks.length > 0 && <span className="hm-chip">{fa(detail.tasksDone)} از {fa(detail.tasks.length)} کار</span>}
              <span className="hm-chip" style={{ color: moodOf(detail.mood).hex, borderColor: moodOf(detail.mood).hex + '55' }}>
                {moodOf(detail.mood).word}
              </span>
              <span className="hm-chip">بیداری {fmtMin(detail.wake)} · خواب {fmtMin(detail.sleep)}</span>
            </div>
            <button className="hm-close" onClick={() => setOpenDay(null)} aria-label="بستن">×</button>
          </div>

          <div className="hm-detail-grid">
            <div className="hm-detail-col">
              <h4>عادت‌ها</h4>
              {detail.habits.map((h) => (
                <div className="hm-row" key={h.name}>
                  <span className="hm-box" style={{ background: h.done ? h.color : 'transparent', borderColor: h.done ? h.color : 'rgba(140,170,230,.4)' }}>
                    {h.done ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0a0f1f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg> : null}
                  </span>
                  <span className="hm-row-text">{h.name}</span>
                </div>
              ))}
            </div>

            <div className="hm-detail-col">
              <h4>کارهای آن روز</h4>
              {detail.tasks.length === 0 ? (
                <p className="hm-empty">این روز کاری ثبت نشده بود.</p>
              ) : detail.tasks.map((t) => (
                <div className="hm-row" key={t.text}>
                  <span className="hm-box" style={{ background: t.done ? '#43e8a8' : 'transparent', borderColor: t.done ? '#43e8a8' : 'rgba(140,170,230,.4)' }}>
                    {t.done ? <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#0a0f1f" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg> : null}
                  </span>
                  <span className={'hm-row-text' + (t.done ? ' done' : '')}>{t.text}</span>
                </div>
              ))}

              {detail.journal && (
                <>
                  <h4 style={{ marginTop: 16 }}>ژورنال</h4>
                  <p className="hm-journal">{detail.journal}</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
