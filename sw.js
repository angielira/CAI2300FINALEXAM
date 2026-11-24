/* Ballet Pose Matcher: service worker (offline support).
 * Owner: Forge (wasm-expert) with Harbor (netlify-deployer).
 * - App files: network first (you always get the newest deploy), cache as fallback offline.
 * - OpenCV.js (~10 MB): cache first after the first successful download.
 * "Reset app data" deletes these caches and unregisters this worker.
 */
const CACHE = 'ballet-poses-v4';   // bumped: 16 ballet poses
const APP_SHELL = [
  './', 'index.html', 'how-it-works.html', 'resources.html',
  'css/app.css', 'js/app.js', 'js/db.js', 'js/pipeline.js', 'shape.worker.js',
  'samples/ballet-a-la-seconde-reference.jpg', 'samples/ballet-a-la-seconde-attempt.jpg',
  'samples/ballet-arabesque-reference.jpg', 'samples/ballet-arabesque-attempt.jpg',
  'samples/ballet-attitude-reference.jpg', 'samples/ballet-attitude-attempt.jpg',
  'samples/ballet-attitude-devant-reference.jpg', 'samples/ballet-attitude-devant-attempt.jpg',
  'samples/ballet-developpe-devant-reference.jpg', 'samples/ballet-developpe-devant-attempt.jpg',
  'samples/ballet-ecarte-reference.jpg', 'samples/ballet-ecarte-attempt.jpg',
  'samples/ballet-fifth-en-haut-reference.jpg', 'samples/ballet-fifth-en-haut-attempt.jpg',
  'samples/ballet-first-bras-bas-reference.jpg', 'samples/ballet-first-bras-bas-attempt.jpg',
  'samples/ballet-fourth-croise-reference.jpg', 'samples/ballet-fourth-croise-attempt.jpg',
  'samples/ballet-grand-jete-reference.jpg', 'samples/ballet-grand-jete-attempt.jpg',
  'samples/ballet-penche-reference.jpg', 'samples/ballet-penche-attempt.jpg',
  'samples/ballet-retire-reference.jpg', 'samples/ballet-retire-attempt.jpg',
  'samples/ballet-reverence-reference.jpg', 'samples/ballet-reverence-attempt.jpg',
  'samples/ballet-second-plie-reference.jpg', 'samples/ballet-second-plie-attempt.jpg',
  'samples/ballet-tendu-devant-reference.jpg', 'samples/ballet-tendu-devant-attempt.jpg',
  'samples/ballet-tendu-seconde-reference.jpg', 'samples/ballet-tendu-seconde-attempt.jpg',
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
