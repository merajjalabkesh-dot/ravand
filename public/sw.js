// Service Worker - offline support for the app shell
const CACHE = 'ravand-v1'
const PRECACHE = ['/']

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting())
  )
})

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
    .then(() => self.clients.claim())
  )
})

self.addEventListener('fetch', (e) => {
  const url = new URL(e.request.url)
  // don't cache API calls or video files (need fresh / streaming)
  if (url.pathname.startsWith('/api/') || url.pathname.endsWith('.mp4')) return
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached
      return fetch(e.request).then((resp) => {
        // cache same-origin static assets
        const clone = resp.clone()
        if (resp && resp.ok && url.origin === location.origin) {
          caches.open(CACHE).then((c) => c.put(e.request, clone))
        }
        return resp
      }).catch(() => caches.match('/'))
    })
  )
})