const CACHE_NAME = 'trendview-cache-v1';
const STATIC_CACHE_NAME = 'trendview-static-v1';
const urlsToCache = [
  '/',
  '/index.html',
  '/favicon.ico',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/manifest.json'
];

// Install event: opens a cache and adds the app shell to it.
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache);
      })
  );
  self.skipWaiting();
});

// Fetch event: serves assets from the cache or network.
self.addEventListener('fetch', (event) => {
  // We only want to cache GET requests.
  if (event.request.method !== 'GET') {
    return;
  }

  // For navigation requests, use a network-first strategy.
  // This ensures the user always gets the latest HTML, which is important for SPAs.
  if (event.request.mode === 'navigate') {
    event.respondWith(
      fetch(event.request).catch(() => {
        // If network fails, serve the root from cache. This enables offline access.
        return caches.match('/');
      })
    );
    return;
  }

  // For other requests (CSS, JS, images), use a cache-first strategy.
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request).then((fetchResponse) => {
        return caches.open(CACHE_NAME).then((cache) => {
          // Don't cache failed requests.
          if (fetchResponse.status === 200) {
              cache.put(event.request, fetchResponse.clone());
          }
          return fetchResponse;
        });
      });
    })
  );
});


// Activate event: cleans up old caches.
self.addEventListener('activate', (event) => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheWhitelist.indexOf(cacheName) === -1) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
  return self.clients.claim();
});
