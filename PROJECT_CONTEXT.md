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
│   │   ├── firebaseService.js  # Optional Firebase auth/sync
│   │   ├── apiClient.js    # Custom backend (Express + PostgreSQL)
│   │   └── seo.js          # Page meta helper
│   ├── config/
│   │   ├── themes.js       # 6 themes (midnight, ocean, berry, lilac, cream, pinky)
│   │   ├── site.config.js  # All marketing copy (SITE object)
│   │   └── firebase.js     # Firebase config (optional)
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
│   │   └── mailer.js       # Nodemailer (unused currently)
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
- [ ] Firebase sync optional — not used in production
- [ ] Email mailer configured but unused
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

### Known state
- Deploy target: Cloudflare Pages project served at `https://ravand-9rq.pages.dev/` (git-connected → push to `main` deploys).
- Deployed build was stale as of 2026-09-30: rendered 842px-wide desktop layout in a 393px viewport (509 overflowing elements, 2/3-col grids). Local build at 393px: 393px scrollW, single-column, 2 overflow items (SVG-internal, harmless).

---

> **Reminder:** After every meaningful change (new feature, bug fix, config change, refactor), update this file. Keep it accurate so the next session starts with truth.