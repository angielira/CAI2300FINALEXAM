---
name: wasm-memory-and-workers
description: Keep OpenCV.js (WebAssembly) memory-safe and off the main thread: Web Worker loading, transfers, timeouts, restarts and Mat leak checks.
---

# wasm-memory-and-workers

Shared by: `wasm-expert`, `opencv-expert`, `frontend-engineer`

1. OpenCV.js is loaded once per worker with `importScripts` (official URL list in `shape.worker.js`); readiness = `cv.Mat` exists (handle `onRuntimeInitialized` and promise-like builds).
2. Transfer, don't copy: ImageBitmap in, `pixels.buffer` and `points.buffer` out.
3. The worker always replies (`result` or `error`); the page times out after 30 s, calls `terminate()` and starts a new worker.
4. Leak check: `matsAlive` in every result must be 0. If not, find the allocation that skipped `t.track()`.
5. Never touch the DOM from the worker; never run OpenCV on the main thread.
