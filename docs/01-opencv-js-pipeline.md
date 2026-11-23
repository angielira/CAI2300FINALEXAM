# 01 · OpenCV.js: the vision pipeline

**Question:** which OpenCV.js functions does a Salsa Shape Matcher need, how do you load opencv.js, and how do you know it is ready?

Sources:
- OpenCV.js tutorials root (4.13.0): https://docs.opencv.org/4.13.0/d5/d10/tutorial_js_root.html
- Using OpenCV.js: https://docs.opencv.org/4.13.0/d0/d84/tutorial_js_usage.html
- Image processing / contours / thresholding / morphology / GrabCut tutorials (linked from the root page)
- Structural analysis and shape descriptors (C++ reference for matchShapes, moments, HuMoments): https://docs.opencv.org/4.x/d3/dc0/group__imgproc__shape.html

> Verification status: the docs.opencv.org pages could not be fetched from the build session (the site needed an approval that was not given in time). These notes are written from the content of those official pages as known, and **every function signature was cross-checked by running the same pipeline in OpenCV 5.0 for Python** (`tests/pipeline_check.py`). Re-open the links above before quoting them.

## Loading opencv.js and knowing when it is ready
- opencv.js is one ~10 MB JavaScript file. The official builds on docs.opencv.org embed the WebAssembly binary inside the file, so no separate `.wasm` request is made.
- After the script runs, the WebAssembly runtime still has to compile and start. Only then do `cv.Mat` and friends exist. The tutorial pattern is `cv['onRuntimeInitialized'] = () => { ... }`. Some builds expose a promise-like `cv` instead; robust code handles both and also polls for `cv.Mat` (see `shape.worker.js`).
- `cv.getBuildInformation()` returns the build report; the first line contains the OpenCV version (shown in the app's status pill).
- In this app opencv.js is loaded **once**, inside a Web Worker, with `importScripts()` (see 02).

## The pipeline (silhouette → outline → measures → score)
| Step | Function(s) | Why |
|---|---|---|
| Read pixels | `cv.matFromImageData(imageData)` | In a worker there is no DOM, so `cv.imread(canvasId)` is not available; the worker draws the ImageBitmap on an OffscreenCanvas and reads `ImageData`. On the main thread `cv.imread(img)` does the same job. |
| Grayscale | `cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY)` | Colour of clothes doesn't matter, only light vs dark. |
| Denoise | `cv.GaussianBlur(gray, blur, new cv.Size(5,5), 0, 0, cv.BORDER_DEFAULT)` | Phone-photo noise would make ragged edges. |
| Threshold | `cv.threshold(blur, bin, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU)` | Otsu's method picks the cut between wall and dancer automatically. A manual value is offered as a slider. `cv.adaptiveThreshold` was considered but splits a dark, evenly lit body into fragments; it is better for text (the document scanner) than for silhouettes. |
| Polarity | look at the frame border; `cv.bitwise_not` if needed | The wall touches the border, so whichever colour dominates the border is the background. |
| Clean up | `cv.getStructuringElement(cv.MORPH_ELLIPSE, size)`, `cv.morphologyEx(..., cv.MORPH_CLOSE)` then `MORPH_OPEN` | Close small gaps (between arm and body), remove specks. Kernel ≈ 0.4 % × strength of the long side. |
| Outline | `cv.findContours(bin, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)` | External outlines only; the largest by `cv.contourArea` is the dancer (or the couple, since touching bodies merge). |
| Optional refine | `cv.grabCut(rgb, mask, rect, bgd, fgd, iters, cv.GC_INIT_WITH_MASK)` | Graph-cut foreground extraction, seeded from the threshold mask. Needs a 3-channel image (`COLOR_RGBA2RGB`). Slower: off by default. |
| Simplify | `cv.approxPolyDP(c, out, 0.001 * cv.arcLength(c, true), true)` | Fewer points to store; shape unchanged (tested). |
| Measure | `cv.boundingRect`, `cv.convexHull(c, hull, false, true)`, `cv.contourArea` | Height ÷ width (aspect) and solidity = area ÷ hull area ("how open" the shape is). |
| Compare | `cv.matchShapes(a, b, cv.CONTOURS_MATCH_I2, 0)` | Distance between the two shapes' **Hu moments** (7 numbers invariant to position, scale and rotation). 0 = identical. |
| Draw | `cv.drawContours(out, vec, i, color, thickness, cv.LINE_AA, hierarchy, 0)` | Outline + hull on the result. The page draws it with `ctx.putImageData` (in a worker, `cv.imshow` has no canvas to draw on). |

### Measured on the sample photos (tests/pipeline_check.py, OpenCV 5.0 Python)
| Pair | matchShapes (I2) | Score |
|---|---|---|
| dip-attempt vs dip-reference | 0.63 | 93 % |
| styling-attempt vs styling-reference | 1.05 | 82 % |
| dip vs styling (4 cross pairs) | 2.57 – 2.81 | 23 – 27 % |

Score formula (same in Python and JS): `shape = 100 / (1 + (d / 1.5)^3)` (so a distance of 1.5 scores 50 %), blended 60 % shape + 25 % proportions (aspect ratio) + 15 % openness (solidity). Proportions are added because Hu moments ignore rotation, and in dance a tilted shape is a different shape.

## The one rule: delete every Mat
Every `cv.Mat`, `cv.MatVector` and every Mat returned by `contours.get(i)` lives in WebAssembly memory and must be freed with `.delete()`. The app registers each one with a tracker and frees all of them in a `finally` block, then reports "Mats still in memory: 0".

## Honest limits
- Classic OpenCV sees outlines, not joints. Elbow/knee positions need deep-learning pose models (e.g. MediaPipe/OpenPose via `cv.dnn`), which are large and outside this exam's scope.
- A busy background or clothes the same colour as the wall break the threshold; GrabCut and the manual slider help.
