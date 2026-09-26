import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import SiteHeader from '../../components/site/SiteHeader'
import SiteFooter from '../../components/site/SiteFooter'
import {
  Hero, About, Live, Features, Compare, Audience, Testimonials, Pricing, DownloadSection, Faq, CtaBand,
} from '../../components/site/Sections'
import { setPageMeta, softwareAppJsonLd, faqJsonLd } from '../../lib/seo'
import { SITE } from '../../config/site.config'

export default function SiteHome() {
  const loc = useLocation()

  useEffect(() => {
    setPageMeta({
      title: 'روند — جدول روزهایت | اپ عادت و برنامهٔ روزانه برای ویندوز و اندروید',
      description: 'روند به‌جای لیست تیک، یک جدول تصویری از روزهایت می‌سازد. پیگیری عادت، کارهای روزانه با تقویم جلالی، ژورنال و محاسبهٔ خواب. رایگان، بدون تبلیغ و با کار آفلاین.',
      path: '/site',
      jsonLd: [
        softwareAppJsonLd({
          name: 'روند — Ravand',
          description: 'اپ پیگیری عادت و برنامهٔ روزانه با جدول تصویری و تقویم جلالی',
        }),
        faqJsonLd(SITE.faq),
      ],
    })
  }, [])

  // اسکرول نرم به بخش درخواستی
  useEffect(() => {
    if (!loc.hash) return
    const el = document.getElementById(loc.hash.slice(1))
    if (el) setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 90)
  }, [loc.hash])

  return (
    <div className="site">
      <SiteHeader />
      <main className="site-main">
        <Hero />
        <Live />
        <About />
        <Features />
        <Compare />
        <Audience />
        <Testimonials />
        <Pricing />
        <DownloadSection />
        <Faq />
        <CtaBand />
      </main>
      <SiteFooter />
    </div>
  )
}
