// Data routes — save / load the whole app state blob (habits, days, journal, events, settings).
import { Router } from 'express'
import { loadData, saveData } from '../db.js'
import { requireAuth } from './auth.js'

const router = Router()
router.use(requireAuth)

router.get('/', (req, res) => {
  res.json(loadData(req.uid) || {})
})

router.put('/', (req, res) => {
  const data = req.body
  if (!data || typeof data !== 'object') return res.status(400).json({ error: 'invalid-data' })
  saveData(req.uid, data)
  res.json({ ok: true })
})

export default router