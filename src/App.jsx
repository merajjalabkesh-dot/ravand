import React, { lazy, Suspense, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { AppProvider, useApp } from './lib/store'

// Lazy-load heavy screens so the login page isn't slowed down by the whole app.
const Landing = lazy(() => import('./pages/Landing'))
const Layout = lazy(() => import('./components/Layout'))
const Home = lazy(() => import('./pages/Home'))
const Today = lazy(() => import('./pages/Today'))
const Habits = lazy(() => import('./pages/Habits'))
const Reports = lazy(() => import('./pages/Reports'))
const Journal = lazy(() => import('./pages/Journal'))
const Wake = lazy(() => import('./pages/Wake'))
const Settings = lazy(() => import('./pages/Settings'))

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

function AppInner() {
  const { db } = useApp()
  const location = useLocation()
  return (
    <>
      <Suspense fallback={<div role="status" style={{ height: '100vh', display: 'grid', placeItems: 'center', background: '#0a0f1f', color: '#9fb7e0', fontSize: 14 }}>در حال بارگذاری…</div>}>
        {(!db.user || !db.user.first) ? <Landing /> : (
          <Layout>
            <AnimatePresence mode="wait" initial={false}>
              <Routes location={location} key={location.pathname}>
                <Route path="/" element={<Home />} />
                <Route path="/today" element={<Today />} />
                <Route path="/habits" element={<Habits />} />
                <Route path="/reports" element={<Reports />} />
                <Route path="/journal" element={<Journal />} />
                <Route path="/wake" element={<Wake />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </AnimatePresence>
          </Layout>
        )}
      </Suspense>
      <Toast />
    </>
  )
}

export default function App() {
  return <AppProvider><AppInner /></AppProvider>
}