// GET /api/app-version — آخرین نسخهٔ منتشرشدهٔ اپ.
// منبع داده همان فایل appVersion.json کنار این ماژول است که با
// scripts/sync-app-version.mjs از public/app-version.json آینه می‌شود.
import { Router } from 'express'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const FILE = path.join(__dirname, '..', 'appVersion.json')
const router = Router()

router.get('/', (_req, res) => {
  try {
    const data = JSON.parse(fs.readFileSync(FILE, 'utf8'))
    res.set('Cache-Control', 'no-store')
    res.json(data)
  } catch (e) {
    console.error('app-version error', e.message)
    res.status(500).json({ error: 'version-unavailable' })
  }
})

export default router
