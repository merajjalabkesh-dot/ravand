// Data routes — save / load the whole app state blob (habits, days, journal, events, settings).
import { Router } from 'express'
import { loadData, saveData } from '../db.js'
import { requireAuth } from './auth.js'

const router = Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  try {
    res.json((await loadData(req.uid)) || {})
  } catch (e) {
    console.error('data get error', e.message)
    res.status(500).json({ error: 'server-error' })
  }
})

router.put('/', async (req, res) => {
  const data = req.body
  if (!data || typeof data !== 'object') return res.status(400).json({ error: 'invalid-data' })
  try {
    await saveData(req.uid, data)
    res.json({ ok: true })
  } catch (e) {
    console.error('data put error', e.message)
    res.status(500).json({ error: 'server-error' })
  }
})

export default router