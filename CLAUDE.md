# Ballet Pose Matcher: project guide for Claude Code

A browser-only computer vision app (CAI 2300 final exam). OpenCV.js (OpenCV compiled to WebAssembly) finds a ballet dancer's silhouette in a Web Worker, scores it against a saved reference pose (aligned-silhouette overlap; `cv.matchShapes` reported) and recognises which of the library's poses it looks like; IndexedDB keeps the reference poses and practice history. 16 ballet poses ship as samples. Deployed on Netlify as a static site: no server, no API keys.

## The team
The user talks **only** to the orchestrator, **Atlas** (`.claude/agents/orchestrator.md`). Atlas plans the work, hands each part to the right expert, passes results between them, and has them review each other before accepting.

| Persona | Agent | Model | Owns |
|---|---|---|---|
| Atlas | `orchestrator` | opus | plan, delegation, reviews, `docs/handoff-log.md` |
| Iris | `opencv-expert` | opus | `js/pipeline.js`, `tests/pipeline_check.py` |
| Forge | `wasm-expert` | opus | `shape.worker.js`, worker client, `sw.js` |
| Ledger | `indexeddb-expert` | sonnet | `js/db.js`, `tests/browser/db.test.html` |
| Wren | `ux-designer-apple-hig` | sonnet | flow and states |
| Sable | `ui-designer-apple-liquid-glass` | sonnet | `css/app.css` |
| Juno | `frontend-engineer` | sonnet | `index.html`, `js/app.js`, info pages |
| Vera | `qa-tester` | sonnet | `tests/` |
| Margot | `ballet-coach` | sonnet | ballet poses, coach tips, `docs/06` |
| Harbor | `netlify-deployer` | haiku | `netlify.toml`, `docs/04` |
| Quill | `docs-writer` | haiku | `README.md`, `resources.html` |
| Echo | `meta-agent` | sonnet | `.claude/`, `knowledge/`, `tools/gen_team.py` |

## How the team works
- **The orchestrator runs experts in parallel.** It launches every expert whose inputs are ready at the same time, runs peer reviews in parallel too, and only waits when one expert needs another's output.
- **Agents hand work to each other through the orchestrator**, never directly. Every hand-off is logged in `docs/handoff-log.md`.
- **Nothing is accepted without review** by at least one other expert, and nothing ships without Vera's tests passing.
- Every agent has a knowledge folder `knowledge/<agent>/` (`docs/` notes with source links, `examples/` that show what good looks like) and must read it **before answering**.
- Shared skills live in `.claude/skills/<skill>/SKILL.md` and are wired to agents with the `skills:` field.
- Agents, skills, the roster and the brains table are generated from one table: `python3 tools/gen_team.py .` (Echo owns it). Edit the table, regenerate, commit.
- Note: agents created in a session load when a new Claude Code session starts.

## Rules for this repo
- Never run OpenCV on the main thread. Every `cv.Mat`/`cv.MatVector` (including `contours.get(i)`) is tracked and deleted in `finally`.
- A change to the pipeline or the score formula goes into **both** `js/pipeline.js` and `tests/pipeline_check.py`.
- IndexedDB schema changes only in `onupgradeneeded` with a `DB_VERSION` bump.
- Keep `resources.html` listing every link the project relies on.
- Work on `main`; every push to `main` redeploys on Netlify.

## Commands
```bash
python3 tests/pipeline_check.py                 # recognition of all 16 ballet poses: must print RESULT: PASS
python3 -m http.server 8765                     # serve locally, open http://localhost:8765
node tests/browser/cdp.mjs "http://127.0.0.1:8765/tests/browser/db.test.html?phase=write" --profile /tmp/p --wait '/^(PASS|FAIL)/.test(document.title)' --print 'document.getElementById("log").textContent'
python3 tests/browser/make_fixture.py && node tests/browser/cdp.mjs http://127.0.0.1:8765/index.html --profile /tmp/p2 --wait '/error|ready/.test(document.getElementById("status").className)' --print "$(cat tests/browser/flow.test.js)"
# also: tests/browser/states.test.js and tests/browser/gallery.test.js, run the same way as flow.test.js
```

## Research
`docs/README.md` indexes the research (OpenCV.js pipeline, WebAssembly and workers, IndexedDB, Netlify, troubleshooting, the ballet use case, sources).
