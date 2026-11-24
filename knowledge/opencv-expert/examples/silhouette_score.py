"""Worked example (Iris): the silhouette + score + recognition pipeline in OpenCV for Python.
Same steps and numbers as js/pipeline.js (aligned-overlap score; matchShapes reported).
Run from the repo root:  python3 knowledge/opencv-expert/examples/silhouette_score.py
"""
import math, os, sys, itertools
import numpy as np
import cv2

HERE = os.path.dirname(os.path.abspath(__file__))
SAMPLES = os.path.join(HERE, "..", "..", "..", "samples")
MAX_SIDE = 800


def silhouette(bgr, cleanup=3, manual_threshold=None):
    h, w = bgr.shape[:2]
    scale = min(1.0, MAX_SIDE / max(h, w))
    if scale < 1:
        bgr = cv2.resize(bgr, (round(w * scale), round(h * scale)), interpolation=cv2.INTER_AREA)
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    blur = cv2.GaussianBlur(gray, (5, 5), 0)
    if manual_threshold is None:
        _, binary = cv2.threshold(blur, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
    else:
        _, binary = cv2.threshold(blur, manual_threshold, 255, cv2.THRESH_BINARY)
    # Polarity: the frame border is mostly wall, so the wall colour is the background.
    border = np.concatenate([binary[0], binary[-1], binary[:, 0], binary[:, -1]])
    if border.mean() > 127:
        binary = cv2.bitwise_not(binary)
    k = max(3, int(round(max(binary.shape) * 0.004 * cleanup)) | 1)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (k, k))
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, kernel)
    binary = cv2.morphologyEx(binary, cv2.MORPH_OPEN, kernel)
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not contours:
        return None
    c = max(contours, key=cv2.contourArea)
    c = cv2.approxPolyDP(c, 0.001 * cv2.arcLength(c, True), True)   # same simplification as JS
    area = cv2.contourArea(c)
    if area < 0.01 * binary.shape[0] * binary.shape[1]:
        return None
    x, y, bw, bh = cv2.boundingRect(c)
    hull = cv2.convexHull(c)
    return {"contour": c, "area": area, "aspect": bh / bw,
            "solidity": area / max(1.0, cv2.contourArea(hull)), "size": binary.shape}


NORM = 160          # size of the normalised comparison canvas
DILATE = 9          # tolerance for small limb differences (about 6 % of body height)


def normalized_mask(contour):
    """Scale a silhouette to the same height, align its top edge and its centroid, fill it."""
    x, y, w, h = cv2.boundingRect(contour)
    m = cv2.moments(contour)
    cx = m["m10"] / m["m00"]
    s = (NORM * 0.9) / h
    pts = ((contour.reshape(-1, 2) - [cx, y]) * s + [NORM / 2, NORM * 0.05]).round().astype(np.int32)
    mask = np.zeros((NORM, NORM), np.uint8)
    cv2.drawContours(mask, [pts], 0, 255, -1)
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (DILATE, DILATE))
    return cv2.dilate(mask, kernel)


def overlap(a, b):
    """Intersection over union of the two aligned silhouettes (0..1)."""
    ma, mb = normalized_mask(a["contour"]), normalized_mask(b["contour"])
    return cv2.countNonZero(cv2.bitwise_and(ma, mb)) / max(1, cv2.countNonZero(cv2.bitwise_or(ma, mb)))


def score(a, b):
    """Same formula as js/pipeline.js -> scoreShapes()."""
    o = overlap(a, b)
    d = cv2.matchShapes(a["contour"], b["contour"], cv2.CONTOURS_MATCH_I2, 0)   # reported, not scored
    shape = min(100.0, max(0.0, (o - 0.35) / (0.90 - 0.35) * 100))           # 0.35 -> 0 %, 0.90 -> 100 %
    ar = math.exp(-abs(math.log(a["aspect"] / b["aspect"])) / 0.35) * 100
    so = max(0.0, 1 - abs(a["solidity"] - b["solidity"]) / 0.3) * 100
    total = 0.6 * shape + 0.25 * ar + 0.15 * so
    return round(total), d, o


if __name__ == "__main__":
    names = sorted(n for n in os.listdir(SAMPLES) if n.endswith(".jpg"))
    sil = {}
    ok = True
    for n in names:
        s = silhouette(cv2.imread(os.path.join(SAMPLES, n)))
        if s is None:
            print("FAIL no silhouette:", n); ok = False; continue
        sil[n] = s
    print(f"{len(sil)}/{len(names)} sample photos: silhouette found\n")
    refs = [n for n in names if n.endswith("-reference.jpg")]
    atts = [n for n in names if n.endswith("-attempt.jpg")]
    # Recognition test: each attempt must score highest against its own reference,
    # score at least 60 %, and beat the runner-up by at least 10 points.
    print(f"{'pose':20s} {'own':>4s}  {'overlap':>7s} {'matchShapes':>11s}   runner-up")
    for a in atts:
        pose = a[:-len("-attempt.jpg")]
        rows = []
        for r in refs:
            sc, d, o = score(sil[a], sil[r])
            rows.append((sc, r[:-len("-reference.jpg")], d, o))
        rows.sort(reverse=True)
        own = next(x for x in rows if x[1] == pose)
        runner = next(x for x in rows if x[1] != pose)
        verdict = "PASS"
        if rows[0][1] != pose: verdict = "FAIL: best match is " + rows[0][1]
        elif own[0] < 60: verdict = "FAIL: own score below 60"
        elif own[0] - runner[0] < 10: verdict = "FAIL: margin below 10"
        ok &= verdict == "PASS"
        print(f"{pose[7:]:20s} {own[0]:3d}%  {own[3]:7.2f} {own[2]:11.3f}   {runner[1][7:]:18s} {runner[0]:3d}%  {verdict}")
    print("\nRESULT:", "PASS" if ok else "FAIL")
    sys.exit(0 if ok else 1)
