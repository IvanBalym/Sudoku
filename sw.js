/* Service worker: игра работает без интернета. При изменении файлов увеличьте VERSION. */
const VERSION = 'sudoku-v1.3.0';
const ASSETS = [
  './', './index.html', './manifest.json',
  './icon.svg', './icon-192.png', './icon-512.png',
  './maskable-512.png', './apple-touch-icon.png', './favicon-32.png',
];

// Кэшируем по одному файлу: если какого-то нет, установка всё равно проходит.
self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(VERSION)
      .then((c) => Promise.all(ASSETS.map((a) => c.add(a).catch(() => null))))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Страница: сначала сеть (чтобы обновления приходили сразу), без сети — из кэша.
// Остальное: сначала кэш, в фоне обновление.
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  if (req.mode === 'navigate') {
    e.respondWith(
      fetch(req)
        .then((res) => { const copy = res.clone(); caches.open(VERSION).then((c) => c.put('./index.html', copy)); return res; })
        .catch(() => caches.match('./index.html', { ignoreSearch: true }))
    );
    return;
  }
  e.respondWith(
    caches.open(VERSION).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req)
        .then((res) => { if (res && res.ok) cache.put(req, res.clone()); return res; })
        .catch(() => null);
      if (cached) { e.waitUntil(network); return cached; }
      return (await network) || new Response('', { status: 504 });
    })
  );
});
