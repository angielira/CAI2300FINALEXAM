"""Check the Salsa Shape Matcher vision pipeline with Python OpenCV.

This mirrors js/pipeline.js step for step (same functions, same parameters), so it
proves the algorithm on the sample photos without needing a browser.
Run:  python3 tests/pipeline_check.py
"""
import math, os, sys, itertools
import numpy as np
import cv2

HERE = os.path.dirname(os.path.abspath(__file__))
SAMPLES = os.path.join(HERE, "..", "samples")
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


def score(a, b):
    """Same formula as js/pipeline.js -> scoreShapes()."""
    d = cv2.matchShapes(a["contour"], b["contour"], cv2.CONTOURS_MATCH_I2, 0)
    shape = 100 / (1 + (d / 1.5) ** 3)      # 0 -> 100%, 1.5 -> 50%
    ar = math.exp(-abs(math.log(a["aspect"] / b["aspect"])) / 0.35) * 100
    so = max(0.0, 1 - abs(a["solidity"] - b["solidity"]) / 0.3) * 100
    total = 0.6 * shape + 0.25 * ar + 0.15 * so
    return round(total), d


if __name__ == "__main__":
    names = sorted(n for n in os.listdir(SAMPLES) if n.endswith(".jpg"))
    sil = {}
    ok = True
    for n in names:
        s = silhouette(cv2.imread(os.path.join(SAMPLES, n)))
        if s is None:
            print("FAIL no silhouette:", n); ok = False; continue
        sil[n] = s
        print(f"{n:24s} area={s['area']:8.0f} aspect={s['aspect']:.2f} solidity={s['solidity']:.2f} points={len(s['contour'])}")
    print()
    for a, b in itertools.combinations(names, 2):
        sc, d = score(sil[a], sil[b])
        same = a.split("-")[0] == b.split("-")[0]
        print(f"{a:24s} vs {b:24s} matchShapes={d:.3f} score={sc:3d}%  {'SAME shape' if same else 'different'}")
        if same and sc < 70: ok = False; print("  FAIL: same shape should score >= 70")
        if not same and sc > 55: ok = False; print("  FAIL: different shapes should score <= 55")
    print("\nRESULT:", "PASS" if ok else "FAIL")
    sys.exit(0 if ok else 1)
