# GrabCut (foreground extraction)

Source: OpenCV.js "Foreground Extraction using GrabCut Algorithm" tutorial (linked from https://docs.opencv.org/4.13.0/d5/d10/tutorial_js_root.html; not fetched in the build session).

- `cv.grabCut(img /*8UC3*/, mask /*8UC1*/, rect, bgdModel, fgdModel, iterCount, mode)`. The image must be **3-channel**: convert RGBA with `cv.COLOR_RGBA2RGB`.
- Mask values: 0 = sure background, 1 = sure foreground, 2 = probable background, 3 = probable foreground. Foreground = 1 or 3.
- `cv.GC_INIT_WITH_RECT`: everything outside `rect` is background. `cv.GC_INIT_WITH_MASK` (value 1): start from your own mask. We seed it from the threshold silhouette (3 inside the shape, 2 elsewhere in the box, 0 outside), which converges in 2 iterations.
- It is slow (seconds at 800 px), so it is an opt-in toggle. Free `rgb`, `mask`, `bgdModel`, `fgdModel`.
