const CACHE_NAME = 'exbos-pwa-v1'
const APP_SHELL = ['/', '/index.html', '/manifest.webmanifest', '/logo/exboslogo.png']

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL)).catch(() => {})
  )
  self.skipWaiting()
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      )
    )
  )
  self.clients.claim()
})

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)

  // Never cache backend API calls or cross-origin requests — always hit live network
  if (url.origin !== self.location.origin || url.pathname.startsWith('/api/')) {
    return
  }

  // Content-hashed static assets (/assets/*): Cache-First for instant offline loads
  if (url.pathname.startsWith('/assets/')) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ||
          fetch(request).then((resp) => {
            if (resp && resp.status === 200) {
              const copy = resp.clone()
              caches.open(CACHE_NAME).then((c) => c.put(request, copy)).catch(() => {})
            }
            return resp
          })
      )
    )
    return
  }

  // Navigation / HTML: Network-First with offline fallback to cached app shell
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((resp) => {
          if (resp && resp.status === 200) {
            const copy = resp.clone()
            caches.open(CACHE_NAME).then((c) => c.put('/index.html', copy)).catch(() => {})
          }
          return resp
        })
        .catch(() => caches.match('/index.html'))
    )
  }
})
