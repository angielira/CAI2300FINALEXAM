"""Worked example (Iris): why matchShapes ignores size, position and rotation.
Draws one shape, then a scaled+moved copy, a rotated copy and a different shape,
and prints Hu moments distances. Run: python3 knowledge/opencv-expert/examples/hu_moments_invariance.py"""
import cv2, numpy as np

def shape_mask(scale=1.0, angle=0.0, dx=0, dy=0, other=False):
    m = np.zeros((600, 600), np.uint8)
    pts = np.array([[0, -120], [30, -40], [110, -30], [40, 20], [70, 110], [0, 50], [-70, 110], [-40, 20], [-110, -30], [-30, -40]], np.float32)
    if other:
        pts = np.array([[-120, -40], [120, -40], [120, 40], [-120, 40]], np.float32)
    a = np.deg2rad(angle)
    R = np.array([[np.cos(a), -np.sin(a)], [np.sin(a), np.cos(a)]], np.float32)
    pts = (pts @ R.T) * scale + [300 + dx, 300 + dy]
    cv2.fillPoly(m, [pts.astype(np.int32)], 255)
    cs, _ = cv2.findContours(m, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    return max(cs, key=cv2.contourArea)

base = shape_mask()
for label, c in [("scaled 0.6 and moved", shape_mask(0.6, 0, 80, -60)),
                 ("rotated 35 deg", shape_mask(1.0, 35)),
                 ("a different shape", shape_mask(other=True))]:
    d = cv2.matchShapes(base, c, cv2.CONTOURS_MATCH_I2, 0)
    print(f"star vs {label:22s} matchShapes I2 = {d:.4f}")
hu = cv2.HuMoments(cv2.moments(base)).flatten()
print("Hu moments of the star (log10|h|):", np.round(np.log10(np.abs(hu)), 2).tolist())
