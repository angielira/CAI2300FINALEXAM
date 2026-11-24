// UI-state regression test (review 2026-11-23), run like flow.test.js:
// node tests/browser/cdp.mjs http://127.0.0.1:8765/index.html --profile /tmp/p3 --wait '/error|ready/.test(document.getElementById("status").className)' --print "$(cat tests/browser/states.test.js)"
// Expects OpenCV.js to fail to load (offline/sandbox) so the error state is reachable.
(async () => {
  const $ = (id) => document.getElementById(id), out = [];
  const check = (n, ok) => out.push(`${ok ? 'PASS' : 'FAIL'} ${n}`);
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  const hasTry = () => !$('banner').hidden && [...$('banner').querySelectorAll('button')].some((b) => b.textContent === 'Try again');
  check('OpenCV load failure shows red pill', $('status').className.includes('pill-error'));
  check('OpenCV error banner has Try again', hasTry());
  document.querySelector('.sample[data-src="samples/styling-high-arm-attempt.jpg"]').click();
  for (let i = 0; i < 50 && !window.__salsa.state.busy; i++) await sleep(20);
  for (let i = 0; i < 100 && window.__salsa.state.busy; i++) await sleep(50);
  check('analyze while OpenCV failed keeps the Try again banner', hasTry());
  window.__salsa.vision.onMessage({ type: 'status', state: 'ready', version: 'test' });
  check('ready hides the OpenCV banner', $('banner').hidden);
  await window.__salsa.renderLibrary();
  const req = indexedDB.open('salsashapes', 2);            // a "newer tab"
  await new Promise((r) => { req.onsuccess = r; req.onerror = r; });
  await sleep(100);
  check('versionchange banner shown', !$('banner').hidden && /newer version/.test($('banner').textContent));
  window.__salsa.vision.onMessage({ type: 'status', state: 'ready', version: 'test' });
  check('ready does not hide the versionchange banner', !$('banner').hidden && /newer version/.test($('banner').textContent));
  req.result && req.result.close();
  await new Promise((r) => { const d = indexedDB.deleteDatabase('salsashapes'); d.onsuccess = r; d.onerror = r; });
  return out.join('\n');
})()
