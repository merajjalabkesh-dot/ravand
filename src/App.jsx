import React, { lazy, Suspense } from 'react'
import { Routes, Route, useLocation, Navigate } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AppProvider, useApp } from './lib/store'
import { I18nProvider } from './lib/i18n'
import ErrorBoundary from './components/ErrorBoundary'

// ============================================================
// مسیرها
// ------------------------------------------------------------
// /            پورتال لندینگ (بعد از اسکرول -> ریل محتوایی سایت)
// /site        صفحه اصلی سایت: معرفی، ویژگی‌ها، مخاطب، سوالات
// /download    دانلود exe ویندوز / apk اندروید / وب‌اپ
// /login       فرم ورود و ثبت‌نام (جدا از صفحه سایت)
// /app/*       صفحات اپ (نیازمند ورود)
// ============================================================

const Landing = lazy(() => import('./pages/Landing'))
const SiteHome = lazy(() => import('./pages/site/SiteHome'))
const Download = lazy(() => import('./pages/site/Download'))
const Login = lazy(() => import('./pages/Login'))
const Layout = lazy(() => import('./components/Layout'))
const Home = lazy(() => import('./pages/Home'))
const Today = lazy(() => import('./pages/Today'))
const Habits = lazy(() => import('./pages/Habits'))
const Reports = lazy(() => import('./pages/Reports'))
const Journal = lazy(() => import('./pages/Journal'))
const Wake = lazy(() => import('./pages/Wake'))
const Settings = lazy(() => import('./pages/Settings'))
import InstallGuide from './components/InstallGuide'

const AppLoader = () => (
  <div role="status" style={{ height: '100vh', display: 'grid', placeItems: 'center', background: '#0a0f1f', color: '#9fb7e0', fontSize: 14 }}>
    در حال بارگذاری…
  </div>
)

function Toast() {
  const { toastMsg } = useApp()
  return (
    <AnimatePresence>
      {toastMsg && (
        <motion.div id="toast" className="show"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}>
          {toastMsg}
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** نگهبان مسیرهای اپ: بدون ورود، به /login هدایت می‌شود */
function RequireAuth({ children }) {
  const { db } = useApp()
  const location = useLocation()
  if (!db.user || !db.user.first) {
    return <Navigate to="/login" state={{ from: location.pathname }} replace />
  }
  return children
}

/** وقتی کاربر وارد شده، صفحه ورود دیگر لازم نیست */
function RedirectIfAuthed({ children }) {
  const { db } = useApp()
  if (db.user && db.user.first) return <Navigate to="/app" replace />
  return children
}

function AppRoutes() {
  const { db } = useApp()
  const location = useLocation()
  const authed = !!(db.user && db.user.first)

  return (
    <>
      <Suspense fallback={<AppLoader />}>
        <AnimatePresence mode="wait" initial={false}>
          <Routes location={location} key={location.pathname}>
            {/* ---------- سایت عمومی ---------- */}
            <Route path="/" element={<Landing />} />
            <Route path="/site" element={<SiteHome />} />
            <Route path="/download" element={<Download />} />
            <Route path="/login" element={<RedirectIfAuthed><Login /></RedirectIfAuthed>} />

            {/* ---------- اپ ---------- */}
            <Route path="/app" element={<RequireAuth><Layout><Home /></Layout></RequireAuth>} />
            <Route path="/app/today" element={<RequireAuth><Layout><Today /></Layout></RequireAuth>} />
            <Route path="/app/habits" element={<RequireAuth><Layout><Habits /></Layout></RequireAuth>} />
            <Route path="/app/reports" element={<RequireAuth><Layout><Reports /></Layout></RequireAuth>} />
            <Route path="/app/journal" element={<RequireAuth><Layout><Journal /></Layout></RequireAuth>} />
            <Route path="/app/wake" element={<RequireAuth><Layout><Wake /></Layout></RequireAuth>} />
            <Route path="/app/settings" element={<RequireAuth><Layout><Settings /></Layout></RequireAuth>} />

            <Route path="*" element={<Navigate to={authed ? '/app' : '/'} replace />} />
          </Routes>
        </AnimatePresence>
      </Suspense>
      {authed ? <InstallGuide /> : null}
    </>
  )
}

export default function App() {
  return (
    <I18nProvider>
      <AppProvider>
        {/* ErrorBoundary قبلاً ساخته شده بود ولی هیچ‌جا وصل نبود، برای همین
            هر خطایی کل اپ را صفحهٔ سفید می‌کرد بدون هیچ پیامی. */}
        <ErrorBoundary>
          <AppRoutes />
          <Toast />
        </ErrorBoundary>
      </AppProvider>
    </I18nProvider>
  )
}
