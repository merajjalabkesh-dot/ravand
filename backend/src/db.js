// PostgreSQL persistence for Neon/Railway (persistent, no native deps).
import pg from 'pg'

const { Pool } = pg
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Neon always uses TLS. Explicit ssl option avoids relying on URL parsing.
  ssl: process.env.DATABASE_URL ? { rejectUnauthorized: false } : undefined,
  max: 5,
})

let ready = false
async function ensureSchema() {
  if (ready) return
  if (!process.env.DATABASE_URL) {
    console.warn('[db] DATABASE_URL is not set — data cannot be persisted')
    throw new Error('DATABASE_URL missing')
  }
  try {
    await pool.query('SELECT 1')
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        last TEXT,
        pass_hash TEXT,
        otp TEXT,
        otp_exp BIGINT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE TABLE IF NOT EXISTS user_data (
        user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
        data TEXT NOT NULL,
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `)
    ready = true
    console.log('[db] postgres connected + schema ready')
  } catch (e) {
    console.error('[db] connection failed:', e && e.message, e && e.code)
    throw e
  }
}

export async function getByEmail(email) {
  await ensureSchema()
  const r = await pool.query('SELECT * FROM users WHERE email = $1', [String(email).toLowerCase().trim()])
  return r.rows[0] || null
}
export async function getUser(id) {
  await ensureSchema()
  const r = await pool.query('SELECT id, email, name, last FROM users WHERE id = $1', [id])
  return r.rows[0] || null
}
/** برای احراز هویت — هش رمز را هم برمی‌گرداند. فقط داخل سرور استفاده شود. */
export async function getUserAuth(id) {
  await ensureSchema()
  const r = await pool.query('SELECT id, email, pass_hash FROM users WHERE id = $1', [id])
  return r.rows[0] || null
}
export async function createUser({ id, email, name, last, passHash }) {
  await ensureSchema()
  await pool.query('INSERT INTO users (id, email, name, last, pass_hash) VALUES ($1,$2,$3,$4,$5)', [id, email, name || '', last || '', passHash || null])
}
export async function setPassword(id, hash) {
  await ensureSchema()
  await pool.query('UPDATE users SET pass_hash = $1, otp = NULL, otp_exp = NULL WHERE id = $2', [hash, id])
}
export async function loadData(userId) {
  await ensureSchema()
  const r = await pool.query('SELECT data FROM user_data WHERE user_id = $1', [userId])
  if (!r.rows[0]) return null
  try { return JSON.parse(r.rows[0].data) } catch { return null }
}
export async function saveData(userId, data) {
  await ensureSchema()
  await pool.query(
    `INSERT INTO user_data (user_id, data, updated_at) VALUES ($1,$2,NOW())
     ON CONFLICT(user_id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
    [userId, JSON.stringify(data)]
  )
}
