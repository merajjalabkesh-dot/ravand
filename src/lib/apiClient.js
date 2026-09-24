// Lightweight API client for the custom backend (uses localStorage for token).
const BASE = import.meta.env.VITE_API_URL || 'http://localhost:4000'

function token() { try { return localStorage.getItem('rg_token') || '' } catch { return '' } }

async function req(method, url, body) {
  const headers = { 'Content-Type': 'application/json' }
  const t = token()
  if (t) headers.Authorization = 'Bearer ' + t
  const r = await fetch(BASE + url, { method, headers, body: body != null ? JSON.stringify(body) : undefined })
  let json = null
  try { json = await r.json() } catch { /* no body */ }
  if (!r.ok) {
    const err = new Error((json && json.error) || ('http ' + r.status))
    err.status = r.status
    throw err
  }
  return json
}

export const api = {
  register: (email, password, name, last) => req('POST', '/api/auth/register', { email, password, name, last }),
  login: (email, password) => req('POST', '/api/auth/login', { email, password }),
  requestOtp: (email) => req('POST', '/api/auth/request-otp', { email }),
  verifyOtp: (email, code) => req('POST', '/api/auth/verify-otp', { email, code }),
  me: () => req('GET', '/api/auth/me'),
  saveData: (data) => req('PUT', '/api/data', data),
  loadData: () => req('GET', '/api/data'),
}

export function setToken(t) { try { localStorage.setItem('rg_token', t) } catch { } }
export function clearToken() { try { localStorage.removeItem('rg_token') } catch { } }