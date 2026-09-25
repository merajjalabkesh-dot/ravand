import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react'
import { FA, EN } from '../locales'
import { setActiveLang, num } from './store'

/*
 * سیستم دو زبانهٔ روند
 * ------------------
 * زبان پیش‌فرض فارسی است. کاربر از صفحهٔ تنظیمات می‌تواند آن را عوض کند و
 * انتخابش روی دستگاه ذخیره می‌شود.
 */

const Ctx = createContext(null)
export const useI18n = () => useContext(Ctx)

const DICTS = { fa: FA, en: EN }
const STORAGE_KEY = 'rg_lang'

/** زبان اولیه: همیشه فارسی، مگر کاربر قبلاً چیزی ذخیره کرده باشد */
function initialLang() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved && DICTS[saved]) return saved
  } catch (e) { /* حافظه در دسترس نیست */ }
  return 'fa'
}

export function I18nProvider({ children }) {
  const [lang, setLangState] = useState(initialLang)

  const setLang = useCallback((next) => {
    if (!DICTS[next]) return
    setLangState(next)
    try { localStorage.setItem(STORAGE_KEY, next) } catch (e) { /* بی‌خیال */ }
  }, [])

  /* ---- اثرهای جانبی: html lang/dir و کلاس ریشه ---- */
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('lang', lang)
    root.setAttribute('dir', lang === 'fa' ? 'rtl' : 'ltr')
    root.classList.toggle('lang-en', lang === 'en')
    // توابع ماژولیِ store (اعداد، ماه‌ها، حس) از این متغیر می‌خوانند
    setActiveLang(lang)
  }, [lang])

  /* ---- فونت مناسب هر زبان ---- */
  useEffect(() => {
    let cancelled = false
    const id = 'rg-lang-font'
    const old = document.getElementById(id)
    if (old) old.remove()
    const link = document.createElement('link')
    link.id = id
    link.rel = 'stylesheet'
    if (lang === 'en') {
      link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap'
    } else {
      link.href = 'https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;600;700;800;900&display=swap'
    }
    document.head.appendChild(link)
    return () => { cancelled = true; if (!cancelled) link.remove() }
  }, [lang])

  const dict = DICTS[lang] || FA

  /** ترجمه با جای‌گذاری {name} */
  const t = useCallback((key, vars) => {
    let s = dict[key]
    if (s == null) s = FA[key]
    if (s == null) return key
    if (vars) {
      for (const k in vars) {
        s = s.split('{' + k + '}').join(String(vars[k]))
      }
    }
    return s
  }, [dict])

  const value = useMemo(() => ({
    lang, setLang, t, dict,
    isFa: lang === 'fa',
    isEn: lang === 'en',
    num,
  }), [lang, setLang, t, dict])

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

export default I18nProvider
