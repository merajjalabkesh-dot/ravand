import React, { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { SITE } from '../../config/site.config'
import { ICONS, IconCheck, IconDownload, IconArrow, IconX } from './Icons'
import Heatmap, { getSampleSummary } from './Heatmap'
import KineticField from './KineticField'
import ScrollText from './ScrollText'
import AppLink from './AppLink'
import { fa, smoothScrollToId } from './helpers'

/* هفته‌های جدول نمونه — هم برای جدول و هم برای آمار بالای آن، تا یکسان بمانند */
const LIVE_WEEKS = 20

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
  // آمار بالای جدول از همان دادهٔ نمونه ساخته می‌شود تا هیچ‌وقت با جدول نخواند
  const stats = getSampleSummary(LIVE_WEEKS)
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
            <div className="live-stat"><b>{fa(stats.full)}</b><span>روز کامل</span></div>
            <div className="live-stat"><b>{fa(stats.empty)}</b><span>روز بدون ثبت</span></div>
            <div className="live-stat"><b>{fa(stats.habits)}</b><span>عادت فعال</span></div>
          </div>
        </div>

        <Heatmap weeks={LIVE_WEEKS} labels={SITE.live} />

        <p className="live-note">
          این دادهٔ واقعی نیست — نمونه‌ای است با الگویی شبیه زندگی واقعی.
          تو در اپ خودت همین جدول را از صفر می‌سازی.
        </p>
      </div>

      <Gallery />
    </section>
  )
}

/* ------------------------------------------------------------------ */
/*  گالری محیط برنامه — اسلایدشوی خودکار زیر جدول نمونه                */
/* ------------------------------------------------------------------ */
/*
 * تصاویر از SITE.live.gallery می‌آیند. تا وقتی کاربر عکس واقعی نفرستاده،
 * هر item با src خالی یک جای‌نگهدار نشان می‌دهد. اسلایدشو هر ۶.۵ ثانیه
 * جلو می‌رود، با کلیک دستی تایمر ریست می‌شود، و وقتی تب پنهان است یا
 * گالری از دید بیرون است تایمر می‌ایستد. با prefers-reduced-motion
 * خودکار جلو نمی‌رود و فقط دستی جابه‌جا می‌شود.
 */
function Gallery() {
  const G = SITE.live.gallery
  const items = G && G.items ? G.items : []
  const [i, setI] = useState(0)
  const [paused, setPaused] = useState(false)
  const [inView, setInView] = useState(false)
  const [reduce, setReduce] = useState(false)
  const rootRef = useRef(null)

  const n = items.length
  const go = (d) => setI((v) => (n ? (v + d + n) % n : 0))

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    const apply = () => setReduce(mq.matches)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    const el = rootRef.current
    if (!el || !('IntersectionObserver' in window)) { setInView(true); return }
    const io = new IntersectionObserver(([e]) => setInView(e.isIntersecting), { threshold: 0.25 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (reduce || paused || !inView || n < 2) return
    if (typeof document !== 'undefined' && document.hidden) return
    const t = setTimeout(() => setI((v) => (v + 1) % n), 6500)
    return () => clearTimeout(t)
  }, [reduce, paused, inView, n, i])

  if (!n) return null

  return (
    <div className="gal rv-glass" ref={rootRef}
      role="region" aria-roledescription="carousel" aria-label={G.title}
      onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      <div className="gal-head">
        <h3 className="gal-title">{G.title}</h3>
        {G.subtitle && <p className="gal-sub">{G.subtitle}</p>}
      </div>

      <div className="gal-stage">
        {items.map((it, idx) => (
          <figure className={'gal-slide' + (idx === i ? ' on' : '')} key={idx}
            aria-hidden={idx !== i} aria-roledescription="slide"
            aria-label={`${fa(idx + 1)} از ${fa(n)}`}>
            {it.src
              ? <img className="gal-img" src={it.src} alt={it.alt || ''} loading="lazy" draggable="false" />
              : <div className="gal-ph" role="img" aria-label={it.alt || ''}>
                  <span>به‌زودی — تصویر واقعی اینجا می‌آید</span>
                </div>}
          </figure>
        ))}
      </div>

      {n > 1 && (
        <>
          <button type="button" className="gal-arrow prev" onClick={() => go(-1)} aria-label="تصویر قبلی">
            <IconArrow size={20} />
          </button>
          <button type="button" className="gal-arrow next" onClick={() => go(1)} aria-label="تصویر بعدی">
            <IconArrow size={20} />
          </button>
          <div className="gal-dots" role="tablist" aria-label="انتخاب تصویر">
            {items.map((_, idx) => (
              <button type="button" key={idx} role="tab" aria-selected={idx === i}
                className={'gal-dot' + (idx === i ? ' on' : '')}
                onClick={() => setI(idx)} aria-label={`تصویر ${fa(idx + 1)}`} />
            ))}
          </div>
        </>
      )}
    </div>
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
function TestimonialCard({ v }) {
  return (
    <figure className="voice rv-glass">
      <p className="voice-text">{v.text}</p>
      <figcaption>
        <span className="voice-avatar">{v.name.charAt(0)}</span>
        <span>
          <b>{v.name}</b>
          <i>{v.role}</i>
        </span>
      </figcaption>
    </figure>
  )
}

export function Testimonials() {
  const T = SITE.testimonials
  const items = T.items || []
  const has = items.length > 0
  return (
    <section className="site-section" id="voices">
      <div className="site-sec-head">
        <span className="site-kicker">{T.kicker}</span>
        <h2 className="site-sec-title">{T.title}</h2>
        {T.note && <p className="site-sec-sub">{T.note}</p>}
      </div>
      {!has ? (
        <p className="voice-empty rv-glass">{T.empty || 'هنوز نظری ثبت نشده است.'}</p>
      ) : (
        /*
         * نوار بی‌نهایت: دو گروه تکراریِ یکسان، کنار هم. انیمیشن کل نوار
         * را به اندازهٔ یک گروه جلو می‌برد و چون گروه دوم همان اولی است،
         * بی‌وقفه و بدون پرش تکرار می‌شود. با نگه‌داشتن موس می‌ایستد.
         */
        <div className={'marquee' + (items.length < 4 ? ' static' : '')}>
          <div className="marquee-track" style={{ '--duration': Math.max(items.length * 9, 24) + 's' }}>
            <div className="marquee-group">
              {items.map((v, i) => <TestimonialCard v={v} key={'a' + i} />)}
            </div>
            <div className="marquee-group" aria-hidden="true">
              {items.map((v, i) => <TestimonialCard v={v} key={'b' + i} />)}
            </div>
          </div>
        </div>
      )}
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
                ? <><b>{pl.price}</b><span>{pl.unit}</span></>
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
