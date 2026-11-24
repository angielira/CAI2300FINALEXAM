# Expert roster: Ballet Pose Matcher

Decision: everything runs in the browser and is deployed on Netlify as a static site (no servers, no API keys). OpenCV.js does the computer vision, WebAssembly makes it fast and runs in a Web Worker, and IndexedDB keeps the pose library.

## The team (12 agents)
| Persona | Agent | One-line job |
|---|---|---|
| Atlas | `orchestrator` (required) | Runs the team: plans, delegates to experts in parallel, passes results between them, demands peer review, accepts or rejects work, keeps the hand-off log. |
| Iris | `opencv-expert` (required) | Owns the OpenCV.js vision pipeline: silhouette extraction, contour measures, overlap scoring (plus matchShapes) and its calibration. |
| Forge | `wasm-expert` (required) | Owns WebAssembly and the Web Worker: loads opencv.js once, keeps the page responsive, guarantees every cv.Mat is deleted, restarts stuck workers. |
| Ledger | `indexeddb-expert` (required) | Owns IndexedDB: versioned schema, references/attempts/settings stores, Blobs, quota handling, blocked upgrades and Reset app data. |
| Wren | `ux-designer-apple-hig` | Designs the flow and every state (loading OpenCV, working, done, error, blocked library, empty library) following Apple's Human Interface Guidelines. |
| Sable | `ui-designer-apple-liquid-glass` | Styles the app Apple-style: liquid-glass materials, typography, colour, motion, dark mode and accessibility. |
| Juno | `frontend-engineer` | Builds the page: index.html, js/app.js, the How it works and Resources pages, camera capture with a timer, and the library UI. |
| Vera | `qa-tester` | Tests in a real Chrome: pipeline check, IndexedDB persistence across restarts, the main-thread flow, screenshots and console errors. |
| Margot | `ballet-coach` | The ballet domain expert: chooses which positions to support, writes photo guidance and coach tips, and sanity-checks that scores feel right to a dancer. |
| Harbor | `netlify-deployer` | Owns netlify.toml, headers, MIME types, caching and the deploy checklist. |
| Quill | `docs-writer` | Writes README, How it works, Resources and keeps every link the project relies on in one place. |
| Echo | `meta-agent` | Builds and maintains the team itself: agent files, skills, knowledge folders, the roster and the brains table. |

### Why there is no database administrator, backend developer or DevOps engineer
IndexedDB lives inside each user's browser, so there is no server database to administer. Netlify only serves files, so there is no backend to write and no infrastructure to run. A browser-only app needs browser experts: vision (Iris), Wasm and workers (Forge), browser storage (Ledger), plus design, front end, testing, a ballet coach, a tiny deploy role and docs.

## Skills, and which agents share them
| Skill | What it covers | Shared by |
|---|---|---|
| `opencv-js-pipeline` | Build, debug and calibrate the OpenCV.js silhouette pipeline (threshold, morphology, contours, GrabCut, matchShapes) for the Ballet Pose Matcher. | opencv-expert, wasm-expert, qa-tester, ballet-coach |
| `wasm-memory-and-workers` | Keep OpenCV.js (WebAssembly) memory-safe and off the main thread: Web Worker loading, transfers, timeouts, restarts and Mat leak checks. | wasm-expert, opencv-expert, frontend-engineer |
| `indexeddb-persistence` | Design and change the IndexedDB library safely: versioned schema, short transactions, Blobs, quota errors, blocked upgrades and Reset app data. | indexeddb-expert, frontend-engineer, qa-tester |
| `browser-hang-triage` | Diagnose why the browser app hangs (stuck worker, blocked DB upgrade, Wasm leak, stale service worker) and give the exact Chrome DevTools fix. | orchestrator, wasm-expert, indexeddb-expert, qa-tester |
| `apple-design-language` | Apply Apple-style HIG flow and liquid-glass visuals consistently: hierarchy, states, materials, typography, colour, motion and accessibility. | ux-designer-apple-hig, ui-designer-apple-liquid-glass, frontend-engineer |
| `netlify-static-deploy` | Ship the app as a static Netlify site: netlify.toml, headers, MIME types, caching, service-worker safety and deploy checks. | netlify-deployer, wasm-expert, orchestrator |
| `browser-testing` | Test the app in a real Chrome: IndexedDB persistence across restarts, the main-thread flow, screenshots, console errors, and the Python pipeline check. | qa-tester, frontend-engineer, opencv-expert |
| `handoff-protocol` | How experts hand work to each other through the orchestrator, run in parallel, peer-review, and log every hand-off in docs/handoff-log.md. | orchestrator, meta-agent, opencv-expert, wasm-expert, indexeddb-expert, ux-designer-apple-hig, ui-designer-apple-liquid-glass, frontend-engineer, qa-tester, ballet-coach, netlify-deployer, docs-writer |
| `ballet-pose-coaching` | Ballet domain knowledge: which positions to practise, photo guidance, and turning scores and measurements into kind, specific coach tips. | ballet-coach, opencv-expert, ux-designer-apple-hig |
| `plain-language-docs` | Write README, How it works, Resources and notes in plain words with every source linked. | docs-writer, ballet-coach, ux-designer-apple-hig |
| `agent-authoring` | Create and maintain Claude Code subagents and skills for this repo: frontmatter, models, skills wiring, knowledge folders and the Before-you-answer rule. | meta-agent, orchestrator |

## How they work together
The user talks only to **Atlas**. Atlas runs independent experts in parallel (e.g. Iris on the pipeline, Ledger on the database, Wren on the flow, Margot on ballet content), passes outputs on (Iris → Forge → Juno; Wren → Sable → Juno; Ledger → Juno), and has experts review each other (Forge reviews Iris for leaks, Iris reviews Forge's cv usage, Vera tests everything) before accepting. See `docs/handoff-log.md`.
