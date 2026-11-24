# 01 · OpenCV.js: the vision pipeline

**Question:** which OpenCV.js functions does a Ballet Pose Matcher need, how do you load opencv.js, and how do you know it is ready?

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
| Compare (scored) | `cv.moments` (centroid), `cv.Mat.zeros`, `cv.drawContours(..., -1)` (fill), `cv.dilate`, `cv.bitwise_and`, `cv.bitwise_or`, `cv.countNonZero` | **Aligned-silhouette overlap**: both contours scaled to the same height, top edges and centroids aligned on a 160×160 canvas, filled, dilated 9 px (limb tolerance), then intersection ÷ union. Rotation-sensitive, which is right for dance. |
| Recognise | same overlap score against every reference in the library, best first | "Looks most like: Arabesque · 75 %" (sure when best ≥ 60 % and ≥ 10 points ahead). |
| Compare (reported) | `cv.matchShapes(a, b, cv.CONTOURS_MATCH_I2, 0)` | Distance between the two shapes' **Hu moments** (7 numbers invariant to position, scale and rotation). 0 = identical. |
| Draw | `cv.drawContours(out, vec, i, color, thickness, cv.LINE_AA, hierarchy, 0)` | Outline + hull on the result. The page draws it with `ctx.putImageData` (in a worker, `cv.imshow` has no canvas to draw on). |

### Measured on the sample photos (tests/pipeline_check.py, OpenCV 5.0 Python)
16 ballet poses, each with a reference and an attempt (`samples/ballet-<pose>-reference|attempt.jpg`). The test is **recognition**: each attempt must score highest against its own reference, at least 60 %, and beat the runner-up by at least 10 points.

```

pose                  own  overlap matchShapes   runner-up
a-la-seconde          78%     0.72       1.148   attitude-devant     44%  PASS
arabesque             75%     0.69       0.346   penche              38%  PASS
attitude              86%     0.77       0.474   reverence           46%  PASS
attitude-devant       77%     0.72       0.439   developpe-devant    45%  PASS
developpe-devant      82%     0.74       7.630   tendu-seconde       41%  PASS
ecarte                83%     0.76       0.229   attitude-devant     61%  PASS
fifth-en-haut         92%     0.84       8.783   first-bras-bas      64%  PASS
first-bras-bas        84%     0.77       0.297   fifth-en-haut       63%  PASS
fourth-croise         76%     0.75       1.024   fifth-en-haut       39%  PASS
grand-jete            66%     0.59       8.152   penche              18%  PASS
penche                78%     0.75       0.391   a-la-seconde        38%  PASS
retire                93%     0.86       1.073   fifth-en-haut       56%  PASS
reverence             69%     0.68       0.794   ecarte              33%  PASS
second-plie           80%     0.73       0.603   attitude            35%  PASS
tendu-devant          78%     0.76       0.548   tendu-seconde       59%  PASS
tendu-seconde         76%     0.69       8.916   tendu-devant        57%  PASS
```

All 16 PASS. Note the matchShapes column: 7.6–8.9 for the *same* pose (développé devant, fifth en haut, grand jeté, tendu à la seconde).

**Why overlap, not Hu moments:** the first sample set (a salsa dip and one styling pose, 2026-11-22) separated fine with `matchShapes`. With thin-limbed poses (four salsa styling poses, then 16 ballet poses) it failed: Hu moments 5–7 are close to zero and flip sign between near-identical poses (hip-hand: 8.05 for the *same* pose, while two *different* poses scored 0.32). Even the first four Hu moments could not separate the poses, because thin arms barely change them. Aligned overlap separates them with a clear gap (same ≥ 0.71, different ≤ 0.48).

Score formula (same in Python and JS): `outline = clamp((overlap − 0.35) / (0.90 − 0.35)) × 100`, blended 60 % outline + 25 % proportions (aspect ratio) + 15 % openness (solidity).

## The one rule: delete every Mat
Every `cv.Mat`, `cv.MatVector` and every Mat returned by `contours.get(i)` lives in WebAssembly memory and must be freed with `.delete()`. The app registers each one with a tracker and frees all of them in a `finally` block, then reports "Mats still in memory: 0".

## Honest limits
- Classic OpenCV sees outlines, not joints. Elbow/knee positions need deep-learning pose models (e.g. MediaPipe/OpenPose via `cv.dnn`), which are large and outside this exam's scope.
- A busy background or clothes the same colour as the wall break the threshold; GrabCut and the manual slider help.
