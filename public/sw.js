const CACHE_NAME = 'waiting-for-v1.1.0';
const STATIC_ASSETS = [
  '/',
  '/app',
  '/styles',
];

// Notification messages for different feelings
const NOTIFICATION_TEMPLATES = {
  excited: [
    'The big day is almost here!',
    'Your excitement is justified — keep that energy!',
    'Can you feel it? It\'s coming!',
  ],
  nervous: [
    'Take a deep breath. You\'ve got this.',
    'Remember why you\'re looking forward to this.',
    'A little nervousness means it matters.',
  ],
  hopeful: [
    'Hope looks good on you.',
    'Keep believing — it\'s going to be beautiful.',
    'Every day brings you closer to your dream.',
  ],
  grateful: [
    'You\'re so lucky to have this to look forward to.',
    'Gratitude makes the wait sweeter.',
    'Appreciate the anticipation.',
  ],
  anxious: [
    'It\'s okay to feel anxious. You\'re prepared.',
    'Ground yourself in this moment.',
    'One day at a time.',
  ],
  joyful: [
    'Your joy is contagious!',
    'This countdown is a celebration.',
    'So much to look forward to!',
  ],
};

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

// Notification click handler
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then((clientList) => {
      // Focus existing window if available
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      // Open new window if none exists
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Background notification handler for scheduled notifications
self.addEventListener('push', (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.message || 'It\'s countdown time!',
      icon: '/icon.svg',
      badge: '/icon.svg',
      tag: data.eventId || 'countdown-notification',
      requireInteraction: false,
      data: {
        eventId: data.eventId,
      },
    };

    event.waitUntil(
      self.registration.showNotification(data.title || 'Waiting For', options)
    );
  }
});
