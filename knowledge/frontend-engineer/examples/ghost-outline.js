// Worked example (Juno): draw the reference contour as a dashed "ghost",
// scaled to the height of the dancer's own bounding box and centred on it.
function bbox(p) { let a = Infinity, b = Infinity, c = -Infinity, d = -Infinity;
  for (let i = 0; i < p.length; i += 2) { a = Math.min(a, p[i]); c = Math.max(c, p[i]); b = Math.min(b, p[i + 1]); d = Math.max(d, p[i + 1]); }
  return { x: a, y: b, w: c - a, h: d - b }; }
function drawGhost(ctx, myPoints, refPoints) {
  const mine = bbox(myPoints), ref = bbox(refPoints), s = mine.h / ref.h;
  const ox = mine.x + mine.w / 2 - (ref.x + ref.w / 2) * s, oy = mine.y - ref.y * s;
  ctx.save(); ctx.setLineDash([8, 6]); ctx.lineWidth = 2.5; ctx.strokeStyle = 'rgba(255,255,255,.95)';
  ctx.beginPath();
  for (let i = 0; i < refPoints.length; i += 2) {
    const x = refPoints[i] * s + ox, y = refPoints[i + 1] * s + oy;
    i ? ctx.lineTo(x, y) : ctx.moveTo(x, y);
  }
  ctx.closePath(); ctx.stroke(); ctx.restore();
}
if (typeof module !== 'undefined') module.exports = { bbox, drawGhost };
