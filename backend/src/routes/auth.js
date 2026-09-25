// Auth routes: register, login (email+password), me, change-password, logout.
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import { getByEmail, getUser, getUserAuth, createUser, loadData, setPassword } from '../db.js'

const router = Router()
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

function sign(id) {
  return jwt.sign({ uid: id }, SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' })
}

function requireAuth(req, res, next) {
  const h = req.headers.authorization || ''
  if (!h.startsWith('Bearer ')) return res.status(401).json({ error: 'unauthorized' })
  try {
    const payload = jwt.verify(h.slice(7), SECRET)
    req.uid = payload.uid
    next()
  } catch { return res.status(401).json({ error: 'invalid-token' }) }
}

router.post('/register', async (req, res) => {
  const { email, password, name, last } = req.body || {}
  if (!email || !password) return res.status(400).json({ error: 'email-password-required' })
  if (String(password).length < 6) return res.status(400).json({ error: 'weak-password' })
  const norm = String(email).toLowerCase().trim()
  try {
    if (await getByEmail(norm)) return res.status(409).json({ error: 'email-already-in-use' })
    const id = crypto.randomUUID()
    const hash = await bcrypt.hash(String(password), 10)
    await createUser({ id, email: norm, name: (name || '').trim(), last: (last || '').trim(), passHash: hash })
    res.json({ token: sign(id), user: { id, email: norm, name: (name || '').trim() } })
  } catch (e) {
    console.error('register error', e && e.message, e && e.stack)
    res.status(500).json({ error: 'server-error', detail: e && e.message })
  }
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {}
  const norm = String(email || '').toLowerCase().trim()
  try {
    const u = await getByEmail(norm)
    if (!u || !u.pass_hash) return res.status(401).json({ error: 'user-not-found', hint: 'با این ایمیل اکانتی ساخته نشده.' })
    const ok = await bcrypt.compare(String(password || ''), u.pass_hash)
    if (!ok) return res.status(401).json({ error: 'wrong-password', hint: 'رمز عبور اشتباه است.' })
    res.json({ token: sign(u.id), user: { id: u.id, email: u.email, name: u.name || '' } })
  } catch (e) {
    console.error('login error', e && e.message, e && e.stack)
    res.status(500).json({ error: 'server-error', detail: e && e.message })
  }
})

// OTP (email) temporarily disabled — will be replaced by SMS gateway later.
router.post('/request-otp', (_req, res) => res.status(501).json({ error: 'otp-disabled' }))

// OTP (email) temporarily disabled — will be replaced by SMS gateway later.
router.post('/verify-otp', (_req, res) => res.status(501).json({ error: 'otp-disabled' }))

router.get('/me', requireAuth, async (req, res) => {
  try {
    const u = await getUser(req.uid)
    if (!u) return res.status(404).json({ error: 'user-not-found' })
    const data = (await loadData(req.uid)) || {}
    res.json({ user: { id: u.id, email: u.email, name: u.name || '' }, data })
  } catch (e) {
    console.error('me error', e.message)
    res.status(500).json({ error: 'server-error' })
  }
})

// تغییر رمز عبور — رمز فعلی باید درست باشد تا کسی که وارد اکانت شده، رمز را عوض نکند
router.post('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, newPassword } = req.body || {}
  if (!currentPassword || !newPassword) return res.status(400).json({ error: 'passwords-required' })
  if (String(newPassword).length < 6) return res.status(400).json({ error: 'weak-password' })
  if (String(currentPassword) === String(newPassword)) return res.status(400).json({ error: 'same-password' })
  try {
    const u = await getUserAuth(req.uid)
    if (!u || !u.pass_hash) return res.status(404).json({ error: 'user-not-found' })
    const ok = await bcrypt.compare(String(currentPassword), u.pass_hash)
    if (!ok) return res.status(401).json({ error: 'wrong-password' })
    const hash = await bcrypt.hash(String(newPassword), 10)
    await setPassword(req.uid, hash)
    res.json({ ok: true })
  } catch (e) {
    console.error('change-password error', e && e.message, e && e.stack)
    res.status(500).json({ error: 'server-error', detail: e && e.message })
  }
})

router.post('/logout', (_req, res) => res.json({ ok: true }))

export { router, requireAuth }