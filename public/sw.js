// Service Worker — full app shell precache so the installed PWA works offline,
// including a cold start after the app has been fully closed.
const CACHE = 'ravand-v5'
const SHELL = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png']

async function precacheAppShell() {
  const cache = await caches.open(CACHE)
  await cache.addAll(SHELL)

  // Find every hashed asset Vite emitted in index.html and cache it.
  try {
    const response = await fetch('/', { cache: 'reload' })
    const cloneForHtml = response.clone()
    const html = await cloneForHtml.text()
    await cache.put('/', response.clone())
    await cache.put('/index.html', new Response(html, {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
    }))

    const urls = new Set()
    const re = /(?:src|href)=["']([^"']+)["']/g
    let m
    while ((m = re.exec(html))) {
      const u = m[1]
      if (u.includes('/assets/')) urls.add(u.startsWith('.') ? new URL(u, self.location.origin).pathname : u)
    }
    if (urls.size) await cache.addAll([...urls])
  } catch (e) {
    console.warn('[sw] app shell precache failed', e)
  }
}

self.addEventListener('install', (event) => {
  event.waitUntil(precacheAppShell().then(() => self.skipWaiting()))
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  const origin = self.location.origin
  if (url.origin !== origin) return
  if (url.pathname.startsWith('/api/')) return
  if (/\.(mp4|webm|mov)$/i.test(url.pathname)) return

  // SPA navigations: cached shell first so a cold offline start always works.
  if (request.mode === 'navigate') {
    event.respondWith(
      caches.match('/index.html').then((cached) => {
        const network = fetch(request)
          .then((response) => {
            if (response && response.ok) {
              caches.open(CACHE).then((c) => c.put('/index.html', response.clone())).catch(() => {})
            }
            return response
          })
          .catch(() => null)
        if (cached) {
          network.catch(() => {})
          return cached
        }
        return network.then((r) => r || caches.match('/')).then((r) => r || Response.error())
      })
    )
    return
  }

  // Static assets: cache first.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response && response.ok) {
          caches.open(CACHE).then((c) => c.put(request, response.clone())).catch(() => {})
        }
        return response
      }).catch(() => caches.match('/'))
    })
  )
})
