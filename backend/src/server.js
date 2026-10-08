// Roznegar backend — Express + PostgreSQL (Neon/Railway), Auth (JWT), data sync.
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import path from 'node:path'
import fs from 'node:fs'
import { fileURLToPath } from 'node:url'
import { router as authRouter } from './routes/auth.js'
import dataRouter from './routes/data.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const app = express()
const PORT = +(process.env.PORT || 4000)

// Railway پشت پروکسی است؛ بدون این، req.ip آدرس پروکسی می‌شود و محدودیت نرخ
// عملاً همه را یک کاربر می‌بیند. عدد ۱ یعنی فقط به اولین hop اعتماد کن.
app.set('trust proxy', 1)

// CORS: با env قابل تنظیم. اگر CORS_ORIGINS ست باشد فقط همان‌ها مجازند
// (با کاما جدا شوند)؛ وگرنه رفتار قبلی (باز) حفظ می‌شود تا سایت فعلی نشکند.
const corsOrigins = (process.env.CORS_ORIGINS || '').split(',').map((s) => s.trim()).filter(Boolean)
app.use(cors(corsOrigins.length ? { origin: corsOrigins, credentials: true } : { origin: true, credentials: true }))
app.use(express.json({ limit: '12mb' })) // journal images as dataURLs

app.get('/health', (_req, res) => res.json({ ok: true }))

app.use('/api/auth', authRouter)
app.use('/api/data', dataRouter)

// Optional: serve the built frontend (../dist) from the same server
const front = process.env.FRONTEND_DIR || path.join(__dirname, '..', '..', 'dist')
if (fs.existsSync(path.join(front, 'index.html'))) {
  app.use(express.static(front))
  app.get('*', (_req, res) => res.sendFile(path.join(front, 'index.html')))
}

app.listen(PORT, () => console.log(`[roznegar] backend on :${PORT}`))