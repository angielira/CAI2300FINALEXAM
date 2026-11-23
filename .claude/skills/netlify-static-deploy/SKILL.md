---
name: netlify-static-deploy
description: Ship the app as a static Netlify site: netlify.toml, headers, MIME types, caching, service-worker safety and deploy checks.
---

# netlify-static-deploy

Shared by: `netlify-deployer`, `wasm-expert`, `orchestrator`

1. `[build] publish = "."`, no build command, no env vars.
2. `*.wasm` → `application/wasm` + immutable cache; `/sw.js` → `no-cache`.
3. After deploy: open the URL in Chrome, wait for "Ready · OpenCV x", run a sample, reload and check the library.
4. Every push to `main` redeploys; never commit secrets (there are none to commit).
