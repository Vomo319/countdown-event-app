const CACHE_NAME = 'waiting-for-v1.1.0';
const STATIC_ASSETS = [
  '/',
  '/app',
  '/styles',
];

// Install event
self.addEventListener('install', (event) => {
  console.log('[v0] Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[v0] Cache opened');
      return cache.addAll(STATIC_ASSETS).catch((error) => {
        console.log('[v0] Some assets failed to cache:', error);
      });
    })
  );
  self.skipWaiting();
});

// Activate event
self.addEventListener('activate', (event) => {
  console.log('[v0] Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('[v0] Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - network first, fallback to cache
self.addEventListener('fetch', (event) => {
  const { request } = event;
  
  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  event.respondWith(
    fetch(request)
      .then((response) => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        
        // Clone and cache the response
        const responseToCache = response.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(request, responseToCache);
        });
        
        return response;
      })
      .catch(() => {
        // Network request failed, try to get from cache
        return caches.match(request).then((response) => {
          return response || new Response('Offline - content not available', { status: 503 });
        });
      })
  );
});
