import React, { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import GlyphPortal from '../components/ui/glyph-portal'
import PortalBackground from '../components/PortalBackground'
import SiteHeader from '../components/site/SiteHeader'
import {
  Hero, About, Live, Features, Compare, Testimonials, Pricing, DownloadCards, Faq, Channels,
} from '../components/site/Sections'
import { setPageMeta } from '../lib/seo'
import AppLink from '../components/site/AppLink'

// صفحهٔ اول آبی روشن است و با اسکرول به سورمه‌ای ریلِ محتوا می‌رسد.
const SKY = [0xa9, 0xcd, 0xf7]
const NAVY = [0x0a, 0x17, 0x33]
const mix = (a, b, t) =>
  'rgb(' + a.map((v, i) => Math.round(v + (b[i] - v) * t)).join(',') + ')'
// رنگ حروف: روی زمینهٔ روشن سورمه‌ای، روی زمینهٔ تیره سفید
const INK_DARK = '#0a1733'
const INK_LIGHT = '#ffffff'
const SKY_CSS = 'rgb(169,205,247)'
const INK_CSS = INK_DARK

export default function Landing() {
  const [face, setFace] = useState(null)
  // هدر بعد از شروع اسکرول ظاهر می‌شود، نه از همان اول
  const [showBar, setShowBar] = useState(false)
  // طول اسکرول پورتال: در موبایل کوتاه‌تر تا کاربر زودتر به ریل محتوا برسد
  const [scrollLen, setScrollLen] = useState(3.2)
  const shellRef = useRef(null)

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 700px)')
    const apply = () => setScrollLen(mq.matches ? 2.2 : 3.2)
    apply()
    mq.addEventListener('change', apply)
    return () => mq.removeEventListener('change', apply)
  }, [])

  useEffect(() => {
    setPageMeta({
      title: 'روند — عادت‌هایت را بساز، روندت را ببین',
      description: 'روند: کارهای روزانه، عادت و ژورنال در یک جدول. تقویم جلالی، کار آفلاین و بدون تبلیغ. دانلود برای ویندوز، اندروید و وب.',
      path: '/',
    })
  }, [])

  /* هدر موقع شیرجهٔ پورتال نباید بیاید؛ فقط وقتی اسکرول تمام شد و
     کاربر وارد ریلِ محتوا شد، بالای صفحه می‌نشیند و همان‌جا می‌ماند. */
  useEffect(() => {
    const rail = document.querySelector('.gp-rail')
    if (!rail) return
    const io = new IntersectionObserver(
      ([e]) => setShowBar(e.isIntersecting),
      { rootMargin: '-72px 0px 0px 0px', threshold: 0 }
    )
    io.observe(rail)
    return () => io.disconnect()
  }, [face])

  // باید صبر کنیم تا فونت Vazirmatn لود شود، وگرنه کامپوننت پورتال درست کار نمی‌کند
  const fontFaceName = 'Vazirmatn'
  const faceStack = `'${fontFaceName}', Arial, sans-serif`
  useEffect(() => {
    let settled = false
    const finish = (value) => { if (!settled) { settled = true; setFace(value) } }
    const ready = () => {
      try {
        if (document.fonts && document.fonts.check('700 100px ' + fontFaceName, 'ravand')) { return finish(faceStack) }
      } catch (e) { /* ignore */ }
      finish(faceStack)
    }
    try {
      if (document.fonts) {
        document.fonts.ready.then(ready)
        const t = setTimeout(() => finish(faceStack), 2000)
        return () => { settled = true; clearTimeout(t) }
      }
    } catch (e) { /* ignore */ }
    finish(faceStack)
    return () => { settled = true }
  }, [])

  /*
   * رنگ پس‌زمینه با اسکرول از آبی روشن به سورمه‌ای می‌رود تا
   * پورتال باز شود و ریلِ محتوا دقیقاً روی همان رنگ بنشیند.
   * --gp-field و --gp-paper هر دو با همین رنگ می‌روند تا پس‌زمینه
   * و حرفی که از آن دیده می‌شود هم‌رنگ نمانند.
   */
  const onPortalProgress = useCallback((p) => {
    const el = shellRef.current
    if (!el) return
    const t = Math.max(0, Math.min(1, p / 0.75))
    const color = mix(SKY, NAVY, t)
    el.style.setProperty('--lp-bg', color)
    el.style.setProperty('--lp-rail', color)
    el.style.setProperty('--gp-paper', color)
    el.style.setProperty('--gp-field', color)
    /* حروف یک‌باره عوض می‌شوند، نه تدریجی: تا وقتی زمینه روشن است
       سورمه‌ای می‌مانند و یک‌باره سفید می‌شوند. اگر تدریجی کنیم، در
       وسط گرادیان هم‌رنگ زمینه می‌شوند و کلمه «محو» به نظر می‌رسد. */
    el.style.setProperty('--gp-ink', t < 0.36 ? INK_DARK : INK_LIGHT)
    el.style.setProperty('--lp-tint', t.toFixed(4))
  }, [])

  return (
    <div className="landing-page" ref={shellRef}>
      {/* هدر فقط بعد از اسکرول — تا اول صفحه تمیز و خالی بماند */}
      <div className={'landing-bar' + (showBar ? ' show' : '')}>
        <SiteHeader floating />
      </div>
      {face ? (
        <GlyphPortal
          word="Ravand"
          fontFamily={face}
          fontWeight={700}
          scrollLength={scrollLen}
          interactive
          focusChar="n"
          annotations={false}
          enterLabel=""
          onProgress={onPortalProgress}
          background={<PortalBackground />}
          style={{
            '--gp-paper': SKY_CSS,
            '--gp-ink': INK_CSS,
            '--gp-field': SKY_CSS,
          }}
          front={
            <div className="landing-front" style={{ position: 'absolute', inset: 'auto 24px 7% 24px', textAlign: 'center' }}>
              <p className="landing-front-lead">عادت‌هایت را بساز، روندت را ببین.</p>
              <p className="landing-front-hint">اسکرول کنید <span style={{ display: 'inline-block', transform: 'translateY(1px)' }}>↓</span></p>
            </div>
          }
        >
          {/* ---- ریل محتوایی: بعد از اسکرول اینجا ظاهر می‌شود ---- */}
          <div className="gp-rail">
            <Hero compact />
            <Live />
            <About />
            <Features />
            <Compare />
            <Testimonials />
            <Pricing />
            <section className="site-section" id="download">
              <div className="site-sec-head">
                <span className="site-kicker">دانلود</span>
                <h2 className="site-sec-title">روند را نصب کن</h2>
                <p className="site-sec-sub">
                  هر نسخه‌ای که به دلت می‌خواهد را بردار. <Link to="/download" className="site-inline-link">جزئیات بیشتر</Link>
                </p>
              </div>
              <DownloadCards compact />
            </section>
            <Faq />
            <Channels />
            <section className="site-cta-band">
              <div className="site-cta-in">
                <h2>آماده‌ای روندت را شروع کنی؟</h2>
                <p>همین حالا حساب بساز. اولین جدول روزت از همین‌جا شروع می‌شود.</p>
                <div className="site-cta-btns">
                  <AppLink className="btn site-btn big" to="/login">ساخت حساب رایگان</AppLink>
                  <Link className="btn site-btn ghost big" to="/download">دانلود برنامه</Link>
                </div>
              </div>
            </section>
            <footer className="gp-rail-foot">
              <div className="site-foot-bar">
                <span>© {new Date().getFullYear()} روند — همهٔ حقوق محفوظ است.</span>
                <span className="site-foot-note">بدون تبلیغ · بدون فروش داده</span>
              </div>
            </footer>
          </div>
        </GlyphPortal>
      ) : (
        <div role="status" style={{ height: '100vh', display: 'grid', placeItems: 'center', background: '#a9cdf7', color: '#0b2545', fontSize: 14 }}>
          در حال آماده‌سازی…
        </div>
      )}
    </div>
  )
}
