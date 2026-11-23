# Contours, shape measures and matchShapes

Sources: OpenCV.js contours tutorials (features, properties, more functions) from https://docs.opencv.org/4.13.0/d5/d10/tutorial_js_root.html · Structural analysis reference: https://docs.opencv.org/4.x/d3/dc0/group__imgproc__shape.html (not fetched in the build session; verified in OpenCV 5.0 Python).

- `cv.findContours(bin, contours /*MatVector*/, hierarchy /*Mat*/, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE)`: outer outlines only. White = object.
- `cv.contourArea(c)`, `cv.arcLength(c, true)`, `cv.boundingRect(c)` → `{x,y,width,height}`, `cv.convexHull(c, hull, false, true)`.
- Solidity = area / hull area (spread limbs → low). Aspect = height / width. Extent = area / box area.
- `cv.approxPolyDP(c, out, eps, true)`: eps = 0.001 × perimeter keeps the shape (scores moved < 2 points) and shrinks storage.
- `cv.moments(c)` → spatial and central moments; Hu moments are 7 combinations invariant to translation, scale and rotation (the 7th flips sign on mirroring).
- `cv.matchShapes(a, b, method, 0)` compares log-scaled Hu moments. Methods I1/I2/I3 = `cv.CONTOURS_MATCH_I1..3` (1..3). 0 = identical. We use **I2**.
- Measured on the samples: same-shape distances 0.63 and 1.05; different-shape 2.57–2.81. Mapping `100/(1+(d/1.5)^3)` gives 93 %, 82 % vs 23–27 % (after blending with proportions and openness).
- Matching a stored contour: `cv.matFromArray(n, 1, cv.CV_32SC2, Array.from(points))`.
