import React, { useState, useMemo } from 'react'
import { useApp, toFa, isoAddDays, jalaliOf, jalaliMonthLen, jalaliToISO, j2g, num } from '../../lib/store'
import { useI18n } from '../../lib/i18n'

/**
 * Monthly/Quarterly Pricing Table Component
 * Displays a calendar-like grid showing habit completion for 1 month or 3 months
 * Click on any day to see details (tasks, habits, journal, sleep)
 */
export default function PricingTable({ mode = 'month' }) {
  // mode: 'month' (30 days), 'qtr' (90 days), 'week' (7 days)
  const { db, todayISO, faDate, num } = useApp()
  const { t } = useI18n()
  
  const [selectedDay, setSelectedDay] = useState(null)
  const [viewMode, setViewMode] = useState(mode) // 'month' | 'qtr' | 'week'

  // Calculate days to show
  const daysCount = useMemo(() => {
    if (viewMode === 'week') return 7
    if (viewMode === 'month') return 30
    return 90 // qtr
  }, [viewMode])

  // Generate array of ISO dates (most recent first for display)
  const days = useMemo(() => {
    const arr = []
    const today = todayISO()
    for (let i = daysCount - 1; i >= 0; i--) {
      arr.push(isoAddDays(today, -i))
    }
    return arr
  }, [daysCount])

  // Get habit completion for a day
  const dayData = (iso) => {
    const d = db.days[iso]
    if (!d) return { habits: {}, tasks: [], journal: null, sleep: null, wake: null }
    return d
  }

  // Check if a habit was done on a day
  const isHabitDone = (iso, habitId) => {
    const d = db.days[iso]
    return d && d.habits && d.habits[habitId]
  }

  // Get all good habits (non-bad)
  const goodHabits = useMemo(() => db.habits.filter(h => h.type !== 'bad'), [db.habits])
  const badHabits = useMemo(() => db.habits.filter(h => h.type === 'bad'), [db.habits])

  // Calculate completion percentage for a day
  const dayCompletion = (iso) => {
    const d = dayData(iso)
    const goods = goodHabits
    if (!goods.length) return 0
    let done = 0
    goods.forEach(h => { if (d.habits[h.id]) done++ })
    return Math.round((done / goods.length) * 100)
  }

  // Get Jalali date parts for a day
  const jalaliParts = (iso) => jalaliOf(iso)

  // Group days by month for month/qtr view
  const monthsGroups = useMemo(() => {
    const groups = {}
    days.forEach(iso => {
      const j = jalaliParts(iso)
      const key = `${j.jy}-${j.jm}`
      if (!groups[key]) groups[key] = { jy: j.jy, jm: j.jm, days: [] }
      groups[key].days.push(iso)
    })
    return Object.values(groups).sort((a, b) => a.jy !== b.jy ? a.jy - b.jy : a.jm - b.jm)
  }, [days])

  // Month names
  const monthNames = useMemo(() => [
    t('date.month01'), t('date.month02'), t('date.month03'), t('date.month04'),
    t('date.month05'), t('date.month06'), t('date.month07'), t('date.month08'),
    t('date.month09'), t('date.month10'), t('date.month11'), t('date.month12'),
  ], [t])

  // Day of week names (Sat=0)
  const dowNames = useMemo(() => [
    t('date.dowSat'), t('date.dowSun'), t('date.dowMon'), t('date.dowTue'),
    t('date.dowWed'), t('date.dowThu'), t('date.dowFri'),
  ], [t])

  const handleDayClick = (iso, e) => {
    e.stopPropagation()
    setSelectedDay(iso)
  }

  const getDayCellClass = (iso, isCurrentMonth = true) => {
    const pct = dayCompletion(iso)
    const isToday = iso === todayISO()
    const isSelected = selectedDay === iso
    const isFuture = iso > todayISO()
    const d = dayData(iso)
    const hasData = d && (Object.keys(d.habits || {}).length > 0 || (d.tasks && d.tasks.length > 0) || (d.journal && (d.journal.text || d.journal.mood)))
    
    let cls = 'pricing-day'
    if (!isCurrentMonth) cls += ' empty'
    if (isToday) cls += ' today'
    if (isSelected) cls += ' selected'
    if (isFuture) cls += ' future'
    if (hasData) cls += ' has-data'
    if (pct === 100) cls += ' full'
    else if (pct >= 75) cls += ' high'
    else if (pct >= 50) cls += ' mid'
    else if (pct > 0) cls += ' low'
    return cls
  }

  const renderDayCell = (iso, isCurrentMonth = true) => {
    const j = jalaliParts(iso)
    const pct = dayCompletion(iso)
    const d = dayData(iso)
    const isToday = iso === todayISO()
    const isSelected = selectedDay === iso
    const isFuture = iso > todayISO()
    
    // Badge for habit type on this day
    const habitBadges = []
    goodHabits.forEach(h => {
      if (d.habits[h.id]) {
        habitBadges.push(<span key={h.id} className="habit-badge good" style={{ background: h.color }} title={h.name} />)
      }
    })
    badHabits.forEach(h => {
      if (d.habits[h.id]) {
        habitBadges.push(<span key={h.id} className="habit-badge bad" title={t('reports.statusDoneSad')} />)
      }
    })

    return (
      <button
        key={iso}
        className={getDayCellClass(iso, isCurrentMonth)}
        onClick={(e) => handleDayClick(iso, e)}
        disabled={isFuture}
        title={isCurrentMonth ? faDate(iso, true) : ''}
      >
        <span className="day-number">{toFa(j.jd)}</span>
        {habitBadges.length > 0 && (
          <div className="habit-badges">{habitBadges.slice(0, 3)}</div>
        )}
        {isToday && <span className="today-ring" />}
        {isSelected && <span className="selected-ring" />}
        {pct === 100 && <span className="full-indicator" />}
      </button>
    )
  }

  // Week view - simple horizontal row
  if (viewMode === 'week') {
    return (
      <div className="pricing-table week-view">
        <div className="pricing-header">
          <div className="pricing-title">{t('reports.pricingTableTitle')}</div>
          <div className="pricing-controls">
            <button className={viewMode === 'week' ? 'active' : ''} onClick={() => setViewMode('week')}>{t('reports.rangeWeek')}</button>
            <button className={viewMode === 'month' ? 'active' : ''} onClick={() => setViewMode('month')}>{t('reports.rangeMonth')}</button>
            <button className={viewMode === 'qtr' ? 'active' : ''} onClick={() => setViewMode('qtr')}>{t('reports.rangeQtr')}</button>
          </div>
        </div>
        <div className="pricing-grid week-grid">
          {dowNames.map((d, i) => (
            <div key={i} className="dow-label">{d}</div>
          ))}
          {days.map((iso, i) => renderDayCell(iso, true))}
        </div>
        {selectedDay && <DayDetailModal iso={selectedDay} onClose={() => setSelectedDay(null)} />}
      </div>
    )
  }

  // Month/Qtr view - grouped by month
  return (
    <div className="pricing-table month-view">
      <div className="pricing-header">
        <div className="pricing-title">{t('reports.pricingTableTitle')}</div>
        <div className="pricing-controls">
          <button className={viewMode === 'week' ? 'active' : ''} onClick={() => setViewMode('week')}>{t('reports.rangeWeek')}</button>
          <button className={viewMode === 'month' ? 'active' : ''} onClick={() => setViewMode('month')}>{t('reports.rangeMonth')}</button>
          <button className={viewMode === 'qtr' ? 'active' : ''} onClick={() => setViewMode('qtr')}>{t('reports.rangeQtr')}</button>
        </div>
      </div>
      
      <div className="pricing-legend">
        <span className="legend-item"><span className="legend-color low" />{t('reports.legendLow')}</span>
        <span className="legend-item"><span className="legend-color mid" />{t('reports.legendMid')}</span>
        <span className="legend-item"><span className="legend-color high" />{t('reports.legendHigh')}</span>
        <span className="legend-item"><span className="legend-color full" />{t('reports.legendFull')}</span>
        <span className="legend-item"><span className="legend-color good" />{t('reports.legendGoodHabit')}</span>
        <span className="legend-item"><span className="legend-color bad" />{t('reports.legendBadHabit')}</span>
      </div>

      <div className="pricing-months">
        {monthsGroups.map((month, mi) => (
          <div key={`${month.jy}-${month.jm}`} className="pricing-month">
            <div className="month-header">
              <span className="month-name">{monthNames[month.jm - 1]} {toFa(month.jy)}</span>
            </div>
            <div className="month-grid">
              {dowNames.map((d, i) => (
                <div key={i} className="dow-label">{d}</div>
              ))}
              {/* Calculate first day offset */}
              {(() => {
                const firstIso = month.days[0]
                const firstJ = jalaliParts(firstIso)
                const firstDayOfMonth = jalaliToISO(firstJ.jy, firstJ.jm, 1)
                const firstDow = new Date(firstDayOfMonth + 'T00:00:00').getDay() // 0=Sun
                const gridStart = (firstDow + 1) % 7 // Saturday-based
                const cells = []
                // Empty cells before month start
                for (let i = 0; i < gridStart; i++) {
                  cells.push(<div key={`empty-${i}`} className="pricing-day empty" />)
                }
                // Actual days
                month.days.forEach(iso => {
                  cells.push(renderDayCell(iso, true))
                })
                return cells
              })()}
            </div>
          </div>
        ))}
      </div>

      {selectedDay && <DayDetailModal iso={selectedDay} onClose={() => setSelectedDay(null)} />}
    </div>
  )
}

/**
 * Modal showing day details when a day is clicked
 */
function DayDetailModal({ iso, onClose }) {
  const { db, toFa, faDate, fmtMin, minOf } = useApp()
  const { t } = useI18n()

  const d = db.days[iso]
  const goodHabits = db.habits.filter(h => h.type !== 'bad')
  const badHabits = db.habits.filter(h => h.type === 'bad')

  const doneGood = goodHabits.filter(h => d && d.habits && d.habits[h.id])
  const doneBad = badHabits.filter(h => d && d.habits && d.habits[h.id])
  const tasks = d && d.tasks ? d.tasks : []
  const doneTasks = tasks.filter(t => t.done)
  const journal = d && d.journal

  return (
    <div className="day-modal-backdrop" onClick={onClose}>
      <div className="day-modal" onClick={e => e.stopPropagation()}>
        <div className="day-modal-head">
          <div>
            <div className="day-modal-title">{faDate(iso, true)}</div>
            <div className="day-modal-sub">
              <span className="mini-stat">{t('reports.dayModalHabitsStat', { 
                pct: toFa(goodHabits.length ? Math.round(doneGood.length / goodHabits.length * 100) : 0) 
              })}</span>
              {journal && journal.mood > 0 && (
                <span className="mini-stat" style={{ marginRight: 8 }}>
                  {t('reports.feelingLabel')}<b>{moodLvl(journal.mood)}</b>
                </span>
              )}
            </div>
          </div>
          <button className="btn ghost small" onClick={onClose}>{t('reports.close')}</button>
        </div>

        {/* Good Habits */}
        {goodHabits.length > 0 && (
          <div className="day-modal-section">
            <div className="day-modal-label">{t('reports.goodHabitsSection')}</div>
            {goodHabits.map(h => (
              <div key={h.id} className="day-modal-row">
                <span className="mini-dot" style={{ background: h.color }} />
                <span className="mini-name">{h.name}</span>
                <span className={'day-modal-status ' + (d && d.habits && d.habits[h.id] ? 'on' : 'off')}>
                  {d && d.habits && d.habits[h.id] ? t('reports.statusDone') : t('reports.statusNotDone')}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Bad Habits */}
        {badHabits.length > 0 && (
          <div className="day-modal-section">
            <div className="day-modal-label">{t('reports.badHabitsSection')}</div>
            {badHabits.map(h => (
              <div key={h.id} className="day-modal-row">
                <span className="mini-dot" style={{ background: h.color }} />
                <span className="mini-name">{h.name}</span>
                <span className={'day-modal-status ' + (d && d.habits && d.habits[h.id] ? 'on' : 'off')}>
                  {d && d.habits && d.habits[h.id] ? t('reports.statusDoneSad') : t('reports.statusClean')}
                </span>
              </div>
            ))}
          </div>
        )}

        {/* Tasks */}
        {tasks.length > 0 && (
          <div className="day-modal-section">
            <div className="day-modal-label">{t('reports.tasksSection')}</div>
            {tasks.map((t, i) => (
              <div key={i} className="day-modal-row">
                <span className={'task-box ' + (t.done ? 'done' : 'todo')} />
                <span className={'ttext' + (t.done ? ' done' : '')}>{t.text}</span>
              </div>
            ))}
          </div>
        )}

        {/* Journal */}
        {journal && (journal.text || journal.mood) && (
          <div className="day-modal-section">
            <div className="day-modal-label">
              {t('reports.journalSection')}
              {journal.mood > 0 && (
                <span className="mini-stat" style={{ marginRight: 8 }}>
                  {t('reports.feelingLabel')}{moodLvl(journal.mood)}
                </span>
              )}
            </div>
            {journal.text ? (
              <div className="day-modal-journal">{journal.text}</div>
            ) : (
              <div className="day-modal-sub">{t('reports.journalNoNote')}</div>
            )}
            {journal.image && (
              <div className="journal-img-area">
                <img src={journal.image} alt={t('reports.journalImageAlt')} />
              </div>
            )}
          </div>
        )}

        {/* Sleep */}
        <div className="day-modal-section">
          <div className="day-modal-label">{t('reports.sleepSection')}</div>
          <div className="day-modal-row">
            <span className="mini-stat">{t('reports.dayModalWakeStat', { time: d && d.wake ? fmtMin(minOf(d.wake)) : t('reports.moodDash') })}</span>
            <span className="mini-stat">{t('reports.dayModalSleepStat', { time: d && d.sleep ? fmtMin(minOf(d.sleep)) : t('reports.moodDash') })}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

function moodLvl(m) {
  const labels = ['', 'reports.moodDash', 'reports.moodLow', 'reports.moodLazy', 'reports.moodNormal', 'reports.moodGood', 'reports.moodGreat']
  return t(labels[m] || '')
}