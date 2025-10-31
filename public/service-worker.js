// 🚀 Updated Service Worker (v4)
const CACHE_NAME = 'yana-app-v4';  // bumped from v1 → v4 to force refresh
const APP_SHELL = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/service-worker.js',
  '/data/shorts.csv'
];

// Install event: pre-cache the app shell
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(APP_SHELL))
  );
});

// Activate event: remove old caches
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
});

// Fetch event: serve CSV fresh if possible, otherwise cache
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);

  if (url.pathname.endsWith('.csv')) {
    // Always try to fetch the latest CSV, fall back to cache
    event.respondWith(
      fetch(event.request)
        .then(response => {
          const copy = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, copy));
          return response;
        })
        .catch(() => caches.match(event.request))
    );
  } else {
    // For everything else, try cache first then network
    event.respondWith(
      caches.match(event.request).then(hit => hit || fetch(event.request))
    );
  }
});
