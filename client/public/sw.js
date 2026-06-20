/**
 * OneFounder Service Worker
 * Handles offline caching, background sync, and push notifications.
 */

const CACHE_NAME = 'onefoundr-v4'
const STATIC_CACHE = 'onefoundr-static-v4'
const API_CACHE = 'onefoundr-api-v4'

// Static assets to pre-cache on install
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
]

// API routes that can be cached
const CACHEABLE_API_ROUTES = [
  '/api/health',
  '/api/growth/progress',
  '/api/growth/achievements',
  '/api/dashboard',
]

// Install — pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  )
})

// Activate — clean old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== STATIC_CACHE && key !== API_CACHE)
          .map((key) => caches.delete(key))
      )
    ).then(() => self.clients.claim())
  )
})

// Fetch — network-first for API, cache-first for static
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET
  if (request.method !== 'GET') return

  // Skip chrome-extension and other non-http
  if (!url.protocol.startsWith('http')) return

  // API requests — network first, cache fallback
  if (url.pathname.startsWith('/api/')) {
    // Only cache specific GET endpoints
    const isCacheable = CACHEABLE_API_ROUTES.some((route) => url.pathname.startsWith(route))

    if (isCacheable) {
      event.respondWith(
        fetch(request)
          .then((response) => {
            if (response.ok) {
              const cloned = response.clone()
              caches.open(API_CACHE).then((cache) => cache.put(request, cloned))
            }
            return response
          })
          .catch(() => caches.match(request))
      )
    }
    return
  }

  // Static assets — cache first, network fallback
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached

      return fetch(request).then((response) => {
        // Cache successful static asset responses
        if (response.ok && (url.pathname.endsWith('.js') || url.pathname.endsWith('.css') || url.pathname.endsWith('.png') || url.pathname.endsWith('.svg') || url.pathname.endsWith('.woff2'))) {
          const cloned = response.clone()
          caches.open(STATIC_CACHE).then((cache) => cache.put(request, cloned))
        }
        return response
      })
    })
  )
})

// Background sync — retry failed API calls
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(retryFailedRequests())
  }
})

async function retryFailedRequests() {
  // Implementation would use IndexedDB to store failed requests
  // and retry them when connectivity returns
}

// Push notifications
self.addEventListener('push', (event) => {
  if (!event.data) return

  const data = event.data.json()
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/' },
    actions: data.actions || [],
  }

  event.waitUntil(
    self.registration.showNotification(data.title || 'OneFounder', options)
  )
})

// Notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'
  event.waitUntil(
    self.clients.openWindow(url)
  )
})
