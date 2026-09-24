// SQLite persistence using Node's built-in `node:sqlite` (Node 22.5+ / stable in 23+).
// No native dependencies → no compilation needed on any host (Railway works out of the box).
import { DatabaseSync } from 'node:sqlite'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import fs from 'node:fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const dataDir = process.env.DATA_DIR || path.join(__dirname, '..', 'data')
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true })

const dbPath = process.env.DB_PATH || path.join(dataDir, 'roznegar.db')
const db = new DatabaseSync(dbPath)
db.exec('PRAGMA journal_mode = WAL;')

db.exec(`
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  last TEXT,
  pass_hash TEXT,
  otp TEXT,
  otp_exp INTEGER,
  created_at INTEGER NOT NULL DEFAULT (unixepoch())
);

CREATE TABLE IF NOT EXISTS user_data (
  user_id TEXT PRIMARY KEY REFERENCES users(id),
  data TEXT NOT NULL,
  updated_at INTEGER NOT NULL DEFAULT (unixepoch())
);
`)

const stmt = {
  getByEmail: db.prepare('SELECT * FROM users WHERE email = ?'),
  getUser: db.prepare('SELECT id, email, name, last FROM users WHERE id = ?'),
  createUser: db.prepare('INSERT INTO users (id, email, name, last, pass_hash) VALUES (?,?,?,?,?)'),
  setPassword: db.prepare('UPDATE users SET pass_hash = ?, otp = NULL, otp_exp = NULL WHERE id = ?'),
  setOtp: db.prepare('UPDATE users SET otp = ?, otp_exp = ? WHERE id = ?'),
  loadData: db.prepare('SELECT data FROM user_data WHERE user_id = ?'),
  saveData: db.prepare(`
    INSERT INTO user_data (user_id, data, updated_at) VALUES (?,?,unixepoch())
    ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = unixepoch()
  `),
}

export function getByEmail(email) {
  return stmt.getByEmail.get(String(email).toLowerCase().trim())
}
export function getUser(id) {
  return stmt.getUser.get(id)
}
export function createUser({ id, email, name, last, passHash }) {
  stmt.createUser.run(id, email, name || '', last || '', passHash || null)
}
export function setPassword(id, hash) {
  stmt.setPassword.run(hash, id)
}
export function setOtp(id, otp, exp) {
  stmt.setOtp.run(otp, exp, id)
}
export function loadData(userId) {
  const row = stmt.loadData.get(userId)
  return row ? JSON.parse(row.data) : null
}
export function saveData(userId, data) {
  stmt.saveData.run(userId, JSON.stringify(data))
}