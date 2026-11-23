---
name: browser-testing
description: Test the app in a real Chrome: IndexedDB persistence across restarts, the main-thread flow, screenshots, console errors, and the Python pipeline check.
---

# browser-testing

Shared by: `qa-tester`, `frontend-engineer`, `opencv-expert`

1. `python3 tests/pipeline_check.py` must PASS.
2. Serve the repo (`python3 -m http.server 8765`) and run `node tests/browser/cdp.mjs` with `tests/browser/db.test.html?phase=write|read|reset` on one `--profile`.
3. Flow test: `python3 tests/browser/make_fixture.py`, then run `tests/browser/flow.test.js` through `cdp.mjs --print`.
4. Screenshot light, dark and 420 px wide; look at them.
5. Report PASS/FAIL lines and any console errors verbatim.
