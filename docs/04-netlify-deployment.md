# 04 · Deploying a static OpenCV.js app on Netlify

**Question:** how do we serve opencv.js and its WebAssembly from Netlify as a static site (file size, MIME types, caching headers)?

Sources:
- Netlify custom headers: https://docs.netlify.com/manage/routing/headers/ (fetched 2026-11-22)
- Netlify docs: https://docs.netlify.com/
- MDN instantiateStreaming (MIME requirement): https://developer.mozilla.org/en-US/docs/WebAssembly/Reference/JavaScript_interface/instantiateStreaming_static

## The decision
- **No build step, no functions, no API keys.** Publish directory `.` (the repo root). Netlify just serves files over HTTPS.
- **OpenCV.js comes from the official build** `https://docs.opencv.org/4.13.0/opencv.js` (fallback `4.x`). It is ~10 MB and embeds the `.wasm`, so no MIME configuration is needed for it, and the repo stays small. The service worker caches it after the first visit (offline reopening).
- **Self-hosting option:** download opencv.js to `vendor/opencv/opencv.js`, add that path first in `OPENCV_URLS` in `shape.worker.js`. `netlify.toml` already caches `/vendor/*` for a year and serves any `*.wasm` as `application/wasm`.

## netlify.toml (what each part does)
- `[build] publish = "."`: serve the repository root.
- `[[headers]] for = "/*"`: `X-Content-Type-Options: nosniff`, a referrer policy, and a `Permissions-Policy` that allows the camera for this site only.
- `for = "/*.wasm"`: `Content-Type: application/wasm` + `Cache-Control: public, max-age=31536000, immutable`.
- `for = "/sw.js"`: `Cache-Control: no-cache`, so users never get stuck on an old service worker.
- From the Netlify page: header names are case-insensitive; multi-value headers can be written as a multi-line string; headers apply only to files served from Netlify's storage, not proxied content; `Content-Length`, `Content-Encoding`, `Set-Cookie`, `Date` can't be customised.

## Deploy steps
1. app.netlify.com → **Add new project → Import an existing project → GitHub** → pick `CAI2300FINALEXAM`.
2. Build command: empty. Publish directory: `.`. No environment variables. **Deploy**.
3. Every push to `main` redeploys automatically.

## Camera note
`getUserMedia` only works on secure origins (HTTPS or localhost), and Netlify is HTTPS by default.
