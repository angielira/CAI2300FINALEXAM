# Salsa Shape Matcher

Practise your salsa shine styling poses (and any shape you hold, like a dip or an ending pose) with computer vision that runs **entirely in your browser**.
Take or upload a photo against a plain wall. **OpenCV.js** finds your silhouette and compares it with a reference shape. **WebAssembly** makes it fast, inside a **Web Worker** so the page never freezes. **IndexedDB** keeps your reference shapes and practice history on your own computer.

CAI 2300 · Computer Vision final exam · OpenCV.js + WebAssembly + IndexedDB, deployed on Netlify.

## Try it in 30 seconds
1. Open the app and wait for the pill to say **Ready · OpenCV 4.x** (the first visit downloads ~10 MB).
2. Pick one of the four styling poses (high arm, hand on hip, arms framing, lean & sweep). Click its **reference** sample, then **Save reference**. Do this for as many poses as you like.
3. Choose a reference in step 2, then click that pose's **attempt**: the shape is outlined, the reference appears as a dashed ghost, and you get a score (high arm ≈ 83 %) and a coach tip. Try comparing an attempt to a *different* pose: it scores 40 % or less.
4. Reload the page: the reference and the attempt are still in the **Library**. That's IndexedDB.

## How it works
| | Technology | Job in this app |
|---|---|---|
| 👁 eyes | **OpenCV.js** | grayscale → blur → Otsu threshold → clean-up (morphology) → `findContours` → optional `grabCut` → measures (`boundingRect`, `convexHull`) → compare: aligned-silhouette overlap (`moments`, `drawContours`, `dilate`, `bitwise_and/or`, `countNonZero`), plus `matchShapes` (Hu moments) reported |
| 💪 muscle | **WebAssembly** | OpenCV's C++ compiled to Wasm; loaded once in `shape.worker.js`; every `cv.Mat` is deleted ("Mats still in memory: 0") |
| 🧠 memory | **IndexedDB** | database `salsashapes` v1: `references`, `attempts`, `settings` (photos stored as Blobs) |

Read more on the in-app **How it works** page. Every link the project relies on is on the **Resources** page.

## Run locally
```bash
python3 -m http.server 8765     # then open http://localhost:8765 in Chrome
```
Any static server works. There is no build step.

## Deploy on Netlify
1. app.netlify.com → **Add new project → Import an existing project → GitHub** → pick this repo.
2. Build command: *empty*. Publish directory: `.`. No environment variables. **Deploy**.
3. `netlify.toml` already sets the publish folder and headers (`application/wasm` for `.wasm`, `no-cache` for the service worker). Every push to `main` redeploys.

OpenCV.js is loaded from the official build at `docs.opencv.org` (4.13.0, falling back to 4.x). The service worker caches it after the first visit. To self-host it instead, see `docs/04-netlify-deployment.md`.

## Tests
```bash
python3 tests/pipeline_check.py           # vision on the 4 sample photos: RESULT: PASS
python3 -m http.server 8765 &             # then the Chrome tests (Node 22, no packages):
node tests/browser/cdp.mjs "http://127.0.0.1:8765/tests/browser/db.test.html?phase=write" --profile /tmp/p --wait '/^(PASS|FAIL)/.test(document.title)' --print 'document.getElementById("log").textContent'
#   ...repeat with phase=read (new Chrome process, same profile) and phase=reset
python3 tests/browser/make_fixture.py
node tests/browser/cdp.mjs http://127.0.0.1:8765/index.html --profile /tmp/p2 --wait '/error|ready/.test(document.getElementById("status").className)' --print "$(cat tests/browser/flow.test.js)"
```
Last run (2026-11-23): pipeline PASS (same pose 75–92 %, different poses 40 % or less) · UI states 6/6 PASS · IndexedDB 14/14 PASS across a browser restart · UI flow 9/9 PASS.

## The agent team
Built by an orchestrated team of 12 Claude Code agents (`.claude/agents/`) with 11 shared skills (`.claude/skills/`) and a knowledge folder each (`knowledge/<agent>/docs` + `examples`).

| Name | Agent | Model | Role |
|---|---|---|---|
| Atlas | orchestrator | opus | plans, delegates in parallel, reviews, logs hand-offs |
| Iris | opencv-expert | opus | the vision pipeline and its calibration |
| Forge | wasm-expert | opus | Web Worker, WebAssembly memory, restarts |
| Ledger | indexeddb-expert | sonnet | the database, persistence, Reset app data |
| Wren | ux-designer-apple-hig | sonnet | flow and states |
| Sable | ui-designer-apple-liquid-glass | sonnet | liquid-glass styling |
| Juno | frontend-engineer | sonnet | the page, camera, library |
| Vera | qa-tester | sonnet | tests in a real Chrome |
| Rosa | salsa-coach | sonnet | salsa shapes, photo guidance, coach tips |
| Harbor | netlify-deployer | haiku | netlify.toml, deploy checklist |
| Quill | docs-writer | haiku | README, How it works, Resources |
| Echo | meta-agent | sonnet | keeps agents, skills and knowledge in sync |

**Who did what and where they handed work to each other:** [`docs/handoff-log.md`](docs/handoff-log.md) (hand-offs 1–25 for the build, 26–41 for the review, 42–52 for the switch to four styling poses). Highlights: Rosa rejected the first dip sample and the first score scale; Forge made Iris track every `contours.get(i)` Mat and cap photos at 800 px; Vera's screenshots caught hidden elements still showing.

Research: [`docs/`](docs/README.md) · Roster: [`docs/expert-roster.md`](docs/expert-roster.md) · Models and personalities: [`docs/agent-brains.md`](docs/agent-brains.md)

## When the app gets stuck
- Click **Reset app data** (bottom right). It deletes the database, caches and service worker, then reloads.
- Frozen page: right-click → **Inspect** → **Application** → **IndexedDB → salsashapes** to look, or **Storage → Clear site data**.
- Another tab open on an old version: close it and reload (the app tells you).
- Full table of causes and fixes: [`docs/05-troubleshooting-devtools.md`](docs/05-troubleshooting-devtools.md).

## Limits
OpenCV compares whole-body outlines. It does not find joints, judge timing or musicality, and needs a fairly plain background. A couple in contact is matched as one shape.

## Repo map
```
index.html, how-it-works.html, resources.html   pages
css/app.css                                      styles (Sable)
js/app.js, js/db.js, js/pipeline.js              page (Juno), IndexedDB (Ledger), vision (Iris)
shape.worker.js, sw.js                           Web Worker (Forge), offline cache
samples/                                         four sample photos
tests/                                           pipeline check (Python) and Chrome tests
docs/                                            research, roster, brains, hand-off log
.claude/agents, .claude/skills                   the team
knowledge/<agent>/{docs,examples}                each agent's knowledge
tools/gen_team.py                                regenerates the team files from one table
netlify.toml                                     static deploy config
```
