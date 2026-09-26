import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import GlyphPortal from '../components/ui/glyph-portal'
import PortalBackground from '../components/PortalBackground'
import {
  Hero, About, Live, Features, Compare, Audience, Testimonials, Pricing, DownloadCards, Faq,
} from '../components/site/Sections'
import { setPageMeta } from '../lib/seo'

const family = '"Vazirmatn", Arial, sans-serif'

export default function Landing() {
  const [isMobile] = useState(() => typeof window !== 'undefined' && window.matchMedia('(max-width: 700px)').matches)
  const [face, setFace] = useState(null)

  useEffect(() => {
    setPageMeta({
      title: 'روند — عادت‌هایت را بساز، روندت را ببین',
      description: 'روند: خانهٔ شیشه‌ای عادت‌ها، کارهای روزانه و ژورنال. تقویم جلالی، کار آفلاین و بدون تبلیغ. دانلود برای ویندوز، اندروید و وب.',
      path: '/',
    })
  }, [])

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

  return (
    <div className="landing-page">
      {face ? (
        <GlyphPortal
          word="Ravand"
          fontFamily={face}
          fontWeight={700}
          scrollLength={3.2}
          interactive={false}
          focusChar="n"
          annotations={false}
          enterLabel=""
          background={<PortalBackground />}
          style={{ '--gp-paper': '#0a0f1f', '--gp-ink': isMobile ? '#ffffff' : '#cfe0ff', '--gp-field': '#0a0f1f' }}
          front={
            <div style={{ position: 'absolute', inset: 'auto 24px 7% 24px', textAlign: 'center' }}>
              <p style={{ margin: '0 auto', fontSize: 'clamp(20px, 3vw, 30px)', fontWeight: 600, lineHeight: 1.5, color: isMobile ? 'rgba(255,255,255,.94)' : 'rgba(207,224,255,.9)', textShadow: isMobile ? '0 0 22px rgba(120,170,255,.6), 0 2px 14px rgba(5,8,20,.8)' : '0 2px 18px rgba(10,15,31,.8)', maxWidth: 420 }}>عادت‌هایت را بساز، روندت را ببین.</p>
              <p style={{ margin: '12px auto 0', fontSize: 14, lineHeight: 1.5, color: isMobile ? 'rgba(220,235,255,.85)' : 'rgba(160,175,205,.7)', maxWidth: 420 }}>اسکرول کنید <span style={{ display: 'inline-block', transform: 'translateY(1px)' }}>↓</span></p>
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
            <section className="site-cta-band">
              <div className="site-cta-in">
                <h2>آماده‌ای روندت را شروع کنی؟</h2>
                <p>همین حالا حساب بساز. اولین جدول روزت از همین‌جا شروع می‌شود.</p>
                <div className="site-cta-btns">
                  <Link className="btn site-btn big" to="/login">ساخت حساب رایگان</Link>
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
        <div role="status" style={{ height: '100vh', display: 'grid', placeItems: 'center', background: '#0a0f1f', color: '#9fb7e0', fontSize: 14 }}>
          در حال آماده‌سازی…
        </div>
      )}
    </div>
  )
}
