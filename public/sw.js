const CACHE_NAME = 'baches-cache-v1';
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/vite.svg',
  '/icons/icon-192.svg',
  '/icons/icon-512.svg'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_URLS)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map(k => { if (k !== CACHE_NAME) return caches.delete(k); return null; })
    )).then(() => self.clients.claim())
  );
});

// Simple runtime caching strategy:
// - navigation requests: network-first, fallback to cached index.html
// - /api/ requests: network-first
// - other requests (static): cache-first
self.addEventListener('fetch', (event) => {
  const req = event.request;
  const url = new URL(req.url);

  // Only handle same-origin requests
  if (url.origin !== self.location.origin) return;

  // Navigation (SPA)
  if (req.mode === 'navigate' || (req.method === 'GET' && req.headers.get('accept')?.includes('text/html'))) {
    event.respondWith(
      fetch(req).then((res) => {
        // update cache with latest index.html
        caches.open(CACHE_NAME).then(cache => cache.put('/index.html', res.clone()));
        return res;
      }).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // API requests -> network-first
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(req).then(res => {
        return res;
      }).catch(() => caches.match(req))
    );
    return;
  }

  // Static assets -> cache-first
  event.respondWith(
    caches.match(req).then(cached => cached || fetch(req).then(res => {
      // put into cache for future
      caches.open(CACHE_NAME).then(cache => {
        try { cache.put(req, res.clone()); } catch (e) { /* ignore */ }
      });
      return res;
    }).catch(() => null))
  );
});
