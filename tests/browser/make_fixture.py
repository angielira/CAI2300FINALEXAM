"""Build a test fixture: what the worker would return for high-arm attempt vs high-arm reference.
Uses tests/pipeline_check.py (Python OpenCV, same steps as js/pipeline.js), then draws the
same overlay. Output: tests/browser/fixtures/high-arm.json (git-ignored, regenerate any time)."""
import base64, json, math, os, sys
import cv2, numpy as np
HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, os.path.join(HERE, ".."))
import pipeline_check as P

def run(name):
    bgr = cv2.imread(os.path.join(HERE, "..", "..", "samples", name))
    h, w = bgr.shape[:2]; s = min(1, P.MAX_SIDE / max(h, w))
    bgr = cv2.resize(bgr, (round(w * s), round(h * s)), interpolation=cv2.INTER_AREA)
    sil = P.silhouette(bgr)
    return bgr, sil

ref_img, ref = run("styling-high-arm-reference.jpg")
img, att = run("styling-high-arm-attempt.jpg")
total, d, o = P.score(att, ref)
mask = np.zeros(img.shape[:2], np.uint8); cv2.drawContours(mask, [att["contour"]], 0, 255, -1)
rgba = cv2.cvtColor(img, cv2.COLOR_BGR2RGBA).astype(np.float32)
tint = np.array([255, 70, 85, 255], np.float32)
rgba[mask > 0] = rgba[mask > 0] * 0.55 + tint * 0.45; rgba[..., 3] = 255
rgba = rgba.astype(np.uint8)
hull = cv2.convexHull(att["contour"])
cv2.drawContours(rgba, [hull], 0, (255, 196, 0, 255), 2, cv2.LINE_AA)
cv2.drawContours(rgba, [att["contour"]], 0, (255, 70, 85, 255), 3, cv2.LINE_AA)
x, y, bw, bh = cv2.boundingRect(att["contour"])
shape = min(100.0, max(0.0, (o - 0.35) / (0.90 - 0.35) * 100))
fixture = {
  "reference": {"points": ref["contour"].reshape(-1).tolist(), "aspect": ref["aspect"], "solidity": ref["solidity"]},
  "result": {"ok": True, "width": int(rgba.shape[1]), "height": int(rgba.shape[0]),
    "pixels_b64": base64.b64encode(rgba.tobytes()).decode(), "points": att["contour"].reshape(-1).tolist(),
    "metrics": {"area": int(att["area"]), "width": bw, "height": bh, "aspect": att["aspect"], "solidity": att["solidity"],
                "extent": att["area"] / (bw * bh), "frameCoverage": bw * bh / (img.shape[0] * img.shape[1]),
                "thresholdUsed": 141, "points": len(att["contour"])},
    "score": {"distance": d, "overlap": o, "total": total, "parts": {"shape": round(shape), "proportions": 0, "openness": 0}},
    "ms": 0, "matsAlive": 0}}
os.makedirs(os.path.join(HERE, "fixtures"), exist_ok=True)
json.dump(fixture, open(os.path.join(HERE, "fixtures", "high-arm.json"), "w"))
print("fixture score", total, "overlap", round(o, 2), "distance", round(d, 3))
