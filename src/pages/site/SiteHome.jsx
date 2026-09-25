import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import SiteHeader from '../../components/site/SiteHeader'
import SiteFooter from '../../components/site/SiteFooter'
import {
  Hero, About, Features, Audience, Why, DownloadSection, Faq, CtaBand,
} from '../../components/site/Sections'
import { setPageMeta, softwareAppJsonLd, faqJsonLd } from '../../lib/seo'
import { SITE } from '../../config/site.config'

export default function SiteHome() {
  const loc = useLocation()

  useEffect(() => {
    setPageMeta({
      title: 'روند — اپ عادت‌ها، کارهای روزانه و ژورنال | ویندوز، اندروید و وب',
      description: 'روند یک خانهٔ شیشه‌ای برای زندگی منظم است: پیگیری عادت‌ها، مدیریت کارهای روزانه با تقویم جلالی، ژورنال روزانه و محاسبه خواب. رایگان، بدون تبلیغ و با کار آفلاین. برای ویندوز، اندروید و وب.',
      path: '/site',
      jsonLd: [
        softwareAppJsonLd({
          name: 'روند — Ravand',
          description: 'اپ پیگیری عادت، کارهای روزانه و ژورنال با تقویم جلالی',
        }),
        faqJsonLd(SITE.faq),
      ],
    })
  }, [])

  // اگر آدرس با # بیاید، اسکرول نرم به همان بخش
  useEffect(() => {
    if (!loc.hash) return
    const el = document.getElementById(loc.hash.slice(1))
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 80)
  }, [loc.hash])

  return (
    <div className="site">
      <SiteHeader />
      <main className="site-main">
        <Hero />
        <About />
        <Features />
        <Audience />
        <Why />
        <DownloadSection />
        <Faq />
        <CtaBand />
      </main>
      <SiteFooter />
    </div>
  )
}
