/**
 * Service Worker for caching and offline support
 * Provides offline functionality and optimized caching
 */

const CACHE_NAME = 'science-point-v1'
const RUNTIME_CACHE = 'science-point-runtime'

// Assets to cache on install
const STATIC_CACHE_URLS = [
  '/',
  '/static/js/main.js',
  '/static/css/main.css',
  '/manifest.json'
]

// API endpoints to cache
const API_CACHE_PATTERNS = [
  /\/api\/.*\/$/,
  /\/admin\/dashboard$/,
  /\/student\/.*\/profile$/
]

// Install event - cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_CACHE_URLS)
      })
      .then(() => {
        console.log('Service Worker: Installation complete')
        return self.skipWaiting()
      })
  )
})

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE) {
              console.log('Service Worker: Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activation complete')
        return self.clients.claim()
      })
  )
})

// Fetch event - implement caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip cross-origin requests
  if (url.origin !== location.origin) {
    return
  }

  // Handle different types of requests
  if (request.method === 'GET') {
    // Static assets - Cache First strategy
    if (isStaticAsset(request.url)) {
      event.respondWith(cacheFirst(request))
    }
    // API requests - Network First strategy
    else if (isAPIRequest(request.url)) {
      event.respondWith(networkFirst(request))
    }
    // HTML pages - Stale While Revalidate strategy
    else if (isHTMLRequest(request)) {
      event.respondWith(staleWhileRevalidate(request))
    }
  }
})

// Cache First strategy - good for static assets
async function cacheFirst(request) {
  try {
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }

    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.error('Service Worker: Cache first strategy failed:', error)
    return new Response('Offline content not available', { status: 503 })
  }
}

// Network First strategy - good for API requests
async function networkFirst(request) {
  try {
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const cache = await caches.open(RUNTIME_CACHE)
      cache.put(request, networkResponse.clone())
    }
    return networkResponse
  } catch (error) {
    console.log('Service Worker: Network failed, trying cache:', request.url)
    const cachedResponse = await caches.match(request)
    if (cachedResponse) {
      return cachedResponse
    }
    
    // Return offline response for API requests
    return new Response(
      JSON.stringify({ 
        error: 'Offline', 
        message: 'This request requires network connectivity' 
      }),
      { 
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// Stale While Revalidate strategy - good for HTML pages
async function staleWhileRevalidate(request) {
  const cache = await caches.open(RUNTIME_CACHE)
  const cachedResponse = await caches.match(request)

  // Start fetch in background
  const fetchPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        cache.put(request, networkResponse.clone())
      }
      return networkResponse
    })
    .catch(() => null)

  // Return cached version immediately if available
  if (cachedResponse) {
    return cachedResponse
  }

  // Wait for network if no cache
  return fetchPromise || new Response('Offline', { status: 503 })
}

// Helper functions
function isStaticAsset(url) {
  return /\.(js|css|png|jpg|jpeg|gif|svg|woff2?|ttf)(\?.*)?$/.test(url)
}

function isAPIRequest(url) {
  return url.includes('/api/') || API_CACHE_PATTERNS.some(pattern => pattern.test(url))
}

function isHTMLRequest(request) {
  return request.headers.get('Accept')?.includes('text/html')
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync triggered:', event.tag)
  
  if (event.tag === 'background-sync') {
    event.waitUntil(doBackgroundSync())
  }
})

async function doBackgroundSync() {
  try {
    // Process queued offline actions
    const offlineActions = await getOfflineActions()
    
    for (const action of offlineActions) {
      try {
        await fetch(action.url, action.options)
        await removeOfflineAction(action.id)
        console.log('Service Worker: Synced offline action:', action.id)
      } catch (error) {
        console.error('Service Worker: Failed to sync action:', action.id, error)
      }
    }
  } catch (error) {
    console.error('Service Worker: Background sync failed:', error)
  }
}

// IndexedDB helpers for offline actions
async function getOfflineActions() {
  // In a real implementation, you'd use IndexedDB
  // For now, return empty array
  return []
}

async function removeOfflineAction(id) {
  // Remove action from IndexedDB after successful sync
  console.log('Service Worker: Removing offline action:', id)
}

// Push notifications
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push notification received')
  
  const options = {
    body: event.data ? event.data.text() : 'New notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: 'View',
        icon: '/icons/checkmark.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/xmark.png'
      }
    ]
  }

  event.waitUntil(
    self.registration.showNotification('Science Point', options)
  )
})

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click received:', event.action)

  event.notification.close()

  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// Message handler for communication with main thread
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received:', event.data)

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'GET_CACHE_STATS') {
    getCacheStats().then(stats => {
      event.ports[0].postMessage(stats)
    })
  }
})

// Get cache statistics
async function getCacheStats() {
  try {
    const cacheNames = await caches.keys()
    const stats = {}

    for (const cacheName of cacheNames) {
      const cache = await caches.open(cacheName)
      const keys = await cache.keys()
      stats[cacheName] = {
        entries: keys.length,
        urls: keys.map(request => request.url)
      }
    }

    return {
      caches: stats,
      totalCaches: cacheNames.length,
      timestamp: new Date().toISOString()
    }
  } catch (error) {
    console.error('Service Worker: Failed to get cache stats:', error)
    return { error: error.message }
  }
}