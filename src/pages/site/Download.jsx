import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import SiteHeader from '../../components/site/SiteHeader'
import SiteFooter from '../../components/site/SiteFooter'
import { DownloadCards } from '../../components/site/Sections'
import { setPageMeta } from '../../lib/seo'
import { SITE } from '../../config/site.config'

const STEPS = [
  { n: 1, t: 'نسخه‌ات را انتخاب کن', d: 'ویندوز، اندروید یا وب‌اپ — هرکدام که با دستگاهت جور است.' },
  { n: 2, t: 'دانلود و نصب کن', d: 'فایل را بگیر و نصب کن. برای اندروید، نصب مستقیم از خود فایل انجام می‌شود.' },
  { n: 3, t: 'حساب بساز و شروع کن', d: 'با ایمیل و رمز وارد شو. داده‌هایت روی همه دستگاه‌هایت می‌ماند.' },
]

export default function Download() {
  useEffect(() => {
    setPageMeta({
      title: 'دانلود روند — ویندوز exe، اندروید apk و وب‌اپ',
      description: 'روند را برای ویندوز (exe)، اندروید (apk) و وب‌اپ دانلود کن. رایگان، بدون تبلیغ، با کار آفلاین و تقویم جلالی.',
      path: '/download',
    })
  }, [])

  return (
    <div className="site">
      <SiteHeader />
      <main className="site-main">
        <section className="site-hero compact">
          <div className="site-hero-glow" aria-hidden="true" />
          <div className="site-hero-in">
            <span className="site-eyebrow"><span className="dot" /> دانلود</span>
            <h1 className="site-hero-title">{SITE.downloadTitle}</h1>
            <p className="site-hero-sub">{SITE.downloadSub}</p>
          </div>
        </section>

        <section className="site-section">
          <DownloadCards />
        </section>

        <section className="site-section" id="steps">
          <div className="site-sec-head">
            <span className="site-kicker">راهنما</span>
            <h2 className="site-sec-title">در سه قدم شروع کن</h2>
          </div>
          <ol className="steps-grid">
            {STEPS.map((s) => (
              <li className="step" key={s.n}>
                <span className="step-n">{String(s.n).replace(/\d/g, (d) => '۰۱۲۳۴۵۶۷۸۹'[+d])}</span>
                <h3>{s.t}</h3>
                <p>{s.d}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="site-cta-band">
          <div className="site-cta-in">
            <h2>هنوز سؤالی داری؟</h2>
            <p>شاید جوابش در بخش سوالات متداول باشد.</p>
            <div className="site-cta-btns">
              <Link className="btn site-btn big" to="/site#faq">سوالات متداول</Link>
              <Link className="btn site-btn ghost big" to="/site">درباره روند</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
