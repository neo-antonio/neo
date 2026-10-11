const V = 'neo-v1';
const SHELL = ['./', 'index.html', 'profile.html', 'dailylog.html', 'foods.html', 'meals.html', 'statistics.html', 'todo.html', 'habits.html', 'calendar.html', 'notes.html',
  'finance.html', 'budget.html', 'categories.html', 'settings.html', 'styles.css', 'config.js', 'shell.js', 'net.js', 'app.js', 'manifest.webmanifest',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'icons/favicon-32.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(V).then(c => Promise.all(SHELL.map(u => c.add(new Request(u, { cache: 'reload' })).catch(() => {})))));
  self.skipWaiting();
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(k => Promise.all(k.filter(n => n !== V).map(n => caches.delete(n)))));
  self.clients.claim();
});
// Network-first so pages, scripts and styles always come from the same deploy; cache is the offline / slow (4s) fallback.
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || !req.url.startsWith('http')) return;
  if (new URL(req.url).origin !== self.location.origin) return; // Apps Script (JSONP) + fonts go straight to the network
  e.respondWith((async () => {
    const cache = await caches.open(V);
    const net = fetch(req, { cache: 'no-cache' }).then(r => { if (r && r.ok) cache.put(req, r.clone()); return r; });
    net.catch(() => {});
    try { return await Promise.race([net, new Promise((_, rej) => setTimeout(() => rej(new Error('slow')), 4000))]); }
    catch (_) { return (await cache.match(req, { ignoreSearch: true })) || net.catch(() => Response.error()); }
  })());
});
