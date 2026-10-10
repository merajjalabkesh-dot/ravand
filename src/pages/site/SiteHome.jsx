import React, { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import SiteHeader from '../../components/site/SiteHeader'
import SiteFooter from '../../components/site/SiteFooter'
import {
  Hero, About, Live, Features, Compare, Audience, Testimonials, Pricing, DownloadSection, Faq, Channels, CtaBand,
} from '../../components/site/Sections'
import { setPageMeta, softwareAppJsonLd, faqJsonLd } from '../../lib/seo'
import { SITE } from '../../config/site.config'

export default function SiteHome() {
  const loc = useLocation()

  useEffect(() => {
    setPageMeta({
      title: 'روند — جدول روزهایت | اپ عادت و برنامهٔ روزانه برای ویندوز و اندروید',
      description: 'روند کارهای روزانه، عادت و ژورنالت را در یک جدول تصویری جمع می‌کند. الگوی هفته‌ای، ماهانه و سه‌ماهه، تقویم جلالی و محاسبهٔ خواب. رایگان، بدون تبلیغ و با کار آفلاین.',
      path: '/site',
      jsonLd: [
        softwareAppJsonLd({
          name: 'روند — Ravand',
          description: 'اپ پیگیری کارهای روزانه، عادت و ژورنال با جدول تصویری و تقویم جلالی',
        }),
        faqJsonLd(SITE.faq),
      ],
    })
  }, [])

  // اسکرول نرم به بخش درخواستی؛ بدون هش، از بالای صفحه شروع شود
  useEffect(() => {
    if (!loc.hash) { window.scrollTo(0, 0); return }
    const el = document.getElementById(loc.hash.slice(1))
    if (!el) return
    const id = setTimeout(() => el.scrollIntoView({ behavior: 'smooth', block: 'start' }), 90)
    return () => clearTimeout(id)
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
        <Channels />
        <CtaBand />
      </main>
      <SiteFooter />
    </div>
  )
}
