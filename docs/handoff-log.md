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
