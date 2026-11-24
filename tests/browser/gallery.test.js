// Gallery test (2026-11-23), run like flow.test.js through cdp.mjs --print.
// Replaces only the worker call with the Python-OpenCV fixture, then checks that
// "Add all 16 poses" stores 16 named references, skips duplicates, and that opening
// an attempt auto-selects the matching reference.
(async () => {
  const fx = await (await fetch('tests/browser/fixtures/arabesque.json')).json();
  const out = [];
  const check = (name, ok) => out.push(`${ok ? 'PASS' : 'FAIL'} ${name}`);
  const app = window.__ballet;
  await DB.resetAll();
  await app.renderLibrary();
  let calls = 0;
  app.vision.analyze = async () => {
    calls++;
    const r = structuredClone(fx.result);
    const bin = atob(r.pixels_b64); const px = new Uint8ClampedArray(bin.length);
    for (let i = 0; i < bin.length; i++) px[i] = bin.charCodeAt(i);
    r.pixels = px; r.points = new Int32Array(r.points); delete r.pixels_b64; r.ranking = [];
    return r;
  };
  check('gallery lists 16 poses', document.querySelectorAll('#samples .pose').length === 16);
  check('32 sample buttons', document.querySelectorAll('#samples .sample').length === 32);
  await app.addAllPoses();
  const refs = await DB.listReferences();
  check('16 references saved', refs.length === 16);
  check('names match the gallery', app.POSES.every((p) => refs.some((r) => r.name === p.name)));
  check('one worker call per pose', calls === 16);
  await app.addAllPoses();
  check('second click adds no duplicates', (await DB.listReferences()).length === 16 && calls === 16);
  check('reference select has 17 options', document.getElementById('ref-select').options.length === 17);
  document.querySelector('.sample[data-src="samples/ballet-grand-jete-attempt.jpg"]').click();
  await new Promise((r) => setTimeout(r, 300));
  const sel = document.getElementById('ref-select');
  check('attempt auto-selects its pose', sel.options[sel.selectedIndex].text === 'Grand jeté');
  return out.join('\n');
})()
