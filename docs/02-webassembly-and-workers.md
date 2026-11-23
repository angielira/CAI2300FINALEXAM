# 02 · WebAssembly and the Web Worker

**Question:** how does WebAssembly make OpenCV.js fast, why must every `cv.Mat` be deleted, and how does the heavy work run in a Web Worker so the page never freezes?

Sources:
- https://webassembly.org/ (not fetched in the build session: needed approval; summarised from the official page as known)
- MDN WebAssembly: https://developer.mozilla.org/en-US/docs/WebAssembly
- MDN `WebAssembly.instantiateStreaming()`: https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/JavaScript_interface/instantiateStreaming_static (fetched 2026-11-22)
- MDN Using Web Workers: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers (fetched 2026-11-22)

## Why it is fast
- WebAssembly is a compact binary instruction format that browsers compile to machine code. It runs at near-native speed inside the same sandbox and security rules as JavaScript.
- OpenCV is C++. Emscripten compiles it to WebAssembly and generates the JavaScript bindings (`cv.Mat`, `cv.threshold`, …). When the app calls `cv.findContours`, the loop over 500 000 pixels runs as Wasm, not as JavaScript.
- MDN calls `instantiateStreaming` the most efficient way to load Wasm: it compiles while downloading. It **rejects with a TypeError unless the server sends `application/wasm`** (relevant only if you self-host a separate `.wasm`; the official opencv.js embeds it).
- Measure, don't assume (lecture slide 5): the app shows the pipeline time for every photo.

## Why every Mat must be deleted
- A Wasm module has one linear memory (a big `ArrayBuffer`). A `cv.Mat` is a small JS handle pointing at pixels inside that memory.
- JavaScript's garbage collector frees the handle but **not** the pixels. Forget `.delete()` and every analysis leaks ~1–2 MB until the tab slows down or crashes.
- Easy-to-miss allocations: `contours.get(i)` (returns a new Mat), `src.clone()`, `cv.getStructuringElement()`, `cv.matFromArray()`, `cv.MatVector`.
- Pattern used: `const t = makeTracker(); try { ... t.track(new cv.Mat()) ... } finally { t.freeAll(); }`. The worker reports `allocated - freed` (always 0).

## The Web Worker
- `new Worker('shape.worker.js')` starts a background thread. Workers have no DOM; they talk with `postMessage` / `onmessage`, and data is **copied** unless it is **transferred**.
- Transfer = move ownership, no copy: `worker.postMessage({bitmap}, [bitmap])` for the photo, and `postMessage({result}, [pixels.buffer, points.buffer])` on the way back.
- `importScripts('https://docs.opencv.org/4.13.0/opencv.js')` loads OpenCV once per worker (synchronously, inside the worker, so the page stays responsive). A failed load throws a NetworkError, which the worker catches and reports as a status message.
- `OffscreenCanvas` lets the worker scale the photo (max 800 px long side) and read its pixels.
- **Always reply**: every `analyze` request gets a `result` or an `error` message. The page adds a 30-second timer per request; if it fires, the page calls `worker.terminate()`, starts a fresh worker and tells the user. `worker.onerror` catches crashes.

## Message protocol
```
page → worker  { type:'analyze', id, bitmap, options:{cleanup, threshold, grabcut}, reference:{points, aspect, solidity}|null }
worker → page  { type:'status', state:'loading'|'ready'|'error', version?, message? }
worker → page  { type:'result', id, result:{ ok, width, height, pixels, points, metrics, score, ms, matsAlive } }
worker → page  { type:'error', id, message }
```
