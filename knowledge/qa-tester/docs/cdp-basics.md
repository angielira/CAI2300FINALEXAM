# Driving Chrome with the DevTools Protocol (no packages)

Source: https://chromedevtools.github.io/devtools-protocol/

- Start Chrome with `--headless=new --remote-debugging-port=N --user-data-dir=DIR`; GET `http://127.0.0.1:N/json/version` → `webSocketDebuggerUrl`.
- Node 22 has a global `WebSocket`. Send `{id, method, params, sessionId}`; `Target.createTarget` + `Target.attachToTarget {flatten:true}` gives a `sessionId`.
- `Runtime.enable` → `Runtime.consoleAPICalled`, `Runtime.exceptionThrown`; `Log.enable` → network errors (e.g. 404s).
- `Runtime.evaluate {expression, awaitPromise:true, returnByValue:true}` runs test code in the page.
- `Page.captureScreenshot` → base64 PNG. Reusing `--user-data-dir` across runs = a real browser restart for persistence tests.
- `--dump-dom` is not enough for async tests: it can snapshot before IndexedDB work finishes (learned during this build).
