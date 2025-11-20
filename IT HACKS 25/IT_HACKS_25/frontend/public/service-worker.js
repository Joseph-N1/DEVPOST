// ECO FARM Service Worker - PWA Offline Support
// Phase 9: Advanced caching strategies for offline-first experience

const CACHE_NAME = 'eco-farm-v1.0.0';
const RUNTIME_CACHE = 'eco-farm-runtime-v1';
const DATA_CACHE = 'eco-farm-data-v1';
const IMAGE_CACHE = 'eco-farm-images-v1';

// Resources to cache immediately on install
const PRECACHE_URLS = [
  '/',
  '/dashboard',
  '/analytics',
  '/reports',
  '/upload',
  '/profile',
  '/how',
  '/login',
  '/register',
  '/offline',
  '/manifest.json',
  '/_next/static/css/app.css',
  '/icons/icon-192.png',
  '/icons/icon-512.png'
];

// API endpoints that should be cached
const API_CACHE_PATTERNS = [
  /\/api\/rooms/,
  /\/api\/analysis/,
  /\/api\/health/,
  /\/auth\/me/
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
  console.log('[ServiceWorker] Install');
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[ServiceWorker] Precaching static assets');
        return cache.addAll(PRECACHE_URLS.map(url => new Request(url, { credentials: 'same-origin' })));
      })
      .catch((error) => {
        console.error('[ServiceWorker] Precache failed:', error);
      })
  );
  
  self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('[ServiceWorker] Activate');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME && 
              cacheName !== RUNTIME_CACHE && 
              cacheName !== DATA_CACHE &&
              cacheName !== IMAGE_CACHE) {
            console.log('[ServiceWorker] Removing old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  
  self.clients.claim();
});

// Fetch event - intelligent caching strategies
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and chrome-extension URLs
  if (request.method !== 'GET' || url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle API requests with network-first strategy
  if (url.pathname.startsWith('/api/') || url.port === '8000') {
    event.respondWith(networkFirstStrategy(request, DATA_CACHE));
    return;
  }

  // Handle images with cache-first strategy
  if (request.destination === 'image' || /\.(jpg|jpeg|png|gif|svg|webp|ico)$/i.test(url.pathname)) {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE));
    return;
  }

  // Handle static assets with cache-first strategy
  if (url.pathname.startsWith('/_next/') || url.pathname.startsWith('/static/')) {
    event.respondWith(cacheFirstStrategy(request, CACHE_NAME));
    return;
  }

  // Handle navigation requests with network-first, fallback to offline page
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const responseClone = response.clone();
          caches.open(RUNTIME_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse;
              }
              // Return offline page if available
              return caches.match('/offline');
            });
        })
    );
    return;
  }

  // Default: stale-while-revalidate
  event.respondWith(staleWhileRevalidate(request, RUNTIME_CACHE));
});

// Caching strategies

// Network-first: Try network, fallback to cache
async function networkFirstStrategy(request, cacheName) {
  try {
    const response = await fetch(request);
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      console.log('[ServiceWorker] Serving from cache:', request.url);
      return cachedResponse;
    }
    throw error;
  }
}

// Cache-first: Try cache, fallback to network
async function cacheFirstStrategy(request, cacheName) {
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    return cachedResponse;
  }

  try {
    const response = await fetch(request);
    const cache = await caches.open(cacheName);
    cache.put(request, response.clone());
    return response;
  } catch (error) {
    console.error('[ServiceWorker] Fetch failed:', error);
    throw error;
  }
}

// Stale-while-revalidate: Return cache immediately, update in background
async function staleWhileRevalidate(request, cacheName) {
  const cachedResponse = await caches.match(request);
  
  const fetchPromise = fetch(request)
    .then((response) => {
      const cache = caches.open(cacheName);
      cache.then((c) => c.put(request, response.clone()));
      return response;
    })
    .catch(() => cachedResponse);

  return cachedResponse || fetchPromise;
}

// Background sync for offline actions
self.addEventListener('sync', (event) => {
  console.log('[ServiceWorker] Background sync:', event.tag);
  
  if (event.tag === 'sync-uploads') {
    event.waitUntil(syncUploads());
  } else if (event.tag === 'sync-analytics') {
    event.waitUntil(syncAnalytics());
  }
});

// Sync queued uploads when back online
async function syncUploads() {
  try {
    const cache = await caches.open(DATA_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('/upload') && request.method === 'POST') {
        try {
          const response = await fetch(request.clone());
          if (response.ok) {
            await cache.delete(request);
            console.log('[ServiceWorker] Upload synced:', request.url);
            
            // Notify clients
            const clients = await self.clients.matchAll();
            clients.forEach((client) => {
              client.postMessage({
                type: 'UPLOAD_SYNCED',
                url: request.url
              });
            });
          }
        } catch (error) {
          console.error('[ServiceWorker] Sync failed:', error);
        }
      }
    }
  } catch (error) {
    console.error('[ServiceWorker] Sync uploads failed:', error);
  }
}

// Sync analytics data
async function syncAnalytics() {
  try {
    console.log('[ServiceWorker] Syncing analytics data');
    // Implement analytics sync logic
  } catch (error) {
    console.error('[ServiceWorker] Sync analytics failed:', error);
  }
}

// Handle messages from clients
self.addEventListener('message', (event) => {
  console.log('[ServiceWorker] Message received:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    event.waitUntil(
      caches.open(DATA_CACHE).then((cache) => {
        return cache.addAll(event.data.urls);
      })
    );
  }
  
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => caches.delete(cacheName))
        );
      })
    );
  }
});

// Push notifications (future enhancement)
self.addEventListener('push', (event) => {
  console.log('[ServiceWorker] Push received');
  
  const data = event.data ? event.data.json() : {};
  const title = data.title || 'ECO FARM Notification';
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-96.png',
    vibrate: [200, 100, 200],
    data: data.url || '/dashboard'
  };
  
  event.waitUntil(
    self.registration.showNotification(title, options)
  );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  console.log('[ServiceWorker] Notification clicked');
  
  event.notification.close();
  
  event.waitUntil(
    clients.openWindow(event.notification.data || '/dashboard')
  );
});
