import React from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './styles/index.css'
import './styles/site.css'

// Entry point مخصوص اپلیکیشن دسکتاپ/موبایل (بدون لندینگ/سایت)
// مستقیماً اپ را می‌سازد؛ React Router خودش لاگین/اپ را مدیریت می‌کند
createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)