---
name: opencv-js-pipeline
description: Build, debug and calibrate the OpenCV.js silhouette pipeline (threshold, morphology, contours, GrabCut, matchShapes) for the Salsa Shape Matcher.
---

# opencv-js-pipeline

Shared by: `opencv-expert`, `wasm-expert`, `qa-tester`, `salsa-coach`

1. Read `docs/01-opencv-js-pipeline.md` and `js/pipeline.js`.
2. Keep the step order: matFromImageData → cvtColor(RGBA2GRAY) → GaussianBlur 5×5 → threshold (Otsu or manual) → border-polarity check → morphologyEx CLOSE then OPEN → findContours(RETR_EXTERNAL) → largest contour → optional grabCut(GC_INIT_WITH_MASK) → approxPolyDP(0.001·arcLength) → boundingRect / convexHull / contourArea → compare: aligned-silhouette overlap (scored; moments centroid, filled drawContours, dilate 9, and/or + countNonZero) and matchShapes(CONTOURS_MATCH_I2) (reported only).
3. Any change to a parameter or the score formula must be made in **both** `js/pipeline.js` and `tests/pipeline_check.py`, then run `python3 tests/pipeline_check.py` (it must print `RESULT: PASS`: same-pose pairs ≥ 70 %, different poses ≤ 55 %).
4. Every new Mat/MatVector, including `contours.get(i)`, goes through `t.track()`; nothing is freed by hand outside `freeAll()`.
5. Report measured numbers (distances and scores), not impressions.
