// Worked example (Vera): replace only the worker call with a known result, then drive the real UI.
// Full version: tests/browser/flow.test.js
async function flowTest(app, fixtureResult) {
  app.vision.analyze = async () => fixtureResult;                  // the one seam
  document.querySelector('.sample[data-src="samples/ballet-arabesque-attempt.jpg"]').click();
  for (let i = 0; i < 50 && document.getElementById('score-row').hidden; i++) await new Promise((r) => setTimeout(r, 100));
  return document.getElementById('score').textContent;               // expect "93"
}
