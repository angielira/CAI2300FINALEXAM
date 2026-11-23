// Worked example (Forge): the Mat tracker pattern, runnable in Node with a fake cv.Mat.
// Proves that every allocation is freed, even when the pipeline throws halfway.
let alive = 0;
class FakeMat { constructor() { alive++; this.deleted = false; } delete() { if (!this.deleted) { this.deleted = true; alive--; } } isDeleted() { return this.deleted; } }

function makeTracker() {
  const list = [];
  return { track(m) { list.push(m); return m; }, freeAll() { for (const m of list) if (!m.isDeleted()) m.delete(); list.length = 0; } };
}
function pipeline(shouldThrow) {
  const t = makeTracker();
  try {
    const a = t.track(new FakeMat()); const b = t.track(new FakeMat());
    for (let i = 0; i < 5; i++) t.track(new FakeMat());     // like contours.get(i)
    if (shouldThrow) throw new Error('boom');
    return 'ok';
  } finally { t.freeAll(); }
}
pipeline(false);
try { pipeline(true); } catch { /* expected */ }
console.log(`Mats alive after a good run and a failed run: ${alive}`);
console.log(alive === 0 ? 'PASS' : 'FAIL');
