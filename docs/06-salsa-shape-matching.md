# 06 · The use case: matching salsa shapes

**Idea:** salsa is movement, but it has shapes you hold and can practise: the **dip**, the **ending pose** when the song finishes, **styling poses** in shines (solo footwork) and the **cross-body lead finish**. A dancer saves a reference photo of a shape (from a teacher, or their own best attempt) and then practises towards it. Each attempt gets a score, a coach tip and a place in their history.

## Why silhouettes fit
- A held shape is mostly about **line**: how low the dip goes, how long the follower's arch is, where the styling arm points. A silhouette outline captures line well.
- A couple in contact merges into **one** silhouette; for a dip that is a feature, since the shape of the two together is what you are judging.
- Hu moments make the comparison independent of where you stand and how far the camera is; aspect ratio and solidity add back what matters to dancers (tilt and how open the shape is).

## Photo guidance shown to users
- Plain light wall + dark clothes (or the reverse). Whole body or couple in frame. Camera at chest height, same distance each time.
- Use the camera's self-timer (built into the app: 3/5/10 s) so you can get into position.

## Coach messages (Rosa)
| Score | Message |
|---|---|
| ≥ 85 | "¡Qué bueno! That is very close to your reference." |
| 70–84 | "Close. The shape is there; polish the details." |
| 50–69 | "Recognisable. Keep practising this one." |
| < 50 | "Quite a different shape. Check the reference you picked, and that your whole body is in the frame." |
Plus one tip from the measurements: taller/narrower than the reference → "go lower / open your arms"; lower/wider → "lift through the chest"; more compact → "extend your arms and pointed foot"; more spread → "bring the styling arm closer".

## Limits (said plainly in the app)
No joint detection; lighting matters; the score measures outline similarity, not musicality or timing.

## Stretch idea (researched, not built)
Footwork trails: coloured tape on the shoes, `cv.cvtColor(..., COLOR_RGB2HSV)` + `cv.inRange` + contours per video frame, centroid from `cv.moments`, drawn as a trail to show the basic-step pattern. Needs per-frame worker messaging and a sample clip; left for after the core app works.
