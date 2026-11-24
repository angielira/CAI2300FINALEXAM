/* Salsa Shape Matcher: the OpenCV.js vision pipeline.
 * Owner: Iris (opencv-expert). Reviewed by Forge (wasm-expert) for memory safety.
 *
 * Runs inside shape.worker.js (a Web Worker). Every cv.Mat / cv.MatVector that is
 * created here is registered with `track()` and freed in a `finally` block, so a
 * failed or successful run never leaks WebAssembly memory.
 *
 * Mirrors tests/pipeline_check.py step for step (same functions, same numbers).
 */
/* global cv */
'use strict';

const MAX_SIDE = 800;               // cap the photo size (Forge + Iris agreed: memory and speed)
const NORM = 160;                   // normalised comparison canvas (same as tests/pipeline_check.py)
const DILATE = 9;                   // tolerance for small limb differences (~6 % of body height)
const OVERLAP_ZERO = 0.35;          // overlap that scores 0 %
const OVERLAP_FULL = 0.90;          // overlap that scores 100 %
const OVERLAY_RGBA = [255, 70, 85, 255];   // salsa red outline
const HULL_RGBA = [255, 196, 0, 255];      // gold convex hull

/** Leak counter, reported back to the page so QA can prove "0 Mats alive". */
const memory = { allocated: 0, freed: 0 };

function makeTracker() {
  const list = [];
  return {
    track(m) { list.push(m); memory.allocated++; return m; },
    freeAll() {
      for (const m of list) {
        try { if (m && !m.isDeleted()) { m.delete(); memory.freed++; } } catch (e) { /* already gone */ }
      }
      list.length = 0;
    },
  };
}

function constant(name, fallback) {
  return typeof cv[name] === 'number' ? cv[name] : fallback;
}

/**
 * Turn the aligned-silhouette overlap into a friendly 0-100 score (same as the Python check).
 * matchShapes (Hu moments) is still measured and reported, but not scored: on thin-limbed
 * styling poses its higher-order Hu terms flip sign between near-identical shapes.
 */
function scoreShapes(overlapRatio, attempt, reference) {
  const shape = Math.min(100, Math.max(0, (overlapRatio - OVERLAP_ZERO) / (OVERLAP_FULL - OVERLAP_ZERO) * 100));
  const aspect = Math.exp(-Math.abs(Math.log(attempt.aspect / reference.aspect)) / 0.35) * 100;
  const solidity = Math.max(0, 1 - Math.abs(attempt.solidity - reference.solidity) / 0.3) * 100;
  return {
    total: Math.round(0.6 * shape + 0.25 * aspect + 0.15 * solidity),
    parts: { shape: Math.round(shape), proportions: Math.round(aspect), openness: Math.round(solidity) },
  };
}

/**
 * Scale a contour to the same height, align its top edge and its centroid, and fill it
 * on a NORM x NORM canvas, slightly dilated. Returns a tracked 8-bit mask.
 */
function normalizedMask(contourMat, t) {
  const r = cv.boundingRect(contourMat);
  const m = cv.moments(contourMat, false);
  const cx = m.m10 / m.m00;
  const s = (NORM * 0.9) / r.height;
  const src = contourMat.data32S;
  const pts = new Array(src.length);
  for (let i = 0; i < src.length; i += 2) {
    pts[i] = Math.round((src[i] - cx) * s + NORM / 2);
    pts[i + 1] = Math.round((src[i + 1] - r.y) * s + NORM * 0.05);
  }
  const scaled = t.track(cv.matFromArray(src.length / 2, 1, cv.CV_32SC2, pts));
  const vec = t.track(new cv.MatVector());
  vec.push_back(scaled);
  const mask = t.track(cv.Mat.zeros(NORM, NORM, cv.CV_8UC1));
  const noHierarchy = t.track(new cv.Mat());
  cv.drawContours(mask, vec, 0, new cv.Scalar(255, 255, 255, 255), -1, cv.LINE_8, noHierarchy, 0);   // -1 = filled
  const kernel = t.track(cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(DILATE, DILATE)));
  const out = t.track(new cv.Mat());
  cv.dilate(mask, out, kernel, new cv.Point(-1, -1), 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
  return out;
}

/** Intersection over union of two aligned silhouettes, 0..1. */
function silhouetteOverlap(a, b, t) {
  const ma = normalizedMask(a, t), mb = normalizedMask(b, t);
  const inter = t.track(new cv.Mat()), union = t.track(new cv.Mat());
  cv.bitwise_and(ma, mb, inter);
  cv.bitwise_or(ma, mb, union);
  return cv.countNonZero(inter) / Math.max(1, cv.countNonZero(union));
}

/** True when most of the frame border is white, i.e. the wall came out as foreground. */
function borderIsWhite(bin) {
  const { rows, cols } = bin;
  const d = bin.data;
  let white = 0, total = 0;
  for (let x = 0; x < cols; x++) { white += d[x] > 127; white += d[(rows - 1) * cols + x] > 127; total += 2; }
  for (let y = 0; y < rows; y++) { white += d[y * cols] > 127; white += d[y * cols + cols - 1] > 127; total += 2; }
  return white / total > 0.5;
}

/** Largest external contour of a binary image. Returns a tracked Mat or null. */
function largestContour(bin, t) {
  const contours = t.track(new cv.MatVector());
  const hierarchy = t.track(new cv.Mat());
  cv.findContours(bin, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
  let best = null, bestArea = 0;
  for (let i = 0; i < contours.size(); i++) {
    const c = t.track(contours.get(i));          // get() returns a NEW Mat: it must be freed too
    const a = cv.contourArea(c, false);
    if (a > bestArea) { bestArea = a; best = c; }
  }
  return { contour: best, area: bestArea };
}

/** Optional: refine the silhouette with GrabCut, seeded from the threshold mask. */
function grabCutRefine(src, bin, rect, t) {
  const rgb = t.track(new cv.Mat());
  cv.cvtColor(src, rgb, cv.COLOR_RGBA2RGB);
  const mask = t.track(new cv.Mat(bin.rows, bin.cols, cv.CV_8UC1));
  const GC_BGD = 0, GC_PR_BGD = 2, GC_PR_FGD = 3;
  const m = mask.data, b = bin.data, cols = bin.cols;
  for (let y = 0; y < bin.rows; y++) {
    for (let x = 0; x < cols; x++) {
      const i = y * cols + x;
      const inside = x >= rect.x && x < rect.x + rect.width && y >= rect.y && y < rect.y + rect.height;
      m[i] = !inside ? GC_BGD : (b[i] > 127 ? GC_PR_FGD : GC_PR_BGD);
    }
  }
  const bgd = t.track(new cv.Mat());
  const fgd = t.track(new cv.Mat());
  cv.grabCut(rgb, mask, rect, bgd, fgd, 2, constant('GC_INIT_WITH_MASK', 1));
  const out = t.track(new cv.Mat(bin.rows, bin.cols, cv.CV_8UC1));
  // Re-read both views: grabCut and the new Mat may grow Wasm memory, which detaches `m`.
  const gm = mask.data, o = out.data;
  for (let i = 0; i < gm.length; i++) o[i] = (gm[i] === 1 || gm[i] === 3) ? 255 : 0;
  return out;
}

/**
 * Analyze one photo.
 * @param {ImageData} imageData  RGBA pixels, already scaled to MAX_SIDE by the worker
 * @param {{cleanup:number, threshold:(number|null), grabcut:boolean}} opts
 * @param {null|{points:Int32Array, aspect:number, solidity:number}} reference
 */
function analyzeShape(imageData, opts, reference) {
  const t0 = performance.now();
  const t = makeTracker();
  try {
    const src = t.track(cv.matFromImageData(imageData));
    const gray = t.track(new cv.Mat());
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    const blur = t.track(new cv.Mat());
    cv.GaussianBlur(gray, blur, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);

    // 1. Threshold: Otsu picks the cut automatically, or the user sets it with the slider.
    const bin = t.track(new cv.Mat());
    let thresholdUsed;
    if (opts.threshold == null) {
      const otsu = cv.threshold(blur, bin, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
      thresholdUsed = typeof otsu === 'number' ? otsu : null;     // Otsu's chosen cut, if reported
    } else {
      cv.threshold(blur, bin, opts.threshold, 255, cv.THRESH_BINARY);
      thresholdUsed = opts.threshold;
    }
    // 2. Polarity: the dancer must be white. The frame border is mostly wall.
    if (borderIsWhite(bin)) cv.bitwise_not(bin, bin);

    // 3. Clean up: close small gaps, remove specks.
    const k = Math.max(3, Math.round(Math.max(bin.rows, bin.cols) * 0.004 * opts.cleanup) | 1);
    const kernel = t.track(cv.getStructuringElement(cv.MORPH_ELLIPSE, new cv.Size(k, k)));
    const anchor = new cv.Point(-1, -1);
    const closed = t.track(new cv.Mat());
    cv.morphologyEx(bin, closed, cv.MORPH_CLOSE, kernel, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());
    let clean = t.track(new cv.Mat());
    cv.morphologyEx(closed, clean, cv.MORPH_OPEN, kernel, anchor, 1, cv.BORDER_CONSTANT, cv.morphologyDefaultBorderValue());

    // 4. The dancer (or the couple) is the largest outline.
    let found = largestContour(t.track(clean.clone()), t);
    const minArea = 0.01 * clean.rows * clean.cols;
    if (!found.contour || found.area < minArea) {
      return { ok: false, reason: 'no-shape', ms: performance.now() - t0, thresholdUsed };
    }

    // 5. Optional GrabCut refinement around the found shape.
    if (opts.grabcut) {
      const r = cv.boundingRect(found.contour);
      const padX = Math.round(r.width * 0.08), padY = Math.round(r.height * 0.08);
      const x = Math.max(1, r.x - padX), y = Math.max(1, r.y - padY);
      const rect = new cv.Rect(x, y,
        Math.min(clean.cols - x - 1, r.width + 2 * padX), Math.min(clean.rows - y - 1, r.height + 2 * padY));
      clean = grabCutRefine(src, clean, rect, t);
      found = largestContour(t.track(clean.clone()), t);
      if (!found.contour || found.area < minArea) {
        return { ok: false, reason: 'no-shape', ms: performance.now() - t0, thresholdUsed };
      }
    }

    // 6. Simplify a little (smaller to store, same shape), then measure.
    const contour = t.track(new cv.Mat());
    cv.approxPolyDP(found.contour, contour, 0.001 * cv.arcLength(found.contour, true), true);
    const rect = cv.boundingRect(contour);
    const hull = t.track(new cv.Mat());
    cv.convexHull(contour, hull, false, true);
    const area = cv.contourArea(contour, false);
    const hullArea = Math.max(1, cv.contourArea(hull, false));
    const metrics = {
      area: Math.round(area),
      width: rect.width, height: rect.height,
      aspect: rect.height / rect.width,             // tall & narrow > 1, low & wide < 1
      solidity: area / hullArea,                    // low = limbs spread out, high = compact
      extent: area / (rect.width * rect.height),
      frameCoverage: (rect.width * rect.height) / (clean.rows * clean.cols),
      thresholdUsed: thresholdUsed == null ? null : Math.round(thresholdUsed),
      points: contour.rows,
    };

    // 7. Compare with the reference shape: aligned-silhouette overlap (scored) + Hu moments (reported).
    let score = null;
    if (reference && reference.points && reference.points.length >= 6) {
      const ref = t.track(cv.matFromArray(reference.points.length / 2, 1, cv.CV_32SC2, Array.from(reference.points)));
      const overlapRatio = silhouetteOverlap(contour, ref, t);
      const distance = cv.matchShapes(contour, ref, constant('CONTOURS_MATCH_I2', 2), 0);
      score = { distance, overlap: overlapRatio, ...scoreShapes(overlapRatio, metrics, reference) };
    }

    // 8. Draw the result: tinted silhouette, gold hull, red outline.
    const out = t.track(src.clone());
    const od = out.data, md = clean.data;
    for (let i = 0, p = 0; i < md.length; i++, p += 4) {
      if (md[i] > 127) {
        od[p] = (od[p] * 0.55 + 255 * 0.45) | 0;
        od[p + 1] = (od[p + 1] * 0.55 + 70 * 0.45) | 0;
        od[p + 2] = (od[p + 2] * 0.55 + 85 * 0.45) | 0;
      }
    }
    const vec = t.track(new cv.MatVector());
    vec.push_back(contour);
    vec.push_back(hull);
    const noHierarchy = t.track(new cv.Mat());
    const thick = Math.max(2, Math.round(Math.max(out.cols, out.rows) / 260));
    cv.drawContours(out, vec, 1, new cv.Scalar(...HULL_RGBA), Math.max(1, thick - 1), cv.LINE_AA, noHierarchy, 0);
    cv.drawContours(out, vec, 0, new cv.Scalar(...OVERLAY_RGBA), thick, cv.LINE_AA, noHierarchy, 0);

    return {
      ok: true,
      width: out.cols,
      height: out.rows,
      pixels: new Uint8ClampedArray(out.data),       // copy out of Wasm memory before freeing
      points: new Int32Array(contour.data32S),       // x0,y0,x1,y1,... for storage and matching
      metrics,
      score,
      ms: performance.now() - t0,
    };
  } finally {
    t.freeAll();                                    // the one rule: free every Mat, always
  }
}

if (typeof self !== 'undefined') {
  self.SalsaPipeline = { analyzeShape, scoreShapes, memory, MAX_SIDE };
}
