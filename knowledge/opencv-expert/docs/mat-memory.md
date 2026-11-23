# cv.Mat and delete()

Sources: https://docs.opencv.org/4.13.0/de/d06/tutorial_js_basic_ops.html (Basic operations on images; not fetched in the build session, re-verify) · https://developer.mozilla.org/en-US/docs/WebAssembly

- Every image is a `cv.Mat`: rows, cols, type (`cv.CV_8UC4` RGBA, `cv.CV_8UC1` gray/mask, `cv.CV_32SC2` contour points), and `data` / `data32S` typed-array views into WebAssembly memory.
- **The browser will not free a Mat.** Call `mat.delete()` when done. Same for `cv.MatVector`, the Mats returned by `vector.get(i)`, `mat.clone()`, `cv.getStructuringElement`, `cv.matFromArray`, `cv.matFromImageData`.
- `cv.Size`, `cv.Point`, `cv.Rect`, `cv.Scalar` are plain JS values: nothing to delete.
- Views into `mat.data` become invalid after `delete()` (and can be invalidated if Wasm memory grows). Copy out first: `new Uint8ClampedArray(mat.data)`.
- Pattern: register each allocation with a tracker and free all in `finally` (see `examples/silhouette-score.js`).
