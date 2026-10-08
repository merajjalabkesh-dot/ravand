# PROJECT CONTEXT — Roznegar (روند / Ravand)

> **Rule:** This file is the single source of truth for project state. Read it before starting any work. Update it after every significant change — the file must always be current.

---

## 📦 Project Overview

| Property | Value |
|----------|-------|
| **Name** | Roznegar React (brand: **Ravand / روند**) |
| **Type** | React + Vite PWA — runs as Web, Desktop (Electron/Tauri), Mobile (Capacitor/Android) |
| **Package Manager** | npm |
| **Node Version** | ≥22.9.0 (backend) |
| **Default Language** | Persian (fa) — English (en) supported |
| **Default Theme** | `midnight` (dark) |
| **Repository** | Git, branch `main` → `origin/main` |
| **Deploy Target** | Cloudflare Pages (site), Railway (backend), Tauri/Capacitor builds |

---

## 🏗 Architecture

```
roznegar-react/
├── src/                    # Frontend (React + Vite)
│   ├── App.jsx             # Routes, auth guards, providers
│   ├── main.jsx            # Web/PWA entry (with Landing)
│   ├── main-app.jsx        # Desktop/Mobile entry (direct to App)
│   ├── components/
│   │   ├── ui/             # GlyphPortal, PortalBackground, etc.
│   │   ├── site/           # Marketing site sections (Hero, Features, Compare, etc.)
│   │   ├── Layout.jsx      # App shell: sidebar + mobile tab bar
│   │   └── ...             # ErrorBoundary, InstallGuide, etc.
│   ├── pages/
│   │   ├── Landing.jsx     # GlyphPortal landing with scroll transition
│   │   ├── Login.jsx       # Auth form
│   │   ├── Home.jsx        # Dashboard (stats + heatmap + tasks + habits)
│   │   ├── Today.jsx       # Day view: tasks, habits, journal, sleep
│   │   ├── Habits.jsx      # Habit management (create, edit, schedule)
│   │   ├── Reports.jsx     # Weekly/Monthly/Quarterly pattern tables
│   │   ├── Journal.jsx     # Mood map + entries
│   │   ├── Wake.jsx        # Sleep/wake scheduling + chart
│   │   ├── Settings.jsx    # Theme, accent, font, notifications, backup
│   │   └── site/           # SiteHome, Download
│   ├── lib/
│   │   ├── store.jsx       # Global state (Context + localStorage + sync)
│   │   ├── i18n.jsx        # i18n provider (fa/en, RTL/LTR, fonts)
│   │   ├── apiClient.js    # Custom backend (Express + PostgreSQL)
│   │   └── seo.js          # Page meta helper
│   ├── config/
│   │   ├── themes.js       # 6 themes (midnight, ocean, berry, lilac, cream, pinky)
│   │   └── site.config.js  # All marketing copy (SITE object)
│   ├── locales/            # fa.js, en.js (translation dictionaries)
│   ├── hooks/              # Custom hooks
│   ├── styles/
│   │   ├── index.css       # App shell, components, theming variables
│   │   ├── site.css        # Landing/site specific styles
│   │   ├── glass.css       # Glassmorphism utilities
│   │   └── app-shell.css   # Native app shell styles
│   └── utils/              # Helpers
├── backend/                # Express + PostgreSQL API
│   ├── src/
│   │   ├── server.js       # Express app, routes, static serving
│   │   ├── db.js           # PostgreSQL pool + schema (users, user_data)
│   │   ├── routes/
│   │   │   ├── auth.js     # register, login, me, change-password
│   │   │   └── data.js     # GET/PUT /api/data (full blob sync)
│   └── package.json
├── src-tauri/              # Tauri desktop config
├── android/                # Capacitor Android project
├── electron/               # Electron main process
├── dist/                   # Vite build output (gitignored)
├── public/                 # Static assets (manifest, icons)
├── scripts/
│   └── generate-sw.mjs     # Service worker generator
├── index.html              # Web/PWA entry (loads main.jsx)
├── index-site.html         # Site-only entry (loads main.jsx)
├── main-app.jsx            # Desktop/Mobile entry
├── vite.config.js          # Dual entry: main + site
├── capacitor.config.json   # Capacitor config
└── package.json
```

---

## 🔑 Key Concepts

### Dual Entry Points
- **`index.html` + `main.jsx`** → Web/PWA: shows **Landing** page at `/`, then `/site`, `/download`, `/login`, `/app/*`
- **`index.html` + `main-app.jsx`** → Desktop (Electron/Tauri) & Mobile (Capacitor): skips landing, goes straight to **App** (auth → `/app`)

### State Management (`src/lib/store.jsx`)
Single `AppProvider` context holds **entire app state** in `db` object:

```js
{
  user: { id, email, first, last } | null,
  habits: [{ id, name, color, days: [0-6], type: 'good'|'bad', since, target }],
  events: [{ id, name, date: 'MM-DD'|'YYYY-MM-DD', recurring: bool }],
  days: { 'YYYY-MM-DD': { habits: {habitId: bool}, tasks: [{id,text,done}], journal: {mood: 1-5, text}, wake, sleep } },
  settings: { accent, theme, fontScale, sound, notify, wakeGoal, sleepGoal, wakeNotify, curWake, curSleep, planStart }
}
```

**Persistence:**
- `localStorage` key: `rg_data_v2` (offline-first)
- Backend sync: `pushDb()` on every mutation (POST `/api/data`)
- On auth: `me()` pulls remote data, merges (server wins)

### Theming (`src/config/themes.js`)
6 themes, each defines: `bg`, `bg2`, `glass`, `glassBorder`, `ink`, `inkMid`, `muted`, `accent`, `accent2`, `accentWarm`, `glow`, `mode` (dark/light).
Applied via CSS variables in `AppProvider` effect → updates `:root` and `body`.

### i18n (`src/lib/i18n.jsx`)
- Default `fa` (RTL), optional `en` (LTR)
- Loads `Vazirmatn` (fa) or `Inter` (en) from Google Fonts
- `setActiveLang()` updates module-level `activeLang` used by `store.jsx` utilities (`num`, `faDate`, `monthName`, `moodWord`)

### Routing (`src/App.jsx`)
```js
/              → Landing (GlyphPortal + content rail)
/site          → Marketing site (SiteHome)
/download      → Download cards
/login         → Login/Register (redirects to /app if authed)
/app           → Home (dashboard)
/app/today     → Day view
/app/habits    → Habit management
/app/reports   → Pattern tables
/app/journal   → Mood map + entries
/app/wake      → Sleep scheduling
/app/settings  → Preferences
```
Guards: `RequireAuth` (redirects to `/login`), `RedirectIfAuthed` (redirects to `/app`)

---

## 🧩 Major Components

| Component | Purpose |
|-----------|---------|
| `GlyphPortal` | Animated text portal on landing (scroll → reveals content rail) |
| `Layout` | App shell: fixed sidebar (desktop) / bottom tab bar (mobile ≤700px) |
| `Heatmap` | GitHub-style contribution grid (used in Home, Live, Reports) |
| `JalaliDatePicker` | Persian calendar picker (Shamsi + Gregorian fallback) |
| `SleepCycle` | Sleep time calculator with 90-min cycles |
| `InstallGuide` | PWA install prompt (shows once after auth) |
| `SiteHeader` / `SiteFooter` | Marketing site header/footer |
| `Sections.jsx` exports | Hero, About, Live, Features, Compare, Audience, Testimonials, Pricing, DownloadCards, Faq, Channels, Steps, CtaBand |

---

## 🎨 Styling System

- **CSS Variables** for all colors, spacing, radii → defined in `:root` + overridden per theme
- **Glassmorphism**: `--glass`, `--glass-border`, `--glass-hover` + `backdrop-filter: blur()`
- **Responsive breakpoints**: `@media (max-width: 920px)`, `700px`, `600px`, `520px`, `360px`, `430px`
- **Mobile-first tab bar** (`.app-tabbar`) replaces sidebar ≤700px
- **Reduced motion**: `@media (prefers-reduced-motion: reduce)` disables all transitions

---

## 🔌 Backend API

**Base URL:** `https://ravand-production.up.railway.app` (via `VITE_API_URL`)

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/register` | POST | ❌ | `{email,password,name,last}` → `{token,user}` |
| `/api/auth/login` | POST | ❌ | `{email,password}` → `{token,user}` |
| `/api/auth/me` | GET | ✅ | Returns `{user, data}` (full blob) |
| `/api/auth/change-password` | POST | ✅ | `{currentPassword,newPassword}` |
| `/api/auth/logout` | POST | ✅ | No-op (client clears token) |
| `/api/data` | GET | ✅ | Load user data blob |
| `/api/data` | PUT | ✅ | Save user data blob (merge) |

**Auth:** JWT in `Authorization: Bearer <token>` header. Token stored in `localStorage.rg_token`.

**Database:** PostgreSQL (Neon/Railway) — tables `users`, `user_data`. Schema auto-created on first connection.

---

## 📱 Native Builds

| Target | Command | Output |
|--------|---------|--------|
| Web/PWA | `npm run build` | `dist/` (index.html + assets) |
| Desktop (Tauri) | `npm run tauri:build` | `.msi` / `.dmg` / `.AppImage` |
| Desktop (Electron) | `npm run electron:build` | `.exe` / `.dmg` / `.AppImage` |
| Android (Capacitor) | `npm run cap:apk` | `.apk` / `.aab` |
| Dev (Web) | `npm run dev` | Vite dev server `:5175` |
| Dev (Tauri) | `npm run tauri:dev` | Tauri + Vite |
| Dev (Electron) | `npm run electron:dev` | Electron + Vite |

**Capacitor sync:** `npm run cap:sync` (builds + copies `index-app.html` → `index.html` + `cap sync`)

---

## 📦 Data Flow Summary

```
User Action
    │
    ▼
mutate(fn) / save(next)  ──▶  localStorage (rg_data_v2)  ──▶  pushDb() ──▶  POST /api/data
    │                                                       │
    │                              (if authed)              │
    └───────────────────────────────────────────────────────┘
                                                      │
                                                      ▼
                                              PostgreSQL (user_data)
                                                      │
                                                      ▼
                                          Next login: me() pulls + merges
```

**Offline-first:** All reads from localStorage. Network only for sync.

---

## 🗂 Important Files to Know

| File | Why It Matters |
|------|----------------|
| `src/lib/store.jsx` | Global state, persistence, sync, all utilities (date, jalali, mood, events) |
| `src/App.jsx` | Routing, auth guards, providers |
| `src/components/Layout.jsx` | App shell (sidebar + mobile tab bar) |
| `src/pages/Landing.jsx` | GlyphPortal landing with scroll-driven background transition |
| `src/config/themes.js` | All theme definitions |
| `src/config/site.config.js` | All marketing copy (single source of truth) |
| `src/styles/index.css` | Core design system (variables, components, layout) |
| `src/styles/site.css` | Landing/site specific styles |
| `backend/src/db.js` | PostgreSQL schema + queries |
| `backend/src/routes/auth.js` | Auth endpoints (JWT, bcrypt) |
| `vite.config.js` | Dual entry config (main + site) |

---

## 🧪 Development Notes

- **Font loading:** Landing waits for `Vazirmatn` before mounting `GlyphPortal` (see `Landing.jsx:51-71`)
- **Service worker:** Generated by `scripts/generate-sw.mjs` after build, caches `index.html`, assets, fonts
- **PWA manifest:** `public/manifest.json` (name: "روند", short_name: "روند")
- **Icons:** `public/icon-192.png`, `icon-512.png` + `android-res/` for Capacitor
- **No tests** currently — manual QA via `npm run dev` / `npm run tauri:dev`
- **Linting:** None configured — rely on Vite/React errors

---

## 🐛 Known Issues / TODOs

- [ ] OTP/SMS auth disabled (backend returns 501)
- [ ] Tests missing
- [ ] No CI/CD pipeline
- [ ] TypeScript not adopted (plain JS + JSDoc)

---

## 📝 Update Log

| Date | Change | Author |
|------|--------|--------|
| 2026-09-30 | Created PROJECT_CONTEXT.md from codebase inspection | AI Assistant |
| 2026-09-30 | Mobile landing fix: shorter portal scroll on ≤700px (`Landing.jsx` scrollLen), bigger touch heatmap cells + landing-front sizing in `site.css` mobile block, removed dead `--gp-length` CSS. Desktop verified unchanged (1440px: 3-col grids, nav intact). Root cause of "mobile = desktop" on Cloudflare: deployed build `ravand-9rq.pages.dev` was stale (old `main-Bdugca6d.js`, missing `@media 1100px`) — redeploy fixes it | AI Assistant |
| 2026-09-30 | **Desktop restored to the pinned deploy** `52a83844.ravand-9rq.pages.dev`. Ref commit identified by rebuilding candidates and hashing `dist/assets/site-*.css`: `site.css` = `246b1f8`-era (dark theme, accent `#8b5cf6`, no `@media 1100px`), `site.config.js` content = `b20b0eb` (plan price ۷۰٬۰۰۰ / badge «پیشنهاد ما» + old FAQ). Applied: `site.css` ← `05b3f13` (ref desktop + full mobile query) minus `height:100%` on `.site-hero`, re-applied the e5f8759 mobile additions; `site.config.js` ← `b20b0eb`. Verified: 1440px/1024px byte-level near-identical to ref (H=11208 both, 0 diff px at hero, 0.34% only = button gradient animation phase); 393px keeps its own mobile layout (393px scrollW, single column, ref itself overflows there with 509 elements). `index.css`/`Landing.jsx`/locales left at HEAD — they are app/mobile-side, ref had no diff in `src/components/site/` | AI Assistant |
| 2026-10-01 | Pricing: monthly plan `price: '۰'` + `oldPrice: '۷۰٬۰۰۰'` (crossed out, ۰ plain) in `site.config.js`, FAQ line updated — applied to both desktop and mobile; verified at 393px and 1440px | AI Assistant |
| 2026-10-01 | **APK opens the app, not the site** (user installed `ravand-release-v1.0.apk` and got the light-blue landing: `App.jsx` maps `#/` → `Landing` and the WebView starts with an empty hash). `index.html` now exposes `window.__rgIsNative()` (Tauri internals \|\| `window.Capacitor` \|\| WebView origin `localhost`/`tauri.localhost` — origin-based, so it works even before the Capacitor bridge injects) and `window.__rgNativeStart()`, which rewrites empty/`#/`/`#/site`/`#/download` → `#/login` in native builds only (also on `hashchange`): the APK is app-only, login panel first, and `RedirectIfAuthed` forwards signed-in users to `/app`. Web verified unchanged on the preview (`__IS_NATIVE_APP__ === false`, landing renders; forcing the flag navigates to `#/login` with the password form). Predicate unit-tested for APK WebView / Tauri-Windows / pages.dev / vite:5173 / preview:4173; APK rebuilt (3.25 MB) with the code confirmed inside `assets/public/index.html` | AI Assistant |
| 2026-10-01 | **APK build working end-to-end** (it had always failed): added `@capacitor/core|cli|android@8.5.2` to `package.json` (`cap` binary was missing entirely), rewrote the `cap:*` scripts (they copied a non-existent `dist/index-app.html`) and added `cap:apk` / `cap:apk:release`. **Root causes of the user's failed attempts:** (1) no Capacitor CLI, (2) broken scripts, (3) machine only has **Java 25** → Gradle 8.14 dies with `Unsupported class file major version 69` — fixed by downloading Temurin JDK 21 to `~/.jdks/jdk-21.0.12.1+1` and pinning `org.gradle.java.home` in `android/gradle.properties`. **100 MB APK** was caused by `public/downloads/{Ravand-Setup.exe,app-debug.apk}` being copied in — new `scripts/prune-cap-dist.mjs` strips `dist/downloads` before every `cap sync`. Release is now signed with a new keystore (`android/app/ravand-release.jks`, credentials in `android/keystore.properties`, both gitignored — back them up). Outputs renamed to `ravand-{debug,release}-v1.0.apk` because OneDrive/a stale process held `app-debug.apk` open and in-place overwrite corrupted it (99 MB gap). **Result:** `android/app/build/outputs/apk/release/ravand-release-v1.0.apk` = 3.25 MB, `apksigner` verifies (v2), package `app.ravand.app`, label «روند», minSdk 24, ships current bundle `main-CsM7YllJ.js`, no downloads junk; `npm run cap:apk` / `npm run cap:apk:release` both green. Also hardened `index.html`: `__IS_NATIVE_APP__` re-polls for 5 s so it flips true if Capacitor injects its bridge after the inline script. `BUILD-TOOLS.md` updated with the working commands. `android/` remains gitignored | AI Assistant |
| 2026-10-01 | **Login/signup fits and scrolls (apk + web)** — user: in the APK the «ورود/ثبت‌نام» button sat below the fold and could not be pressed; in the web app's signup tab only name/family-name were visible (email/password unreachable, page did not scroll). Fixes: (1) `.login-page` was `grid; place-items:center` with no `overflow` — centered overflow gets clipped and is unscrollable; now flex + `justify-content: safe center` + `overflow-y: auto` + `env(safe-area-inset-*)` padding, so a tall card starts at the top and scrolls instead of sticking off-screen. (2) New `@media (max-width: 560px), (max-height: 780px)` compaction block (tighter card padding, margins, labels, inputs; logo `.82` scale; h1 29→23px) — at 393×852 the signup card measures 61..791 with all 4 fields + button visible without scrolling. (3) `AndroidManifest.xml` activity gained `android:windowSoftInputMode="adjustResize"` (Android's default `adjustPan` is what hid the button behind the soft keyboard in the APK). Verified in the preview: 393×852 signup fully visible + button hit-testable; 360×640 overflows 136px → scrolls to a tappable button; login tab 2/2 fields everywhere; desktop 1440×900 unchanged (38/32/30 padding, 29px h1); 1280×800 now scrollable rather than clipped. APK+debug rebuilt — `site-qJOp5LoB.css` present in both, `aapt dump xmltree` shows `windowSoftInputMode … 0x10` (adjustResize) | AI Assistant |
| 2026-10-01 | **Site APK download link fixed** — the user copied the signed release to `public/downloads/ravand.apk` (3,406,861 bytes), but `site.config.js` still linked `/downloads/Ravand.apk`; Cloudflare Pages is case-sensitive → 404. Changed to `/downloads/ravand.apk` and updated `public/downloads/README.md`. Build verified: `dist/downloads/ravand.apk` present, bundle grep shows `/downloads/ravand.apk` (no `Ravand.apk` remains), and sha256 `3c629d87…` of the published file is byte-identical to `android/app/build/outputs/apk/release/ravand-release-1.0.0.apk`. Caveat: `.gitignore` excludes `public/downloads/*.exe`, so the Windows-installer link still 404s on the deployed site | AI Assistant |
| 2026-10-01 | **Removed the obsolete download notices from `/download`** — user: exe and apk exist now, so drop the two cards «نسخه‌ها هنوز ساخته نشده‌اند» and «وب‌اپ همین حالا کار می‌کند». Deleted the `<section className="dl-note">` block in `src/pages/site/Download.jsx` and the `.dl-note*` rules in `site.css` (no other component used them); `public/downloads/README.md` now states that `public/downloads/*.{apk,exe,dmg}` are gitignored and require `git add -f` to ship. Build verified: neither `dl-note` nor «نسخه‌ها هنوز ساخته» survives anywhere in `dist`, and `/downloads/ravand.apk` is still linked. Open issue found while checking: `Ravand-Setup.exe` (99.5 MB) is **not** on the server — it is gitignored and also over Cloudflare Pages' 25 MB per-file limit, so the Windows card currently resolves to the SPA fallback (HTML) instead of the installer | AI Assistant |
| 2026-10-01 | **Windows installer via GitHub Releases** — the 99.5 MB `Ravand-Setup.exe` exceeded Cloudflare Pages' 25 MB/file limit and was gitignored, so the download link served the SPA fallback. Created release `v1.0.0` via `gh` CLI and uploaded both artifacts: `Ravand-Setup.exe` and `ravand.apk`. Updated `site.config.js`: Windows `href` → `https://github.com/merajjalabkesh-dot/ravand/releases/download/v1.0.0/Ravand-Setup.exe`, Android `href` → `.../ravand.apk`. Build verified in `dist/assets/seo-DDNJjeQJ.js`. Both URLs now return the real binaries (tested HEAD 200) | AI Assistant |
| 2026-10-01 | **Add-to-Home-Screen tutorial = centered modal** matching the user's reference screenshot: rewrote `src/components/InstallGuide.jsx` (teal check circle, dashed-border card, Persian-numbered steps ۱/۲/۳ with inline iOS-style chips `[[share]]` / `[[addhome]]` / `[[add]]`, note box, pill «متوجه شدم» **below** the card), restyled `.install-*` in `index.css`, updated `install.step1-3` in `locales/fa.js`+`en.js`. **Root cause why the guide never appeared:** `index.html` hardcoded `window.__IS_NATIVE_APP__ = true` for every build, so `InstallGuide`, `Settings.canShowInstallGuide()` and the Login back-button were all permanently disabled on the web — now `!!(window.__TAURI_INTERNALS__ \|\| window.Capacitor)`. Dismiss key bumped to `rg_install_dismiss_v2` so users see the new tutorial once. Deleted the interim `AddToHomeTutorial.jsx` + `AtsBanner` wiring in `Layout.jsx` (duplicates) and their dead `.ats-banner`/`.tutorial-*` CSS. **Also fixed:** an unterminated CSS comment (`/* نوار پایین موبایل`, introduced in `b4dfca0`) swallowed the `@media (max-width:700px)` opener, making `.sidebar{display:none}` unconditional — the desktop app sidebar was vanishing; bucket analysis now reports final depth 0, and desktop sidebar verified `display:flex; 250px` with tabbar hidden. Verification: iPhone-Safari UA at `#/app` → modal appears (360px card, dashed border, ۱/۲/۳, chips, pill button), dismiss persists across reload, `rg:open-install-guide` reopens it; desktop UA → no modal; landing unchanged (hero present, no overflow, ۷۰٬۰۰۰/۰ pricing) | AI Assistant |

### Known state
- Deploy target: Cloudflare Pages project served at `https://ravand-9rq.pages.dev/` (git-connected → push to `main` deploys).
- Deployed build was stale as of 2026-09-30: rendered 842px-wide desktop layout in a 393px viewport (509 overflowing elements, 2/3-col grids). Local build at 393px: 393px scrollW, single-column, 2 overflow items (SVG-internal, harmless).

---

> **Reminder:** After every meaningful change (new feature, bug fix, config change, refactor), update this file. Keep it accurate so the next session starts with truth.