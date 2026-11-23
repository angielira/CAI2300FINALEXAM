# Loading OpenCV.js and knowing when it is ready

Sources: https://docs.opencv.org/4.13.0/d0/d84/tutorial_js_usage.html · https://docs.opencv.org/4.13.0/d5/d10/tutorial_js_root.html
(Not fetched in the build session: approval needed. Re-verify before quoting. Behaviour below is what `shape.worker.js` relies on.)

- `opencv.js` is a single script (~10 MB for the official build). The official build embeds the WebAssembly binary, so loading the script is all you need.
- After the script evaluates, the Wasm runtime is compiled asynchronously. `cv.Mat` and the functions only exist once it is initialised.
- Tutorial pattern (main thread): `<script async src="opencv.js" onload="onOpenCvReady();">` and inside it `cv['onRuntimeInitialized'] = () => { /* ready */ }`.
- Some builds export `cv` as a promise-like module: `cv = await cv` (beware: an Emscripten module's own `.then` can loop if awaited repeatedly; resolve once and delete `then`).
- Robust readiness test: `typeof cv !== 'undefined' && cv.Mat && cv.getBuildInformation`.
- `cv.getBuildInformation()` → text report; its first line has the version ("General configuration for OpenCV 4.13.0").
- In a worker, use `importScripts(url)`. `cv.imread`/`cv.imshow` need a DOM canvas, so use `cv.matFromImageData(imageData)` and return pixels with `new Uint8ClampedArray(mat.data)`.
