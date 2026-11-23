/* Salsa Shape Matcher: the Web Worker.
 * Owner: Forge (wasm-expert). Pipeline by Iris (opencv-expert).
 *
 * Loads OpenCV.js (OpenCV compiled to WebAssembly) ONCE, then runs every analysis
 * off the main thread so the page never freezes. Always answers: every request
 * gets either a "result" or an "error" message, never silence.
 */
'use strict';

// Official builds from docs.opencv.org. They embed the .wasm inside opencv.js,
// so no separate .wasm request is needed. To self-host instead, put a copy in
// vendor/opencv/opencv.js and add 'vendor/opencv/opencv.js' first in this list
// (see docs/04-netlify-deployment.md).
const OPENCV_URLS = [
  'https://docs.opencv.org/4.13.0/opencv.js',
  'https://docs.opencv.org/4.x/opencv.js',
];

importScripts('js/pipeline.js');

let ready = false;
let loadedFrom = null;

function post(msg, transfer) { self.postMessage(msg, transfer || []); }

function waitForRuntime(mod) {
  return new Promise((resolve, reject) => {
    const started = Date.now();
    const done = () => { clearInterval(poll); resolve(mod); };
    // Some builds expose a promise-like module, others call onRuntimeInitialized.
    if (mod && typeof mod.then === 'function' && !mod.Mat) {
      mod.then((m) => {
        if (m && typeof m.then === 'function') { try { delete m.then; } catch (e) { /* ignore */ } }
        mod = m; self.cv = m; done();
      });
    } else if (mod) {
      const prev = mod.onRuntimeInitialized;
      mod.onRuntimeInitialized = () => { if (prev) prev(); done(); };
    }
    const poll = setInterval(() => {
      if (self.cv && self.cv.Mat && self.cv.getBuildInformation) { mod = self.cv; done(); }
      else if (Date.now() - started > 120000) { clearInterval(poll); reject(new Error('OpenCV.js runtime did not start within 2 minutes')); }
    }, 100);
  });
}

async function loadOpenCV() {
  post({ type: 'status', state: 'loading' });
  let lastError = null;
  for (const url of OPENCV_URLS) {
    try {
      importScripts(url);                  // synchronous download + evaluate
      if (typeof self.cv !== 'undefined') { loadedFrom = url; break; }
    } catch (e) {
      lastError = e;                       // 404 or offline: try the next source
    }
  }
  if (typeof self.cv === 'undefined') {
    throw new Error('Could not download OpenCV.js' + (lastError ? ` (${lastError.message})` : ''));
  }
  await waitForRuntime(self.cv);
  const info = self.cv.getBuildInformation();
  const match = /General configuration for OpenCV ([^\s=]+)/.exec(info);
  ready = true;
  post({ type: 'status', state: 'ready', version: match ? match[1] : 'unknown', source: loadedFrom });
}

/** ImageBitmap -> ImageData, scaled so the long side is at most MAX_SIDE. */
function bitmapToImageData(bitmap) {
  const max = self.SalsaPipeline.MAX_SIDE;
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = new OffscreenCanvas(w, h);
  const ctx = canvas.getContext('2d', { willReadFrequently: true });
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();                          // free the bitmap's memory right away
  return ctx.getImageData(0, 0, w, h);
}

const loading = loadOpenCV().catch((err) => {
  post({ type: 'status', state: 'error', message: err.message });
});

self.onmessage = async (event) => {
  const msg = event.data || {};
  if (msg.type !== 'analyze') return;
  await loading;
  if (!ready) {
    post({ type: 'error', id: msg.id, message: 'OpenCV.js is not loaded.' });
    return;
  }
  try {
    const imageData = bitmapToImageData(msg.bitmap);
    const result = self.SalsaPipeline.analyzeShape(imageData, msg.options || {}, msg.reference || null);
    const mem = self.SalsaPipeline.memory;
    result.matsAlive = mem.allocated - mem.freed;      // should always be 0
    result.matsFreedTotal = mem.freed;
    const transfer = result.ok ? [result.pixels.buffer, result.points.buffer] : [];
    post({ type: 'result', id: msg.id, result }, transfer);
  } catch (err) {
    post({ type: 'error', id: msg.id, message: (err && err.message) || String(err) });
  }
};
