import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { SITE } from '../../config/site.config'
import { ICONS, IconCheck, IconDownload, IconArrow, IconX } from './Icons'
import Heatmap from './Heatmap'
import KineticField from './KineticField'
import ScrollText from './ScrollText'
import AppLink from './AppLink'
import { fa, smoothScrollToId } from './helpers'

/* ------------------------------------------------------------------ */
/*  هیرو                                                               */
/* ------------------------------------------------------------------ */
/*
 * دکمهٔ «چطور کار می‌کند» فقط کاربر را به نمونهٔ واقعی می‌برد — همون
 * بخشی که همین پایین‌تر در همین صفحه هست. پس لینک ساده نیست و خودمان
 * اسکرول نرم می‌کنیم (چون لندینگ بعد از پورتال یک صفحهٔ بلند است).
 */
function scrollToLive(e) {
  e.preventDefault()
  smoothScrollToId('live')
}

export function Hero({ compact = false, showField = true }) {
  return (
    <section className={'site-hero' + (compact ? ' compact' : '')}>
      {showField && <KineticField />}
      <div className="site-hero-in">
        <h1 className="site-hero-title">{SITE.hero.title}</h1>
        <p className="site-hero-sub">{SITE.hero.subtitle}</p>
        <div className="site-hero-cta">
          <AppLink className="btn site-btn big ghost rv-glass" to="/login">{SITE.hero.cta}</AppLink>
          <a className="btn site-btn ghost big rv-glass" href="#live" onClick={scrollToLive}>
            {SITE.hero.ctaSecondary}
          </a>
        </div>
        <ul className="site-hero-points">
          {SITE.hero.points.map((p) => (
            <li key={p} className="rv-glass">
              <IconCheck size={16} /> {p}
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  نمونه زندهٔ جدول                                                    */
/* ------------------------------------------------------------------ */
export function Live() {
  return (
    <section className="site-section site-live" id="live">
      <div className="site-sec-head">
        <span className="site-kicker">{SITE.live.kicker}</span>
        <h2 className="site-sec-title">{SITE.live.title}</h2>
        <p className="site-sec-sub">{SITE.live.subtitle}</p>
      </div>

      <div className="live-card rv-glass">
        <div className="live-head">
          <div>
            <div className="live-title">روند</div>
            <div className="live-sub">سه ماه گذشته</div>
          </div>
          <div className="live-stats">
            <div className="live-stat"><b>۴۱</b><span>روز کامل</span></div>
            <div className="live-stat"><b>۲۳</b><span>روز بدون ثبت</span></div>
            <div className="live-stat"><b>۵</b><span>عادت فعال</span></div>
          </div>
        </div>

        <Heatmap weeks={20} labels={SITE.live} />

        <p className="live-note">
          این دادهٔ واقعی نیست — نمونه‌ای است با الگویی شبیه زندگی واقعی.
          تو در اپ خودت همین جدول را از صفر می‌سازی.
        </p>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  درباره — با متن حرف‌به‌حرف                                         */
/* ------------------------------------------------------------------ */
export function About() {
  return (
    <section className="site-section" id="about">
      <div className="site-sec-head">
        <span className="site-kicker">{SITE.about.kicker}</span>
        <h2 className="site-sec-title">{SITE.about.title}</h2>
      </div>
      <div className="about-body">
        {SITE.about.body.map((p, i) => (
          i === 0
            ? <p key={i} className="about-lead rv-glass">{p}</p>
            : <p key={i} className="rv-glass">
                <ScrollText text={p} />
              </p>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  امکانات                                                            */
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
            <article className="feat-card rv-glass" key={f.title}>
              <span className="feat-icon rv-glass">{Icon ? <Icon size={24} /> : null}</span>
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
/*  مقایسه                                                             */
/* ------------------------------------------------------------------ */
export function Compare() {
  const C = SITE.compare
  return (
    <section className="site-section" id="compare">
      <div className="site-sec-head">
        <span className="site-kicker">{C.kicker}</span>
        <h2 className="site-sec-title">{C.title}</h2>
        <p className="site-sec-sub">{C.subtitle}</p>
      </div>
      <div className="cmp rv-glass">
        <div className="cmp-head">
          <span className="cmp-feat" />
          <span className="cmp-col us">{C.usLabel}</span>
          <span className="cmp-col them">{C.themLabel}</span>
        </div>
        {C.rows.map((r) => (
          <div className="cmp-row" key={r.feature}>
            <span className="cmp-feat">{r.feature}</span>
            <span className={'cmp-cell' + (r.us === true ? ' yes' : r.us === false ? ' no' : ' text')}>
              {r.us === true ? <IconCheck size={18} /> : r.us === false ? <IconX size={17} /> : r.us}
            </span>
            <span className={'cmp-cell' + (r.them === true ? ' yes' : r.them === false ? ' no' : ' text')}>
              {r.them === true ? <IconCheck size={18} /> : r.them === false ? <IconX size={17} /> : r.them}
            </span>
          </div>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  مخاطب                                                              */
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
          <div className="aud-item rv-glass" key={a.title}>
            <span className="aud-num rv-glass">{fa(i + 1)}</span>
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
/*  نظر کاربران                                                        */
/* ------------------------------------------------------------------ */
export function Testimonials() {
  const T = SITE.testimonials
  return (
    <section className="site-section" id="voices">
      <div className="site-sec-head">
        <span className="site-kicker">{T.kicker}</span>
        <h2 className="site-sec-title">{T.title}</h2>
        <p className="site-sec-sub">{T.note}</p>
      </div>
      <div className="voice-grid">
        {T.items.map((v) => (
          <figure className="voice rv-glass" key={v.name}>
            <p className="voice-text">{v.text}</p>
            <figcaption>
              <span className="voice-avatar">{v.name.charAt(0)}</span>
              <span>
                <b>{v.name}</b>
                <i>{v.role}</i>
              </span>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  تعرفه                                                              */
/* ------------------------------------------------------------------ */
export function Pricing() {
  const P = SITE.pricing
  return (
    <section className="site-section" id="pricing">
      <div className="site-sec-head">
        <span className="site-kicker">{P.kicker}</span>
        <h2 className="site-sec-title">{P.title}</h2>
        <p className="site-sec-sub">{P.subtitle}</p>
      </div>
      <div className="price-grid">
        {P.plans.map((pl) => (
          <article className={'price-card rv-glass' + (pl.primary ? ' primary' : '')} key={pl.id}>
            {pl.primary && <span className="price-badge">{pl.badge || 'پیشنهاد ما'}</span>}
            <h3 className="price-name">{pl.name}</h3>
            <div className="price-amount">
              {pl.price !== '—'
                ? <>
                    {pl.oldPrice && <s className="price-old">{pl.oldPrice}</s>}
                    <b>{pl.price}</b>
                    <span>{pl.unit}</span>
                  </>
                : <b className="price-soon">—</b>}
            </div>
            <div className="price-period">{pl.period}</div>
            <p className="price-text">{pl.text}</p>
            <ul className="price-feats">
              {pl.features.map((f) => <li key={f}><IconCheck size={15} /> {f}</li>)}
            </ul>
            <AppLink className={'btn site-btn full' + (pl.primary ? '' : ' ghost')} to="/login">{pl.cta}</AppLink>
          </article>
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
          <article className={'dl-card rv-glass' + (p.primary ? ' primary' : '')} key={p.id}>
            <div className="dl-card-top">
              <span className="dl-icon rv-glass">{Icon ? <Icon size={26} /> : null}</span>
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
              <AppLink className="btn site-btn ghost full rv-glass" to={p.href}>باز کردن وب‌اپ <IconArrow size={17} /></AppLink>
            ) : (
              <a className="btn site-btn full rv-glass-strong" href={p.href} download>
                <IconDownload size={18} /> دانلود
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
/*  مراحل نصب                                                          */
/* ------------------------------------------------------------------ */
export function Steps() {
  return (
    <section className="site-section" id="steps">
      <div className="site-sec-head">
        <span className="site-kicker">راهنما</span>
        <h2 className="site-sec-title">در سه قدم شروع کن</h2>
      </div>
      <ol className="steps-grid">
        {SITE.steps.map((s) => (
          <li className="step rv-glass" key={s.n}>
            <span className="step-n">{fa(s.n)}</span>
            <h3>{s.t}</h3>
            <p>{s.d}</p>
          </li>
        ))}
      </ol>
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
        <h2 className="site-sec-title">{SITE.faqTitle}</h2>
      </div>
      <div className="faq-list">
        {SITE.faq.map((item, i) => {
          const isOpen = open === i
          return (
            <div className={'faq-item rv-glass' + (isOpen ? ' open' : '')} key={item.q}>
              <button className="faq-q" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? -1 : i)}>
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
/*  کانال‌ها                                                           */
/* ------------------------------------------------------------------ */
export function Channels() {
  const C = SITE.channels
  return (
    <section className="site-section" id="channels">
      <div className="site-sec-head">
        <span className="site-kicker">{C.kicker}</span>
        <h2 className="site-sec-title">{C.title}</h2>
        <p className="site-sec-sub">{C.subtitle}</p>
      </div>
      <div className="chan-grid">
        {C.items.map((c) => {
          const Icon = ICONS[c.id] || null
          const inner = (
            <>
              <span className="chan-icon rv-glass">{Icon ? <Icon size={24} /> : null}</span>
              <div className="chan-body">
                <div className="chan-name">
                  {c.name}
                  {c.href ? null : <span className="chan-soon">به‌زودی</span>}
                </div>
                <div className="chan-latin">{c.latin}</div>
                <p className="chan-text">{c.text}</p>
              </div>
              {c.href ? <IconArrow size={18} /> : null}
            </>
          )
          return c.href ? (
            <a className="chan-card rv-glass" href={c.href} key={c.id}>{inner}</a>
          ) : (
            <div className="chan-card rv-glass soon" key={c.id}>{inner}</div>
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
      <div className="site-cta-in rv-glass-strong">
        <h2>آماده‌ای روندت را شروع کنی؟</h2>
        <p>همین حالا حساب بساز. اولین جدول روزت از همین‌جا شروع می‌شود.</p>
        <div className="site-cta-btns">
          <AppLink className="btn site-btn big" to="/login">ساخت حساب رایگان</AppLink>
          <Link className="btn site-btn ghost big" to="/download">دانلود برنامه</Link>
        </div>
      </div>
    </section>
  )
}
