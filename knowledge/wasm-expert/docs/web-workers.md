# Web Workers

Source: https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers (fetched 2026-11-22)

- `const w = new Worker('worker.js')` runs the script in a background thread. Inside, the worker *is* the global scope: use `onmessage` / `postMessage` without a prefix.
- Messages are **copied** (structured clone). **Transferables** move ownership instead: `w.postMessage(buf, [buf])` leaves the sender's buffer empty. Same for `ImageBitmap`.
- `importScripts('a.js', 'b.js')` loads scripts synchronously in order; a failed load throws `NETWORK_ERROR` and later code doesn't run (so wrap it in try/catch).
- `w.terminate()` kills the worker immediately (our timeout recovery).
- `w.onerror = (e) => …` receives `message`, `filename`, `lineno`; call `e.preventDefault()` to stop it reaching the console as uncaught.
- No DOM in workers: send results back and let the page update the DOM. `OffscreenCanvas` is available for pixel work.
