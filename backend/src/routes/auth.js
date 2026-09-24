// Auth routes: register, login (email+password), request OTP, verify OTP, me, logout.
import { Router } from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import { getByEmail, getUser, createUser, setPassword, setOtp, loadData } from '../db.js'
import { sendOtpEmail } from '../mailer.js'

const router = Router()
const SECRET = process.env.JWT_SECRET || 'dev-secret-change-me'

function sign(id) {
  return jwt.sign({ uid: id }, SECRET, { expiresIn: process.env.JWT_EXPIRES || '7d' })
}

function otpCode() {
  return String(Math.floor(100000 + Math.random() * 900000)) // 6-digit
}

const otpTtlMs = 10 * 60 * 1000 // 10 min

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
  if (getByEmail(norm)) return res.status(409).json({ error: 'email-already-in-use' })
  const id = crypto.randomUUID()
  const hash = await bcrypt.hash(String(password), 10)
  createUser({ id, email: norm, name: (name || '').trim(), last: (last || '').trim(), passHash: hash })
  res.json({ token: sign(id), user: { id, email: norm, name: (name || '').trim() } })
})

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {}
  const norm = String(email || '').toLowerCase().trim()
  const u = getByEmail(norm)
  if (!u || !u.pass_hash) return res.status(401).json({ error: 'wrong-credentials' })
  const ok = await bcrypt.compare(String(password || ''), u.pass_hash)
  if (!ok) return res.status(401).json({ error: 'wrong-credentials' })
  res.json({ token: sign(u.id), user: { id: u.id, email: u.email, name: u.name || '' } })
})

// Request a 6-digit OTP — creates the user if they're new (sign-up via OTP)
router.post('/request-otp', async (req, res) => {
  const { email } = req.body || {}
  const norm = String(email || '').toLowerCase().trim()
  if (!norm) return res.status(400).json({ error: 'email-required' })
  let u = getByEmail(norm)
  if (!u) {
    const id = crypto.randomUUID()
    createUser({ id, email: norm, name: '', last: '', passHash: null })
    u = getByEmail(norm)
  }
  const code = otpCode()
  setOtp(u.id, code, Date.now() + otpTtlMs)
  const mail = await sendOtpEmail(norm, code)
  if (mail && mail.error) return res.status(500).json({ error: 'email-send-failed', detail: mail.error })
  res.json({ ok: true, hint: 'code sent' })
})

router.post('/verify-otp', (req, res) => {
  const { email, code } = req.body || {}
  const norm = String(email || '').toLowerCase().trim()
  const u = getByEmail(norm)
  if (!u || !u.otp || !u.otp_exp) return res.status(401).json({ error: 'no-otp-requested' })
  if (String(code) !== String(u.otp)) return res.status(401).json({ error: 'wrong-otp' })
  if (Date.now() > u.otp_exp) return res.status(401).json({ error: 'otp-expired' })
  // consume OTP
  setOtp(u.id, null, null)
  // if the user was OTP-only (no password), seed local data if any (already loaded later)
  res.json({ token: sign(u.id), user: { id: u.id, email: u.email, name: u.name || '' } })
})

router.get('/me', requireAuth, (req, res) => {
  const u = getUser(req.uid)
  if (!u) return res.status(404).json({ error: 'user-not-found' })
  const data = loadData(req.uid) || {}
  res.json({ user: { id: u.id, email: u.email, name: u.name || '' }, data })
})

router.post('/logout', (_req, res) => res.json({ ok: true }))

export { router, requireAuth }