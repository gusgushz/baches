const CACHE_NAME = 'baches-static-v1';
const OFFLINE_URL = '/offline.html';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/offline.html',
  '/src/main.tsx'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(PRECACHE_URLS).catch(() => {
        // swallow errors for optional files
      });
    }).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(
      keys.map((k) => {
        if (k !== CACHE_NAME) return caches.delete(k);
        return Promise.resolve(true);
      })
    )).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  // Always try network first for navigation (to get updates), fallback to cache/offline
  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req).then((res) => {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(()=>{})
        return res;
      }).catch(() => caches.match(OFFLINE_URL))
    );
    return;
  }

  // For other requests, try cache first
  event.respondWith(
    caches.match(req).then((cached) => cached || fetch(req).then((res) => {
      // cache JS/CSS for offline
      if (req.method === 'GET' && res && res.type === 'basic') {
        const copy = res.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(req, copy)).catch(()=>{});
      }
      return res;
    })).catch(() => {
      // fallback to cache for images or return nothing
      return caches.match(OFFLINE_URL);
    })
  );
});
