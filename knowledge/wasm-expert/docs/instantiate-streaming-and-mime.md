# instantiateStreaming and the application/wasm MIME type

Source: https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/JavaScript_interface/instantiateStreaming_static (fetched 2026-11-22)

- `WebAssembly.instantiateStreaming(fetch('x.wasm'), importObject)` compiles and instantiates directly from the network stream: "the most efficient, optimized way to load Wasm code". Resolves to `{ module, instance }`; `module` can be shared with a worker via `postMessage`.
- The response **must** have `Content-Type: application/wasm`, otherwise the promise rejects with a `TypeError`.
- Errors: `TypeError` (bad params or MIME), `CompileError`, `LinkError` (missing import), `RuntimeError`.
- Strict Content-Security-Policy can block Wasm compilation (`script-src` needs `'wasm-unsafe-eval'`).
- For this app: the official opencv.js embeds the Wasm, so MIME only matters if you self-host a separate `.wasm`. `netlify.toml` already sets it for `/*.wasm`.
