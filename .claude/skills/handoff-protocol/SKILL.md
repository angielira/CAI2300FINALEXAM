---
name: handoff-protocol
description: How experts hand work to each other through the orchestrator, run in parallel, peer-review, and log every hand-off in docs/handoff-log.md.
---

# handoff-protocol

Shared by: `orchestrator`, `meta-agent`, `opencv-expert`, `wasm-expert`, `indexeddb-expert`, `ux-designer-apple-hig`, `ui-designer-apple-liquid-glass`, `frontend-engineer`, `qa-tester`, `salsa-coach`, `netlify-deployer`, `docs-writer`

1. Experts never call each other directly; they return results to the orchestrator, which passes them on.
2. The orchestrator launches every expert whose inputs are ready at the same time; it waits only on real dependencies.
3. Every deliverable is reviewed by at least one other expert before it is accepted (e.g. Forge reviews Iris's pipeline for memory; Iris reviews Forge's worker for correctness).
4. Each hand-off is one row in `docs/handoff-log.md`: #, from → to, what, why, outcome.
