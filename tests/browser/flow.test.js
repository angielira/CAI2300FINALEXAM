// Main-thread flow test, run inside the app page by cdp.mjs (--print).
// Replaces only the worker call with the Python-OpenCV fixture, then drives the real UI:
// select a reference, open a sample, and check drawing, score, coach text and auto-save.
(async () => {
  const fx = await (await fetch('tests/browser/fixtures/dip.json')).json();
  const out = [];
  const check = (name, ok) => out.push(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  await DB.resetAll();
  const refBlob = await (await fetch('samples/dip-reference.jpg')).blob();
  await DB.saveReference({ id: 'ref-dip', name: 'Dip', createdAt: Date.now(), points: new Int32Array(fx.reference.points),
    aspect: fx.reference.aspect, solidity: fx.reference.solidity, imageBlob: refBlob, thumbBlob: refBlob });
  const app = window.__salsa;
  app.state.settings.refId = 'ref-dip';
  await app.renderLibrary();
  check('reference appears in the select', document.getElementById('ref-select').value === 'ref-dip');
  let sentReference = null;
  app.vision.analyze = async (bitmap, options, reference) => {
    sentReference = reference;
    const r = structuredClone(fx.result);
    const bin = atob(r.pixels_b64); const px = new Uint8ClampedArray(bin.length);
    for (let i = 0; i < bin.length; i++) px[i] = bin.charCodeAt(i);
    r.pixels = px; r.points = new Int32Array(r.points); delete r.pixels_b64;
    r.score.parts = { shape: r.score.parts.shape, proportions: 96, openness: 97 };
    return r;
  };
  document.querySelector('.sample[data-src="samples/dip-attempt.jpg"]').click();
  for (let i = 0; i < 80 && document.getElementById('score-row').hidden; i++) await new Promise((r) => setTimeout(r, 100));
  for (let i = 0; i < 80 && !document.querySelector('#tab-history .hrow'); i++) await new Promise((r) => setTimeout(r, 100));
  check('reference contour was sent to the worker', sentReference && sentReference.points.length === fx.reference.points.length);
  check('score shown', document.getElementById('score').textContent === String(fx.result.score.total));
  check('coach text shown', document.getElementById('coach').textContent.length > 20);
  check('canvas sized to result', document.getElementById('canvas').width === fx.result.width);
  check('metrics shown', document.querySelectorAll('#metrics div').length === 6);
  check('attempt auto-saved to IndexedDB', (await DB.listAttempts()).length === 1);
  check('history row rendered', !!document.querySelector('#tab-history .hrow'));
  check('perf line mentions 0 Mats', /Mats still in memory: 0/.test(document.getElementById('perf').textContent));
  window.scrollTo(0, 0);
  return out.join('\n') + '\nscore=' + document.getElementById('score').textContent + ' coach="' + document.getElementById('coach').textContent + '"';
})()
