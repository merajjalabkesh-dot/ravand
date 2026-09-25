import React, { useState, useEffect, useRef } from 'react'
import { toFa, g2j, jalaliToISO, jalaliMonthLen, isLeapJalali, JMONTH_NAMES } from '../lib/store'

// Jalali date picker — displays Persian (Shamsi) calendar, works with ISO value (YYYY-MM-DD).
export default function JalaliDatePicker({ value, onChange, min, max, className, placeholder }) {
  const [open, setOpen] = useState(false)
  const [jy, setJy] = useState(0)
  const [jm, setJm] = useState(1)
  const [pos, setPos] = useState({ top: 0, left: 0 })
  const ref = useRef(null)
  const btnRef = useRef(null)

  // initialize the view month from current value (or today)
  const sync = () => {
    if (value) {
      const j = g2j(+value.slice(0, 4), +value.slice(5, 7), +value.slice(8, 10))
      setJy(j.jy); setJm(j.jm)
    } else {
      const now = new Date()
      const j = g2j(now.getFullYear(), now.getMonth() + 1, now.getDate())
      setJy(j.jy); setJm(j.jm)
    }
  }
const toggleOpen = () => {
    if (!open && btnRef.current) {
      const r = btnRef.current.getBoundingClientRect()
      const width = 280
      const left = Math.max(8, Math.min(window.innerWidth - width - 8, r.left + r.width - width))
      const spaceBelow = window.innerHeight - r.bottom
      const top = spaceBelow > 330 ? r.bottom + 8 : Math.max(8, r.top - 320)
      setPos({ top, left })
    }
    setOpen(!open)
  }

  useEffect(() => { if (open) sync() }, [open, value])

  useEffect(() => {
    const on = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', on)
    return () => document.removeEventListener('mousedown', on)
  }, [])

  const daysInMonth = jalaliMonthLen(jy, jm)
  const firstDay = (() => { const iso = jalaliToISO(jy, jm, 1); const d = new Date(iso + 'T00:00:00'); return d.getDay() })() // 0=Sun..6=Sat
  // In Jalali calendar week starts Saturday (شنبه)
  const gridStart = (firstDay + 1) % 7 // Saturday-based offset

  const changeMonth = (d) => {
    let njm = jm + d, njy = jy
    if (njm < 1) { njm = 12; njy-- }
    if (njm > 12) { njm = 1; njy++ }
    setJy(njy); setJm(njm)
  }
  const pick = (jd) => {
    const iso = jalaliToISO(jy, jm, jd)
    onChange(iso)
    setOpen(false)
  }

  const jToday = (() => { const now = new Date(); return g2j(now.getFullYear(), now.getMonth() + 1, now.getDate()) })()
  const valueJ = value ? g2j(+value.slice(0, 4), +value.slice(5, 7), +value.slice(8, 10)) : null

  const minJ = min ? g2j(+min.slice(0, 4), +min.slice(5, 7), +min.slice(8, 10)) : null
  const maxJ = max ? g2j(+max.slice(0, 4), +max.slice(5, 7), +max.slice(8, 10)) : null

  const isSelectable = (jd) => {
    const j = { jy, jm, jd }
    if (minJ && (j.jy < minJ.jy || (j.jy === minJ.jy && (j.jm < minJ.jm || (j.jm === minJ.jm && j.jd < minJ.jd))))) return false
    if (maxJ && (j.jy > maxJ.jy || (j.jy === maxJ.jy && (j.jm > maxJ.jm || (j.jm === maxJ.jm && j.jd > maxJ.jd))))) return false
    return true
  }

  return (
    <div className="jpicker" ref={ref}>
      <button ref={btnRef} type="button" className="jpicker-trigger" onClick={toggleOpen}>
        {valueJ ? <>{toFa(valueJ.jd)} {JMONTH_NAMES[valueJ.jm - 1]} {toFa(valueJ.jy)}</> : (placeholder || 'انتخاب تاریخ')}
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
      </button>
      {open && (
        <div className="jpicker-pop" style={{ top: pos.top, left: pos.left }}>
          <div className="jpicker-head">
            <button type="button" className="jpicker-nav" onClick={() => changeMonth(-1)} aria-label="ماه قبل"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg></button>
            <div className="jpicker-title">{JMONTH_NAMES[jm - 1]} {toFa(jy)}</div>
            <button type="button" className="jpicker-nav" onClick={() => changeMonth(1)} aria-label="ماه بعد"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg></button>
          </div>
          <div className="jpicker-grid">
            {['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'].map((d, i) => <div className="jpicker-dow" key={i}>{d}</div>)}
            {Array.from({ length: gridStart }).map((_, i) => <div className="jpicker-empty" key={'e' + i} />)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const jd = i + 1
              const isToday = jy === jToday.jy && jm === jToday.jm && jd === jToday.jd
              const isSel = valueJ && jy === valueJ.jy && jm === valueJ.jm && jd === valueJ.jd
              const disable = !isSelectable(jd)
              return (
                <button type="button" key={jd} className={'jpicker-day' + (isToday ? ' today' : '') + (isSel ? ' sel' : '') + (disable ? ' disabled' : '')}
                  onClick={() => !disable && pick(jd)}>{toFa(jd)}</button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}