# Hand-off log: who did what, and where they handed work to each other

**Request to the orchestrator (Atlas):** build the Salsa Shape Matcher and make it deploy-ready for Netlify, with experts working in parallel, handing work through Atlas, and reviewing each other.

**How the experts ran (plain statement):** this build happened in one Claude session, the same session that created the agents. Agents created in a session load only when a new session starts, so Claude worked through each expert's agent file, skills and knowledge folder in turn and logged every hand-off below. To have the separate expert agents (with their own models) review the work, open a new Claude Code session on this repo and send the review prompt at the end of this file.

## Plan (dependency waves)
| Wave | In parallel | Waits for |
|---|---|---|
| 1 | Iris (pipeline + Python twin + sample photos), Ledger (database), Wren (flow and states), Rosa (salsa content), Harbor (netlify.toml) | nothing |
| 2 | Forge (worker + service worker), Sable (styles), Vera (test harness) | Iris; Wren; Iris + Ledger |
| 3 | Juno (page, camera, library UI, ghost outline) | Forge, Ledger, Sable, Rosa |
| 4 | Reviews: Forge→Iris, Iris→Forge, Wren+Sable→Juno, Vera runs everything | wave 3 |
| 5 | Quill (README, How it works, Resources), Echo (agents, skills, knowledge sync) | wave 4 |

## Hand-offs
| # | From → To | What | Why | Outcome |
|---|---|---|---|---|
| 1 | User → Atlas | The request | user talks only to Atlas | plan above |
| 2 | Atlas → Iris | Silhouette pipeline + score | wave 1 | `tests/pipeline_check.py`, `js/pipeline.js` |
| 3 | Atlas → Rosa | Which salsa shapes, photo guidance | wave 1 | dip, ending pose, shine styling, cross-body finish; `docs/06` |
| 4 | Rosa → Atlas → Iris | "The dip sample doesn't read as a dip: follower's legs point the wrong way" | review of the sample photos | Iris regenerated `samples/` with the follower arching back, feet on the floor |
| 5 | Iris → Atlas → Rosa | First scores: same shape 50–56 %, different 16–18 % | ask whether the scale feels right | Rosa: "a near-identical dip must read as a high score" → recalibrate |
| 6 | Atlas → Iris | Recalibrate | Rosa's review | `100/(1+(d/1.5)^3)` → same 85–92 %, different 23–29 %; PASS |
| 7 | Atlas → Ledger | IndexedDB schema, blocked upgrades, reset | wave 1 | `js/db.js` (v1: references, attempts, settings) |
| 8 | Atlas → Wren | Flow and every state | wave 1 | 3 steps + library; state table in `knowledge/ux-designer-apple-hig/docs/states-of-this-app.md` |
| 9 | Atlas → Harbor | netlify.toml | wave 1 | publish `.`, wasm MIME, `sw.js` no-cache |
| 10 | Iris → Atlas → Forge | `js/pipeline.js` API | Forge wraps it in the worker | `shape.worker.js` |
| 11 | Forge → Atlas → Iris | Review: `contours.get(i)` returns new Mats; are they tracked? Cap photo size | memory review | Iris tracks every `get(i)` and clone; 800 px cap agreed |
| 12 | Iris → Atlas → Forge | Review: worker must handle builds where `cv` is promise-like and builds using `onRuntimeInitialized` | cv API review | Forge's `waitForRuntime` handles both + polls for `cv.Mat` |
| 13 | Forge → Atlas → Harbor | opencv.js could not be downloaded in the build sandbox; load the official build from docs.opencv.org (4.13.0, fallback 4.x), embedded Wasm | hosting decision | netlify.toml keeps the `/vendor/*` and `*.wasm` rules for self-hosting later; `docs/04` |
| 14 | Wren → Atlas → Sable | Flow and states | styling input | `css/app.css` (liquid glass, dark mode) |
| 15 | Forge, Ledger, Sable, Rosa → Atlas → Juno | worker, database, styles, coach text | integration | `index.html`, `js/app.js`, camera with self-timer, ghost outline |
| 16 | Iris → Atlas → Juno+Iris | Simplification `approxPolyDP` at 0.2 % lowered same-shape scores to 76–85 % | measured | changed to 0.1 % in JS **and** Python → 93 % / 82 % |
| 17 | Atlas → Vera | Test everything in Chrome | wave 4 | `tests/browser/cdp.mjs`, `db.test.html`, `flow.test.js` |
| 18 | Vera → Atlas → Vera | `--dump-dom` snapshots before IndexedDB finishes (false FAILs) | test tooling | Vera wrote a DevTools-protocol driver that waits for results |
| 19 | Vera → Atlas → Sable | Screenshot: spinner, empty score ring and both library tabs visible at once | visual bug | `[hidden] { display:none !important }`; re-screenshot clean |
| 20 | Vera → Atlas → Juno | Flow test with the Python-OpenCV result: score 93, coach text, 6 metrics, auto-save, history row | integration test | 9/9 PASS |
| 21 | Vera → Atlas | IndexedDB write → new Chrome process → read → reset | persistence | 9 + 3 + 2 PASS |
| 22 | Atlas → Quill | README, How it works, Resources | wave 5 | pages linked from the app header and footer |
| 23 | Atlas → Echo | Agents, skills, knowledge folders, roster, brains | wave 5 | `tools/gen_team.py` generates `.claude/` + roster + brains from one table |
| 24 | Echo → Atlas → Iris, Forge, Ledger | Run your knowledge examples | "run every example you can" | Python examples, Mat tracker, worker demo, blocked-upgrade demo all PASS (recorded in each `examples/README.md`) |
| 25 | Atlas → User | Summary | done | this file + README |

## Which expert did what
- **Atlas (orchestrator):** plan, waves, every hand-off, acceptance.
- **Iris (OpenCV.js):** pipeline, Python twin, sample photos, score calibration, reviewed Forge's cv usage.
- **Forge (WebAssembly):** worker, loading/readiness, transfers, 30 s restart, Mat leak review, service worker.
- **Ledger (IndexedDB):** schema v1, transactions, Blobs, quota and blocked-upgrade handling, Reset app data, DB tests.
- **Wren (UX) & Sable (UI):** flow, states, copy; liquid-glass styles, dark mode, accessibility.
- **Juno (front end):** page, camera with timer, library, ghost outline, settings persistence.
- **Vera (QA):** test harness, found 3 real problems (#18, #19, and the stale-cache note in the README).
- **Rosa (salsa coach):** shapes, photo guidance, coach tips, rejected the first dip sample and the first score scale.
- **Harbor (Netlify):** netlify.toml and the deploy checklist.
- **Quill (docs):** README, How it works, Resources.
- **Echo (meta):** the team files and knowledge folders.

## What the tests prove, and the limits
- Proven: the vision algorithm on the samples (OpenCV 5.0 Python, same steps as the JS); every Mat freed (tracker); a stuck worker is restarted; the library survives a full browser restart; Reset deletes it; the UI flow end to end with a real OpenCV result.
- Not proven in the sandbox: the real opencv.js download inside the worker (blocked there). Verify on the live Netlify URL: the pill must turn green "Ready · OpenCV 4.x", and a sample must score.

## Review prompt for a new Claude Code session
```
@agent-orchestrator Review the Salsa Shape Matcher that is on main. Run the experts in parallel: Iris and Forge review js/pipeline.js and shape.worker.js against their knowledge folders (every cv.Mat deleted, OpenCV.js loads once in the worker); Ledger reviews js/db.js; Vera runs python3 tests/pipeline_check.py and the browser tests in CLAUDE.md, then opens the app in Chrome and checks the OpenCV.js status pill reaches Ready and a sample scores. Fix anything that fails, append your hand-offs to docs/handoff-log.md, push to main, and tell me which expert did what.
```

## Review session 2026-11-23 (separate expert agents)

**How the experts ran (plain statement):** none of the experts ran as a separate agent in this session. Atlas was launched as a subagent with only Read, Write, Edit and Bash, and no tool to start other agents. So Atlas did each expert's review in turn, against that expert's knowledge folder (`knowledge/<agent>/docs` + `examples`), and had a *different* expert's lens re-check each fix, backed by an executed test. Rows 26–40 are role hand-offs within one agent, not separate model runs. To get truly independent reviews, start a new Claude Code session and invoke the experts directly. Also unverified: the real opencv.js in the worker. docs.opencv.org is blocked here and third-party copies were not used, so the cv calls were checked by reading against the knowledge folders, with Python OpenCV (cv2) checking the algorithm and the constants.

| # | From → To | What | Why | Outcome |
|---|---|---|---|---|
| 26 | User → Atlas | Review main: Iris+Forge (pipeline, worker), Ledger (db + blocked/versionchange/reset), Wren/Sable (UI states), Vera (all tests) | review request | plan: one parallel wave of 5 reviews, then cross-reviews of each fix, then Vera re-runs everything |
| 27 | Atlas → Vera | Baseline: `pipeline_check.py`, db write/read/reset, flow test (server started on 127.0.0.1:8765) | find out where things stand before any fix | PASS: 93 %/82 % same vs 23–27 % different; db 9+3+2; flow 9/9 |
| 28 | Atlas → Iris | `js/pipeline.js` cv 4.x API (signatures, constants, Otsu return, grabCut mask, matchShapes I2) | review | API usage correct; cv2 confirms `GC_INIT_WITH_MASK=1`, `CONTOURS_MATCH_I2=2`, the seeded GrabCut gives 38.6k/34.6k px on the samples. **Defect:** `grabCutRefine` reads `mask.data` from before `cv.grabCut` + `new cv.Mat` (pipeline.js:79/92); if Wasm memory grows, that view is detached → empty or garbage mask. Low note: JS checks min area on the raw contour, Python on the simplified one (pipeline.js:136 vs pipeline_check.py:40), well under 1 % difference, not changed |
| 29 | Atlas → Forge | `shape.worker.js` + pipeline memory: loads once, readiness, always replies, every Mat freed | review | Loads once (single `loading` promise, `importScripts` loop with fallback); `waitForRuntime` covers promise-like + `onRuntimeInitialized` + poll; every Mat (incl. `contours.get(i)`, clones) tracked and freed in `finally`. **Defects:** ImageBitmap not closed when OpenCV is not ready (worker:89); OpenCV.js C++ exceptions arrive as a bare number, so the user saw e.g. "That didn't work. 6684712" (worker:101) |
| 30 | Atlas → Ledger | `js/db.js` + blocked / versionchange / reset paths in `js/app.js` | review | Schema only in `onupgradeneeded`, versionchange closes, open errors reset `dbPromise`, `run()` rejects on error/abort. **Defects:** no `db.onclose`, so after DevTools "Clear site data" or eviction every call fails until reload (db.js:51); a pending 250 ms settings save can re-create the DB in the middle of Reset (app.js:488). Low note: a blocked `deleteDatabase` reuses the "older version" banner text (not changed) |
| 31 | Atlas → Wren + Sable | UI states against `states-of-this-app.md` | review | **Defects:** (a) when the worker fails while an analysis is pending, the analyze `catch` overwrites the "Could not start OpenCV.js" banner, which loses its **Try again** button (red pill with no way out, app.js:254); (b) `hideBannerIf()` hides *any* banner when OpenCV turns ready, e.g. the library-blocked or newer-version banner (app.js:72/100). CSS states (`[hidden]`, pill colours) OK |
| 32 | Atlas → Iris | Fix row 28: re-read `mask.data` after grabCut | owner fix | pipeline.js:91–93. No Python change needed: the twin has no GrabCut path and the algorithm is unchanged |
| 33 | Iris → Atlas → Forge | Review fix 32 for memory | cross-review | Forge ran the real `grabCutRefine` in Node against a fake cv whose heap is moved with `ArrayBuffer.transfer` (detaches old views): original 0/320 foreground px **FAIL**, fixed 320/320 **PASS**; tracker example PASS |
| 34 | Atlas → Forge | Fix row 29: close the bitmap; decode numeric exceptions via `cv.exceptionFromPtr` (guarded) | owner fix | worker:90, 103–108. Note: `exceptionFromPtr` comes from the OpenCV.js tutorial utils and is **not in the knowledge folders** (gap: Echo should add it to `knowledge/opencv-expert/docs/loading-opencv-js.md`) |
| 35 | Forge → Atlas → Iris | Review fix 34 for cv API | cross-review | Accepted: guarded by `typeof === 'number'` and a function check, so any build without it keeps the old message |
| 36 | Atlas → Ledger | Fix row 30: `db.onclose` drops the stale promise; Reset clears the settings timer | owner fix | db.js:52–54, app.js:493 |
| 37 | Ledger → Atlas → Forge | Review fix 36 | cross-review | Accepted: `onclose` only resets the promise it belongs to (never a newer one); does not fire on our own `close()` |
| 38 | Atlas → Juno | Fix row 31: banners carry a `kind`; OpenCV-ready hides only `kind='opencv'`; analyze `catch` keeps the banner while the pill is red | owner fix (app.js) | app.js:20–23, 54, 101–102, 257–258. The 30 s timeout banner still shows (restart sets the pill to loading first) |
| 39 | Juno → Atlas → Wren + Vera | Review fix 38 in Chrome | cross-review | New `tests/browser/states.test.js` (real blocked OpenCV load, real analyze, real `versionchange` from a v2 connection): original app.js 2 **FAIL**, fixed 6/6 **PASS** |
| 40 | Atlas → Vera | Re-run everything after all fixes | acceptance gate | `pipeline_check.py` PASS; db write 9/9, read 3/3, reset 2/2; flow 9/9; states 6/6; grow 320/320; tracker PASS |
| 41 | Atlas → User | Summary, commit, push to main | done | see the commit for this section |

Not fixed (low, logged): `sw.js:37` caches an opaque opencv.js response even if it was an error (Reset clears it, and the worker falls back to the 4.x URL); the min-area order differs between JS and Python (row 28); the copy for a blocked delete (row 30).
