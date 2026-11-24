# Contours, shape measures and matchShapes

Sources: OpenCV.js contours tutorials (features, properties, more functions) from https://docs.opencv.org/4.13.0/d5/d10/tutorial_js_root.html · Structural analysis reference: https://docs.opencv.org/4.x/d3/dc0/group__imgproc__shape.html (not fetched in the build session; verified in OpenCV 5.0 Python).

- `cv.findContours(bin, contours /*MatVector*/, hierarchy /*Mat*/, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)`: outer outlines only. White = object.
- `cv.contourArea(c)`, `cv.arcLength(c, true)`, `cv.boundingRect(c)` → `{x,y,width,height}`, `cv.convexHull(c, hull, false, true)`.
- Solidity = area / hull area (spread limbs → low). Aspect = height / width. Extent = area / box area.
- `cv.approxPolyDP(c, out, eps, true)`: eps = 0.001 × perimeter keeps the shape (scores moved < 2 points) and shrinks storage.
- `cv.moments(c)` → spatial and central moments; Hu moments are 7 combinations invariant to translation, scale and rotation (the 7th flips sign on mirroring).
- `cv.matchShapes(a, b, method, 0)` compares log-scaled Hu moments. Methods I1/I2/I3 = `cv.CONTOURS_MATCH_I1..3` (1..3). 0 = identical. We use **I2**.
- **Hu moments are unstable for thin-limbed poses.** Measured on thin-limbed samples (salsa styling, then 16 ballet poses): the same pose gave distances up to 8.9 while two different poses gave 0.32, because Hu 5–7 are near zero and flip sign. So matchShapes is reported but not scored.
- **Scored instead: aligned overlap.** Scale both contours to the same height, align top edges and centroids (`cv.moments` → m10/m00) on a 160×160 canvas, fill with `cv.drawContours(mask, vec, 0, color, -1, …)`, `cv.dilate` with a 9×9 ellipse, then `cv.countNonZero(and) / cv.countNonZero(or)`. On the 16 ballet poses every attempt scores highest against its own reference (own 66–93 %, ≥ 18 points ahead). Score: `clamp((o−0.35)/(0.90−0.35))`, blended 60/25/15 with proportions and openness. The same score ranks the whole library for pose recognition.
- Matching a stored contour: `cv.matFromArray(n, 1, cv.CV_32SC2, Array.from(points))`.
