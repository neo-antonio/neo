const CACHE_VERSION = 'neo-v0.5.1';
const CACHE_NAME = CACHE_VERSION;

// App shell: everything neo needs to open offline.
const PRECACHE_URLS = [
  './',
  './index.html',
  './styles.css',
  './theme.js',
  './app.js',
  './apps/eatshimo/eatshimo.html',
  './apps/eatshimo/eatshimo.js',
  './apps/stashimo/stashimo.html',
  './apps/stashimo/stashimo.js',
  './apps/wermny/wermny.html',
  './apps/wermny/wermny.js',
  './manifest.json',
  './favicon.png',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/apple-touch-icon.png'
];

// Third-party files neo relies on (charts + font). Cached best-effort so the
// Profile charts still draw offline; a failure here never blocks install.
const EXTERNAL_URLS = [
  'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.1/chart.umd.min.js',
  'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) =>
        cache.addAll(PRECACHE_URLS).then(() =>
          Promise.all(EXTERNAL_URLS.map((url) =>
            fetch(new Request(url, { mode: 'no-cors' }))
              .then((res) => cache.put(url, res))
              .catch(() => {})
          ))
        )
      )
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      )
    ).then(() => self.clients.claim())
  );
});

// Network first, fall back to the cache when offline.
// Only the app's own files and the pinned third-party files are cached.
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;

  const isHTML = req.mode === 'navigate' || (req.headers.get('accept') || '').includes('text/html');

  event.respondWith(
    fetch(req)
      .then((res) => {
        // status 0 / "opaque" = cross-origin script or font fetched without CORS
        if (res && (res.status === 200 || res.type === 'opaque')) {
          const copy = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, copy));
        }
        return res;
      })
      .catch(() => caches.match(req).then((cached) => cached || (isHTML ? caches.match('./index.html') : undefined)))
  );
});
