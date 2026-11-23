"""Generate the sample 'photos' used by the app and the tests.

Each sample is a dark dancer silhouette (or a couple in a dip) on a light,
slightly uneven wall, with noise and a soft blur so it behaves like a phone photo.
Run:  python3 tests/make_samples.py   (writes samples/*.jpg)
"""
import math, os, sys
import numpy as np
import cv2

W, H = 900, 1100
OUT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "samples")


def background(seed):
    rng = np.random.default_rng(seed)
    y, x = np.mgrid[0:H, 0:W].astype(np.float32)
    base = 225 - 25 * (y / H) + 10 * np.sin(x / 140.0)          # uneven wall light
    img = np.dstack([base * 0.97, base * 0.95, base]).astype(np.float32)
    floor = y > H * 0.86                                          # a floor strip
    img[floor] *= 0.82
    img += rng.normal(0, 5, img.shape)                            # sensor noise
    return img


def P(cx, cy, length, angle_deg):
    a = math.radians(angle_deg)
    return (cx + length * math.cos(a), cy + length * math.sin(a))


def body(canvas, hip, torso_angle, s, arms, legs, color, skirt=False):
    """Draw one dancer. Angles in degrees, 0 = right, 90 = down."""
    hx, hy = hip
    neck = P(hx, hy, 230 * s, torso_angle)
    head = P(neck[0], neck[1], 62 * s, torso_angle)
    th = int(58 * s)
    def line(a, b, t):
        cv2.line(canvas, tuple(map(int, a)), tuple(map(int, b)), color, int(t), cv2.LINE_AA)
    line(hip, neck, th)                                            # torso
    cv2.circle(canvas, tuple(map(int, head)), int(48 * s), color, -1, cv2.LINE_AA)
    shoulder = P(hip[0], hip[1], 205 * s, torso_angle)
    for upper, lower in arms:                                      # arms
        elbow = P(shoulder[0], shoulder[1], 120 * s, upper)
        wrist = P(elbow[0], elbow[1], 110 * s, lower)
        line(shoulder, elbow, 26 * s); line(elbow, wrist, 22 * s)
        cv2.circle(canvas, tuple(map(int, wrist)), int(14 * s), color, -1)
    for upper, lower in legs:                                      # legs
        knee = P(hip[0], hip[1], 190 * s, upper)
        ankle = P(knee[0], knee[1], 185 * s, lower)
        line(hip, knee, 36 * s); line(knee, ankle, 28 * s)
        foot = P(ankle[0], ankle[1], 40 * s, lower - 70)
        line(ankle, foot, 18 * s)
    if skirt:                                                      # a flared salsa skirt
        a = math.radians(torso_angle + 180)
        pts = []
        for d in (-38, -20, 0, 20, 38):
            pts.append(P(hip[0], hip[1], 150 * s, torso_angle + 180 + d))
        poly = np.array([hip] + pts, np.int32)
        cv2.fillPoly(canvas, [poly], color, cv2.LINE_AA)


def render(draw, seed, name):
    img = background(seed)
    mask = np.zeros((H, W), np.uint8)
    draw(mask)
    shade = np.full_like(img, (52, 40, 44))                       # dark outfit
    m = cv2.GaussianBlur(mask, (5, 5), 0)[..., None] / 255.0
    img = img * (1 - m) + shade * m
    img = cv2.GaussianBlur(img, (3, 3), 0)
    cv2.imwrite(os.path.join(OUT, name), np.clip(img, 0, 255).astype(np.uint8),
                [cv2.IMWRITE_JPEG_QUALITY, 88])


# --- Shapes -------------------------------------------------------------
def styling(jitter=0.0, s=1.0, x=430, y=650):
    # Solo shine styling: right arm high, left arm out, left leg pointed.
    def d(m):
        body(m, (x, y), -90 + 4 * jitter, s,
             arms=[(-60 - 6 * jitter, -80 - 8 * jitter), (165 + 5 * jitter, 175)],
             legs=[(95, 92), (120 + 6 * jitter, 135 + 6 * jitter)], color=255, skirt=True)
    return d


def dip(jitter=0.0, s=0.9, x=600, y=600):
    # Couple dip: leader leans over, follower arches back with her head low.
    def d(m):
        body(m, (x, y), -112 + 3 * jitter, s,                          # leader
             arms=[(160, 150 + 5 * jitter), (175, 200)],
             legs=[(75, 90), (118, 100)], color=255)
        fx, fy = x - 70 * s, y + 70 * s                                # follower hip
        body(m, (fx, fy), 170 + 6 * jitter, s,                         # torso arches left/down
             arms=[(-35, -20 + 6 * jitter), (140 + 8 * jitter, 120)],
             legs=[(70 + 4 * jitter, 85), (100, 95)], color=255, skirt=True)
    return d


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    render(styling(0.0), 1, "styling-reference.jpg")
    render(styling(1.0, s=0.85, x=470, y=690), 2, "styling-attempt.jpg")
    render(dip(0.0), 3, "dip-reference.jpg")
    render(dip(1.0, s=0.8, x=520, y=640), 4, "dip-attempt.jpg")
    print("wrote", sorted(os.listdir(OUT)))
