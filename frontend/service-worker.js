/* Pinggan service worker: lets the installed app open without a connection.
 * vite.config.ts builds this into dist/sw.js, filling in the version and the files to cache. */
const CACHE = 'pinggan-__VERSION__';
const PRECACHE = __PRECACHE__;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key.startsWith('pinggan-') && key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);
  // Photos and predictions always go to the server; only the app itself is cached.
  if (request.method !== 'GET' || url.origin !== self.location.origin || url.pathname.startsWith('/api/')) return;

  if (request.mode === 'navigate') {
    // The latest app when online, the cached copy when not.
    event.respondWith(fetch(request).catch(() => caches.match('/index.html')));
    return;
  }
  event.respondWith(caches.match(request).then((cached) => cached ?? fetch(request)));
});
