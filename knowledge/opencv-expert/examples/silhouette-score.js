// Worked example (Iris): the JavaScript pipeline with strict Mat bookkeeping.
// This is the shape of js/pipeline.js reduced to its essentials. Every allocation is
// tracked; freeAll() runs in finally, so even an exception cannot leak Wasm memory.
// (Needs a loaded `cv`; the full, tested version is js/pipeline.js + tests/pipeline_check.py.)
function silhouetteScore(imageData, refPoints /* Int32Array or null */) {
  const mats = [];
  const track = (m) => { mats.push(m); return m; };
  try {
    const src = track(cv.matFromImageData(imageData));
    const gray = track(new cv.Mat());
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);
    cv.GaussianBlur(gray, gray, new cv.Size(5, 5), 0, 0, cv.BORDER_DEFAULT);
    const bin = track(new cv.Mat());
    cv.threshold(gray, bin, 0, 255, cv.THRESH_BINARY + cv.THRESH_OTSU);
    // dancer must be white: if the border is mostly white, invert
    const d = bin.data, w = bin.cols, h = bin.rows;
    let white = 0;
    for (let x = 0; x < w; x++) white += (d[x] > 127) + (d[(h - 1) * w + x] > 127);
    if (white > w) cv.bitwise_not(bin, bin);

    const contours = track(new cv.MatVector());
    const hierarchy = track(new cv.Mat());
    cv.findContours(bin, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);
    let best = null, bestArea = 0;
    for (let i = 0; i < contours.size(); i++) {
      const c = track(contours.get(i));             // get() allocates: track it
      const a = cv.contourArea(c);
      if (a > bestArea) { best = c; bestArea = a; }
    }
    if (!best) return { ok: false };
    let distance = null;
    if (refPoints) {
      const ref = track(cv.matFromArray(refPoints.length / 2, 1, cv.CV_32SC2, Array.from(refPoints)));
      distance = cv.matchShapes(best, ref, cv.CONTOURS_MATCH_I2, 0);
    }
    return { ok: true, area: bestArea, points: new Int32Array(best.data32S), distance }; // copy before free
  } finally {
    mats.forEach((m) => m.delete());
  }
}
