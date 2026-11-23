---
name: browser-hang-triage
description: Diagnose why the browser app hangs (stuck worker, blocked DB upgrade, Wasm leak, stale service worker) and give the exact Chrome DevTools fix.
---

# browser-hang-triage

Shared by: `orchestrator`, `wasm-expert`, `indexeddb-expert`, `qa-tester`

1. Match the symptom to the table in `docs/05-troubleshooting-devtools.md`.
2. Ask for (or read) the Console error and the status-pill text.
3. Give the smallest fix first (Reset app data → reload), then the DevTools path (Inspect → Application → IndexedDB / Service workers / Storage → Clear site data).
4. If it is a code bug, hand it to the owner via the orchestrator: worker/memory → Forge, database → Ledger, pipeline → Iris.
