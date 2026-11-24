"""Generate the sample 'photos' used by the app and the tests.

Each sample is a dark ballet-dancer silhouette (in a tutu) on a light, slightly
uneven wall, with noise and a soft blur so it behaves like a phone photo.
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


def body(canvas, hip, torso_angle, s, arms, legs, color, skirt=False, tutu=False):
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
    if tutu:                                                       # a classical tutu: a flat disc at the hips
        cv2.ellipse(canvas, (int(hip[0]), int(hip[1] - 10 * s)), (int(105 * s), int(20 * s)),
                    torso_angle + 90, 0, 360, color, -1, cv2.LINE_AA)
    if skirt:                                                      # a flared skirt
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
# Classical ballet poses. Angles in degrees: 0 = right, 90 = down, -90 = up.
# Each pose is (torso angle, arms, legs); `jitter` nudges the angles so the "attempt"
# photo is the same pose done a little differently.
POSES = {
    # --- extensions and balances
    "arabesque":         dict(torso=-78, arms=[(-12, -8), (172, 178)], legs=[(92, 90), (176, 180)]),
    "penche":            dict(torso=20, arms=[(75, 85), (200, 190)], legs=[(95, 92), (-140, -130)], dy=10),
    "attitude":          dict(torso=-82, arms=[(-108, -40), (12, 20)], legs=[(92, 90), (195, -115)]),
    "attitude-devant":   dict(torso=-94, arms=[(-100, -55), (172, 178)], legs=[(92, 90), (-22, 28)]),
    "developpe-devant":  dict(torso=-96, arms=[(-100, -80), (15, 10)], legs=[(92, 90), (-5, -8)]),
    "a-la-seconde":      dict(torso=-90, arms=[(170, 178), (10, 2)], legs=[(95, 92), (-2, 0)]),
    "ecarte":            dict(torso=-108, arms=[(-55, -70), (195, 200)], legs=[(95, 92), (-35, -35)]),
    "retire":            dict(torso=-90, arms=[(-120, -55), (-60, -125)], legs=[(90, 90), (28, 160)]),
    # --- positions and pliés
    "first-bras-bas":    dict(torso=-90, arms=[(118, 60), (62, 120)], legs=[(84, 86), (96, 94)]),
    "fifth-en-haut":     dict(torso=-90, arms=[(-120, -55), (-60, -125)], legs=[(88, 90), (92, 90)]),
    "second-plie":       dict(torso=-90, arms=[(175, 180), (5, 0)], legs=[(50, 100), (130, 80)], dy=55),
    "tendu-devant":      dict(torso=-92, arms=[(-110, -70), (165, 172)], legs=[(94, 92), (58, 62)]),
    "tendu-seconde":     dict(torso=-90, arms=[(150, 160), (30, 20)], legs=[(96, 94), (62, 64)]),
    "fourth-croise":     dict(torso=-88, arms=[(-110, -70), (12, 18)], legs=[(78, 86), (108, 100)]),
    # --- jumps and bows
    "grand-jete":        dict(torso=-88, arms=[(-40, -30), (200, 190)], legs=[(5, 0), (172, 178)], dy=-140),
    "reverence":         dict(torso=-66, arms=[(140, 150), (42, 32)], legs=[(92, 92), (128, 128)]),
}
NAMES = {
    "arabesque": "Arabesque", "penche": "Penché", "attitude": "Attitude derrière", "attitude-devant": "Attitude devant",
    "developpe-devant": "Développé devant", "a-la-seconde": "À la seconde", "ecarte": "Écarté", "retire": "Retiré",
    "first-bras-bas": "First position, bras bas", "fifth-en-haut": "Fifth position, en haut", "second-plie": "Second position plié",
    "tendu-devant": "Tendu devant", "tendu-seconde": "Tendu à la seconde", "fourth-croise": "Fourth position croisé",
    "grand-jete": "Grand jeté", "reverence": "Révérence",
}


def ballet(pose, jitter=0.0, s=1.0, x=450, y=640):
    p = POSES[pose]
    y = y + p.get("dy", 0) * s
    j = lambda a, k: a + k * jitter
    def d(m):
        body(m, (x, y), j(p["torso"], 4), s,
             arms=[(j(a, -6), j(b, -8)) for a, b in p["arms"]],
             legs=[(j(a, 3), j(b, 5)) for a, b in p["legs"]], color=255, tutu=True)
    return d


if __name__ == "__main__":
    os.makedirs(OUT, exist_ok=True)
    for old in os.listdir(OUT):
        if old.endswith(".jpg"):
            os.remove(os.path.join(OUT, old))
    for i, pose in enumerate(POSES):
        render(ballet(pose), 10 + i, f"ballet-{pose}-reference.jpg")
        render(ballet(pose, 1.0, s=0.86, x=480, y=670), 20 + i, f"ballet-{pose}-attempt.jpg")
    print("wrote", sorted(os.listdir(OUT)))
