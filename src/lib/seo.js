// ============================================================
// SEO — مدیریت تگ‌های هر صفحه به‌صورت کلاینتی
// نکته: این لایه پایه است. برای SEO کامل (JSON-LD، sitemap، prerender)
// در مرحله SEO روی prerender سمت سرور سراغش می‌رویم.
// ============================================================

const SITE_URL = 'https://ravand.app'

/** متا تگ را بساز یا به‌روزرسانی کن */
function upsertMeta(attr, key, content) {
  if (!content) return
  let el = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!el) {
    el = document.createElement('meta')
    el.setAttribute(attr, key)
    document.head.appendChild(el)
  }
  el.setAttribute('content', content)
}

function upsertLink(rel, href) {
  if (!href) return
  let el = document.head.querySelector(`link[rel="${rel}"]`)
  if (!el) {
    el = document.createElement('link')
    el.setAttribute('rel', rel)
    document.head.appendChild(el)
  }
  el.setAttribute('href', href)
}

/**
 * عنوان و توضیحات هر صفحه را تنظیم می‌کند.
 * اگر صفحه JSON-LD داشته باشد، تزریقش می‌کند.
 */
export function setPageMeta({ title, description, path = '/', image = '/og-cover.png', jsonLd = null, noindex = false }) {
  if (typeof document === 'undefined') return
  const url = SITE_URL + path

  document.title = title
  upsertMeta('name', 'description', description)
  upsertMeta('property', 'og:title', title)
  upsertMeta('property', 'og:description', description)
  upsertMeta('property', 'og:url', url)
  upsertMeta('property', 'og:type', 'website')
  upsertMeta('property', 'og:site_name', 'روند')
  upsertMeta('property', 'og:locale', 'fa_IR')
  upsertMeta('property', 'og:image', SITE_URL + image)
  upsertMeta('name', 'twitter:card', 'summary_large_image')
  upsertMeta('name', 'twitter:title', title)
  upsertMeta('name', 'twitter:description', description)
  upsertMeta('name', 'twitter:image', SITE_URL + image)
  upsertLink('canonical', url)

  if (noindex) {
    upsertMeta('name', 'robots', 'noindex, nofollow')
  } else {
    const robots = document.head.querySelector('meta[name="robots"]')
    if (robots) robots.remove()
  }

  // JSON-LD
  const prev = document.getElementById('page-jsonld')
  if (prev) prev.remove()
  if (jsonLd) {
    const s = document.createElement('script')
    s.type = 'application/ld+json'
    s.id = 'page-jsonld'
    s.textContent = JSON.stringify(jsonLd)
    document.head.appendChild(s)
  }
}

/** داده ساختاریافته اپلیکیشن (برای Google Play و SEO) */
export function softwareAppJsonLd({ name, description, category = 'ProductivityApplication' }) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name,
    description,
    applicationCategory: category,
    operatingSystem: 'Windows, Android, Web',
    inLanguage: ['fa', 'en'],
    offers: { '@type': 'Offer', price: '0', priceCurrency: 'IRR' },
    publisher: { '@type': 'Organization', name: 'Ravand' },
  }
}

/** داده ساختاریافته FAQ برای نمایش نتایج غنی در گوگل */
export function faqJsonLd(faq) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
}

export { SITE_URL }
