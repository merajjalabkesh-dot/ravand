import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { SITE } from '../../config/site.config'
import { ICONS, IconCheck, IconDownload, IconArrow } from './Icons'

/* ------------------------------------------------------------------ */
/*  هیرو                                                               */
/* ------------------------------------------------------------------ */
export function Hero({ compact = false }) {
  return (
    <section className={'site-hero' + (compact ? ' compact' : '')}>
      <div className="site-hero-glow" aria-hidden="true" />
      <div className="site-hero-in">
        <span className="site-eyebrow">
          <span className="dot" /> نسخهٔ {new Date().getFullYear()} منتشر شد
        </span>
        <h1 className="site-hero-title">{SITE.hero.title}</h1>
        <p className="site-hero-sub">{SITE.hero.subtitle}</p>
        <div className="site-hero-cta">
          <Link className="btn site-btn big" to="/login">{SITE.hero.cta}</Link>
          <Link className="btn site-btn ghost big" to="/download">
            <IconDownload size={19} /> {SITE.hero.ctaSecondary}
          </Link>
        </div>
        <ul className="site-hero-points">
          <li><IconCheck size={16} /> بدون تبلیغ</li>
          <li><IconCheck size={16} /> کار آفلاین</li>
          <li><IconCheck size={16} /> تقویم جلالی</li>
          <li><IconCheck size={16} /> رایگان</li>
        </ul>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  درباره                                                             */
/* ------------------------------------------------------------------ */
export function About() {
  return (
    <section className="site-section" id="about">
      <div className="site-sec-head">
        <span className="site-kicker">درباره</span>
        <h2 className="site-sec-title">{SITE.about.title}</h2>
      </div>
      <div className="about-grid">
        {SITE.about.body.map((p, i) => (
          <p key={i} className="about-p">{p}</p>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  ویژگی‌ها                                                           */
/* ------------------------------------------------------------------ */
export function Features() {
  return (
    <section className="site-section" id="features">
      <div className="site-sec-head">
        <span className="site-kicker">امکانات</span>
        <h2 className="site-sec-title">{SITE.featuresTitle}</h2>
      </div>
      <div className="feat-grid">
        {SITE.features.map((f) => {
          const Icon = ICONS[f.icon] || null
          return (
            <article className="feat-card" key={f.title}>
              <span className="feat-icon">{Icon ? <Icon size={24} /> : null}</span>
              <h3>{f.title}</h3>
              <p>{f.text}</p>
            </article>
          )
        })}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  برای چه کسانی                                                      */
/* ------------------------------------------------------------------ */
export function Audience() {
  return (
    <section className="site-section" id="audience">
      <div className="site-sec-head">
        <span className="site-kicker">مخاطب</span>
        <h2 className="site-sec-title">{SITE.audienceTitle}</h2>
      </div>
      <div className="aud-grid">
        {SITE.audience.map((a, i) => (
          <div className="aud-item" key={a.title}>
            <span className="aud-num">{String(i + 1).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])}</span>
            <div>
              <h3>{a.title}</h3>
              <p>{a.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  چرا روند                                                          */
/* ------------------------------------------------------------------ */
export function Why() {
  return (
    <section className="site-section" id="why">
      <div className="site-sec-head">
        <span className="site-kicker">تمایز</span>
        <h2 className="site-sec-title">{SITE.whyTitle}</h2>
      </div>
      <div className="why-grid">
        {SITE.why.map((w) => (
          <div className="why-item" key={w.title}>
            <IconCheck size={20} />
            <div>
              <h3>{w.title}</h3>
              <p>{w.text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  دانلود                                                             */
/* ------------------------------------------------------------------ */
export function DownloadCards({ compact = false }) {
  return (
    <div className={'dl-grid' + (compact ? ' compact' : '')}>
      {SITE.platforms.map((p) => {
        const Icon = ICONS[p.icon]
        const isWeb = p.id === 'web'
        return (
          <article className={'dl-card' + (p.primary ? ' primary' : '')} key={p.id}>
            <div className="dl-card-top">
              <span className="dl-icon"><Icon size={26} /></span>
              <div>
                <h3 className="dl-name">{p.name}</h3>
                <span className="dl-latin">{p.latin}{p.ext ? ' · ' + p.ext : ''}</span>
              </div>
            </div>
            <p className="dl-text">{p.text}</p>
            <ul className="dl-points">
              {p.points.map((pt) => <li key={pt}><IconCheck size={15} /> {pt}</li>)}
            </ul>
            {isWeb ? (
              <Link className="btn site-btn ghost full" to={p.href}>باز کردن وب‌اپ <IconArrow size={17} /></Link>
            ) : (
              <a className="btn site-btn full" href={p.href} download>
                <IconDownload size={18} /> دانلود {p.ext} <span className="dl-size">{p.size}</span>
              </a>
            )}
          </article>
        )
      })}
    </div>
  )
}

export function DownloadSection() {
  return (
    <section className="site-section" id="download">
      <div className="site-sec-head">
        <span className="site-kicker">دانلود</span>
        <h2 className="site-sec-title">{SITE.downloadTitle}</h2>
        <p className="site-sec-sub">{SITE.downloadSub}</p>
      </div>
      <DownloadCards />
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  سوالات متداول                                                      */
/* ------------------------------------------------------------------ */
export function Faq() {
  const [open, setOpen] = useState(0)
  return (
    <section className="site-section" id="faq">
      <div className="site-sec-head">
        <span className="site-kicker">سوالات</span>
        <h2 className="site-sec-title">سوالات متداول</h2>
      </div>
      <div className="faq-list">
        {SITE.faq.map((item, i) => {
          const isOpen = open === i
          return (
            <div className={'faq-item' + (isOpen ? ' open' : '')} key={item.q}>
              <button
                className="faq-q"
                aria-expanded={isOpen}
                onClick={() => setOpen(isOpen ? -1 : i)}
              >
                <span>{item.q}</span>
                <span className="faq-sign" aria-hidden="true">{isOpen ? '−' : '+'}</span>
              </button>
              <div className="faq-a" hidden={!isOpen}><p>{item.a}</p></div>
            </div>
          )
        })}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  فراخوان پایانی                                                     */
/* ------------------------------------------------------------------ */
export function CtaBand() {
  return (
    <section className="site-cta-band">
      <div className="site-cta-in">
        <h2>آماده‌ای روندت را شروع کنی؟</h2>
        <p>همین حالا حساب بساز و اولین عادتت را تعریف کن.</p>
        <div className="site-cta-btns">
          <Link className="btn site-btn big" to="/login">ساخت حساب رایگان</Link>
          <Link className="btn site-btn ghost big" to="/download">دانلود برنامه</Link>
        </div>
      </div>
    </section>
  )
}
