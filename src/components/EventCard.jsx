import React, { useEffect, useState } from 'react'
import { toFa, countdownOf, eventIcon, eventLabel, nextEventISO } from '../lib/store'
import { useI18n } from '../lib/i18n'

export default function EventCard({ ev, onDelete }) {
  const { t } = useI18n()
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 60000)
    return () => clearInterval(t)
  }, [])
  const dateStr = nextEventISO(ev)
  if (!dateStr) return null
  const c = countdownOf(dateStr)
  const icon = eventIcon(ev.name)
  return (
    <div className={'event-card' + (c.isToday ? ' today' : '')}>
      <span className="event-icon">{icon}</span>
      <div className="event-info">
        <div className="event-name">{ev.name}</div>
        <div className="event-date">{eventLabel(ev)}{ev.recurring ? t('event.recurringSuffix') : ''}</div>
      </div>
      <div className="event-count">
        {c.isToday ? <span style={{ color: 'var(--accent-warm)', fontWeight: 800 }}>{t('event.today')}</span>
          : c.days > 0 ? <><b style={{ fontSize: 20 }}>{toFa(c.days)}</b><span>{t('event.daysUnit')}</span></>
          : <><b style={{ fontSize: 16 }}>{toFa(c.hours)}:{toFa(c.minutes)}</b><span>{t('event.hoursUnit')}</span></>}
      </div>
      {onDelete && <button className="event-del" onClick={(e) => { e.stopPropagation(); onDelete() }} title={t('event.delete')} aria-label={t('event.deleteAriaLabel')}><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12"/></svg></button>}
    </div>
  )
}