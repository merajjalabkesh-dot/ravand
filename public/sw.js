// Service Worker — full app-shell precache so the installed PWA works offline.
const CACHE = 'ravand-v3'
const SHELL = ['/', '/index.html', '/manifest.json']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(SHELL))
      .then(() => self.skipWaiting())
      .catch((e) => console.warn('[sw] shell precache failed', e))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  )
})

// Cache the built JS/CSS bundles the first time they are requested.
async function cacheAsset(request, response) {
  try {
    const cache = await caches.open(CACHE)
    await cache.put(request, response.clone())
  } catch (e) { /* storage full — ignore */ }
}

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  const origin = self.location.origin

  // Never cache API, media files, or cross-origin requests.
  if (url.origin !== origin) return
  if (url.pathname.startsWith('/api/')) return
  if (/\.(mp4|webm|mov)$/i.test(url.pathname)) return

  // SPA navigation requests: serve cached index.html when offline.
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          cacheAsset(request, response)
          return response
        })
        .catch(() => caches.match('/index.html').then((r) => r || caches.match('/')))
    )
    return
  }

  // Static assets: cache-first, then network, and store for offline use.
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (response && response.ok) cacheAsset(request, response)
        return response
      }).catch(() => caches.match('/'))
    })
  )
})
