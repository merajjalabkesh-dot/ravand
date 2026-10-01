# پرامپت فیلم معرفی روند — بر اساس پرامپت @ik_builds (Skillry)

> منبع: [skillry.dev/ai-videos/opus-5-5/ik-builds-585923](https://skillry.dev/ai-videos/opus-5-5/ik-builds-585923)
> ویدیوی @ik_builds — «پرامپتی که این ویدیو را یک‌شات ساخت» (Opus 5.5, effort: medium)
>
> این نسخه، همان پرامپت چهاربخشی است که با داده‌های واقعی پروژهٔ روند
> پر شده و برای ساخت `motion/ravand-launch.html` استفاده شد.

---

## پرامپت (نسخهٔ پرشده با داده‌های روند)

```text
Create a 15s motion-graphics film explaining Ravand (روند) —
a Persian habit-tracking app. HyperFrames + GSAP, no voiceover, no footage.

STYLE
Paper-light canvas, marker notes that draw on, real physics,
huge kinetic type, hard light/dark scene switches,
a new idea every 1.5–2 seconds, a sound on every hit.

COPY
Read the positioning docs first (src/config/site.config.js), then:
- ONE_LINER: «عادت‌هایت را بساز، روندت را ببین.»
- AUDIENCE: دانش‌آموز و کنکوری، ورزشکار و بیدارخیز، کارمند پرمشغله، کسی که قبلاً اپ عادت را رها کرده
- WHAT_IT_DOES: ثبت کار روزانه + عادت خوب/بد + ژورنال شب + تقویم شمسی + محاسبهٔ خواب
- RULE: «Name what the product learns, never the abstraction.»
  → معادل فارسی: نام‌های مشخص را بگو، نه مفهوم‌های کلی:
  «فقط تیک می‌زنی، یا داری بهتر می‌شوی؟» (نه «بهبود عملکرد»)،
  «روزهای پاک: ۳۸» (نه «پیشرفت مطلوب»)، «چرخه‌های ۹۰ دقیقه» (نه «بهینه‌سازی خواب»)

RULES
- No player chrome (scrubber, timecode, fps, headers).
- No animator jargon on screen — no «squash», «stagger», «easing».
  Every word speaks to the buyer.
- No invented results: no %, multipliers, customer names or figures.
  (استثنا: شمارندهٔ «روزهای پاک» که یک قابلیت واقعی نمایشی است، نه ادعای نتیجه)
- BANNED_WORDS: بهترین، انقلابی، هوشمند، بی‌نظیر، فوق‌العاده، متفاوت‌ترین
- Logo: the real mark (three ascending rounded squares,
  brand/ravand-mark.svg), never a boxed logo.
- Wordmark font: Vazirmatn 900 (فونت برند) — نه فونت انگلیسی.

CRAFT
COLORS
- Canvas: #f7f3ea (paper) / Ink: #171a2b
- Accent 1: #8b5cf6 (بنفش برند — تم midnight)
- Accent 2: #43e8a8 (نعنایی برند)
- Dark mode: #0d0f1c (پس‌زمینهٔ واقعی تم midnight، نه مشکی خالص)
FONTS
- Vazirmatn 400/500/700/900 (فونت برند)
- Notes in marker style drawn via stroke-dashoffset
ANIMATION
- Genuine easing, squash/stretch, stagger, overlap, onion skin,
  smear, follow-through.
- Set every from-state at t=0 so the timeline is seek-safe.
- Never cover an exit.
- One primary move per transition; avoid generic push/slide/rotate-swing.
AUDIO
- Music in sections — drums drop out on the dark switch and while the
  ball is airborne, then slam back on the type and logo.
- SFX: pops, pen scribbles, whooshes, a logo sub-hit.
- CC0 or generated audio only, sources logged.
- Master to -14 LUFS / -2 dBTP, re-measure after AAC encode.
```

---

## چرا این ویدیو (و نه showreel @gabrielbuzziv)

| معیار | پرامپت @ik_builds | پرامپت showreel |
|---|---|---|
| هدف | معرفی محصول واقعی | نمایش مهارت انیماتور (رزومه) |
| کپی | از مستندات positioning واقعی محصول می‌خواند | خودنمایانه |
| قواعد برند | رنگ/فونت/لوگوی واقعی الزامی | آزاد |
| محدودیت ادعا | «no invented results» — مناسب اپ واقعی | ندارد |
| خروجی | مستقیم قابل استفاده در لندینگ/کانال | برای GitHub رزومه |

پروژهٔ روند یک محصول واقعی با برند کامل است (لوگو، تم، فونت، کپی) —
پس پرامپت محصولمحورِ @ik_builds تناسب مستقیم دارد.

---

## نکات فنی پیاده‌سازی ( ravand-launch.html )

- **GSAP 3.12** از cdnjs + تایم‌لاین تکی `TL` — seek-safe (همهٔ from-stateها در t=0).
- **صدا کاملاً سینتیز** با WebAudio (oscillator/noise) — بدون فایل خارجی، پس بدون مسئلهٔ مجوز؛ زنجیرهٔ مستر با compressor به‌جای نرمال‌سازی LUFS (نزدیک‌ترین معادل عملی).
- **دو صحنه**: کاغذی روشن (چک‌لیست + سؤال) → کات سخت به تیره (برند + جدول + الگوها + فینال) — طبق قانون «hard light/dark switches».
- **قانون صدا**: درام‌ها هنگام کات تیره و پرواز توپ حذف، هنگام فرود و تایپوگرافی اسلم — عین قاعدهٔ پرامپت.
- **لوگوی واقعی**: همان SVG سه‌مربع صعودی `brand/ravand-mark.svg`؛ مربع‌های صحنهٔ تیره همان مارک‌اند که در فینال روی پله‌ها می‌افتند (one primary move: logo → stairs).
- **RTL کامل** و اعداد فارسی (`fa()`).
- رزولوشن قاب ۱۲۸۰×۷۲۰، اسکیل ریسپانسیو، `window.__film` برای seek/پخش در کنسول.
- نکته: «روزهای پاک: ۳۸» در واقعیت صحنهٔ نمایشی است — شمارندهٔ انیمیشنی قابلیت، نه ادعای کاربر واقعی (سازگار با «no invented results»).

## ضبط خروجی

برای خروجی ویدیویی: پخش → `پخش صفحه` (screen-record) با صدای سیستم، یا از
`window.__film.seek(t)` برای فریم‌بندی دقیق استفاده کن. ۱۵ ثانیه، ۱۲۸۰×۷۲۰.
