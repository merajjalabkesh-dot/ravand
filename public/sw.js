// Service Worker — installs the full app shell (HTML + built JS/CSS) so the
// installed PWA opens and runs without network.
const CACHE = 'ravand-v4'
const SHELL = ['/', '/index.html', '/manifest.json', '/icon-192.png', '/icon-512.png']

// Fetch index.html, parse out the built asset URLs, and cache them.
async function precacheAppShell() {
  const cache = await caches.open(CACHE)
  await cache.addAll(SHELL)

  // Read the HTML so we can find every hashed JS/CSS file Vite emitted.
  try {
    const response = await fetch('/', { cache: 'reload' })
    const html = await response.text()
    await cache.put('/', response.clone())

    const urls = new Set()
    const re = /(?:src|href)=["']([^"']+)["']/g
    let m
    while ((m = re.exec(html))) {
      const u = m[1]
      if (u.startsWith('/assets/') || u.startsWith('./assets/')) {
        urls.add(u.startsWith('./') ? u.slice(1) : u)
      }
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

  // SPA navigations: network first, fall back to the cached index.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          caches.open(CACHE).then((c) => c.put(request, response.clone())).catch(() => {})
          return response
        })
        .catch(() => caches.match(request).then((r) => r || caches.match('/index.html') || caches.match('/')))
    )
    return
  }

  // Static assets: cache first (built files never change within a deployment).
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
