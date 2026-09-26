import React, { useEffect } from 'react'
import { Link } from 'react-router-dom'
import SiteHeader from '../../components/site/SiteHeader'
import SiteFooter from '../../components/site/SiteFooter'
import { DownloadCards, Steps, Faq } from '../../components/site/Sections'
import { setPageMeta } from '../../lib/seo'
import { SITE } from '../../config/site.config'
import Logo from '../../components/site/Logo'

export default function Download() {
  useEffect(() => {
    setPageMeta({
      title: 'دانلود روند — ویندوز exe، اندروید apk و وب‌اپ',
      description: 'روند را برای ویندوز (exe)، اندروید (apk) و وب‌اپ دانلود کن. رایگان، بدون تبلیغ، با کار آفلاین و تقویم جلالی. حجم کمتر از ۸ مگابایت.',
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
            <Logo size={54} tone="gradient" glow />
            <span className="site-eyebrow"><span className="dot" /> دانلود</span>
            <h1 className="site-hero-title">{SITE.downloadTitle}</h1>
            <p className="site-hero-sub">{SITE.downloadSub}</p>
          </div>
        </section>

        <section className="site-section" id="platforms">
          <DownloadCards />
        </section>

        <Steps />

        <section className="dl-note">
          <div className="dl-note-in">
            <div className="dl-note-item">
              <strong>نسخه‌ها هنوز ساخته نشده‌اند</strong>
              <span>فایل‌های exe و apk در مرحلهٔ بعدی روی سرور قرار می‌گیرند. تا آن زمان کلیک روی دکمهٔ دانلود خطا می‌دهد — این طبیعی است.</span>
            </div>
            <div className="dl-note-item">
              <strong>وب‌اپ همین حالا کار می‌کند</strong>
              <span>اگر عجله داری، با همان حساب در مرورگر وارد شو. داده‌هایت یکی می‌مانند.</span>
            </div>
          </div>
        </section>

        <Faq />

        <section className="site-cta-band">
          <div className="site-cta-in">
            <h2>هنوز سؤالی داری؟</h2>
            <p>شاید جوابش در بخش سوالات متداول باشد.</p>
            <div className="site-cta-btns">
              <Link className="btn site-btn big" to="/site#faq">سوالات متداول</Link>
              <Link className="btn site-btn ghost big" to="/site#compare">چرا روند؟</Link>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter />
    </div>
  )
}
