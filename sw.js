/* Salsa Shape Matcher: service worker (offline support).
 * Owner: Forge (wasm-expert) with Harbor (netlify-deployer).
 * - App files: network first (you always get the newest deploy), cache as fallback offline.
 * - OpenCV.js (~10 MB): cache first after the first successful download.
 * "Reset app data" deletes these caches and unregisters this worker.
 */
const CACHE = 'salsa-shapes-v2';   // bumped: new sample photos
const APP_SHELL = [
  './', 'index.html', 'how-it-works.html', 'resources.html',
  'css/app.css', 'js/app.js', 'js/db.js', 'js/pipeline.js', 'shape.worker.js',
  'samples/styling-high-arm-reference.jpg', 'samples/styling-high-arm-attempt.jpg',
  'samples/styling-hip-hand-reference.jpg', 'samples/styling-hip-hand-attempt.jpg',
  'samples/styling-frame-up-reference.jpg', 'samples/styling-frame-up-attempt.jpg',
  'samples/styling-lean-sweep-reference.jpg', 'samples/styling-lean-sweep-attempt.jpg',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((c) => c.addAll(APP_SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    for (const key of await caches.keys()) if (key !== CACHE) await caches.delete(key);
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  if (url.pathname.endsWith('/opencv.js')) {
    event.respondWith((async () => {
      const cache = await caches.open(CACHE);
      const hit = await cache.match(req);
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === 'opaque') cache.put(req, res.clone()).catch(() => {});
      return res;
    })());
    return;
  }

  if (url.origin !== self.location.origin) return;
  event.respondWith((async () => {
    try {
      const res = await fetch(req);
      if (res.ok) { const cache = await caches.open(CACHE); cache.put(req, res.clone()).catch(() => {}); }
      return res;
    } catch (err) {
      const hit = await caches.match(req, { ignoreSearch: true });
      if (hit) return hit;
      throw err;
    }
  })());
});
