/* Service worker: гра працює без інтернету. Після змін у файлах збільште VERSION. */
const VERSION = 'sudoku-v3.0.0';
const ASSETS = [
  './', './index.html', './manifest.json',
  './icon.svg', './icon-192.png', './icon-512.png',
  './maskable-512.png', './apple-touch-icon.png', './favicon-32.png', './garden.svg',
  './fl-bratky.webp', './fl-buzok.webp', './fl-chornobryvtsi.webp', './fl-edelveis.webp', './fl-gvozdyka.webp', './fl-hortenziya.webp', './fl-iris.webp', './fl-kameliya.webp', './fl-khryzantema.webp', './fl-konyushyna.webp', './fl-kulbaba.webp', './fl-kupalnytsia.webp', './fl-lavanda.webp', './fl-lotos.webp', './fl-magnoliya.webp', './fl-mak.webp', './fl-narcys.webp', './fl-nezabudka.webp', './fl-orkhideya.webp', './fl-paporot.webp', './fl-pivoniya.webp', './fl-romashka.webp', './fl-sonyashnyk.webp', './fl-strelitsiya.webp', './fl-troyanda.webp', './fl-tyulpan.webp', './fl-voloshka.webp', './fl-zhorzhyna.webp',
];

// Кешуємо по одному файлу: якщо якогось немає, встановлення все одно проходить.
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

// Сторінка: спочатку мережа (щоб оновлення приходили одразу), без мережі — з кешу.
// Решта: спочатку кеш, у фоні оновлення.
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
