# Test plan

Sources: the exam guide's requirements and grading table · `tests/` in this repo · https://chromedevtools.github.io/devtools-protocol/

| Requirement (exam) | Test | Tool |
|---|---|---|
| Real computer vision | silhouettes found on all 4 samples; same-shape ≥ 70 %, different ≤ 55 % | `python3 tests/pipeline_check.py` |
| Mats deleted | `matsAlive` = 0 in every result; tracker frees on throw | flow test; `knowledge/wasm-expert/examples/mat-tracker.mjs` |
| No freezing | worker always replies; stuck job → restart | `knowledge/wasm-expert/examples/worker-always-replies/page.html` |
| Persists after refresh | write → (new Chrome process) → read | `tests/browser/db.test.html` via `cdp.mjs --profile` |
| Reset app data works | reset phase: database gone, fresh DB empty | `db.test.html?phase=reset` |
| UI flow | reference → attempt → score, coach, metrics, auto-save, history row | `tests/browser/flow.test.js` |
| Looks right | screenshots light / dark / 420 px | `cdp.mjs --screenshot` |
| Live | Netlify URL in Chrome: Ready pill, sample scan, reload keeps library | manual (step 11 of the guide) |
