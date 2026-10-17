/* Oja service worker — minimal offline shell.
 * Cache-first for same-origin GET of the app shell (/ , /index.html,
 * /assets/*, /icons/*, /manifest.json). Network-only for /api/* (never cached).
 */
const CACHE = 'oja-v1';
const PRECACHE = ['/', '/index.html', '/manifest.json'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()).catch(() => {})
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function isShellAsset(pathname) {
  return (
    pathname === '/' ||
    pathname === '/index.html' ||
    pathname === '/manifest.json' ||
    pathname.startsWith('/assets/') ||
    pathname.startsWith('/icons/')
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // API: always network, never cached.
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  if (!isShellAsset(url.pathname)) return;

  event.respondWith(
    caches.match(request).then((hit) => {
      if (hit) return hit;
      return fetch(request).then((res) => {
        if (res && res.ok) {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put(request, copy));
        }
        return res;
      }).catch(() => caches.match('/index.html'));
    })
  );
});
