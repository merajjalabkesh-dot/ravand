// This legacy file is intentionally disabled.
// The real service worker is generated at build time into dist/service-worker.js
// and registered as /service-worker.js with scope '/'.
self.addEventListener('install', () => self.skipWaiting())
self.addEventListener('activate', () => self.clients.claim())
