# Main-thread rules for this app

Sources: `docs/02-webassembly-and-workers.md` · https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers

- The page never touches `cv`. It sends an `ImageBitmap` (transferred) and draws the returned pixels with `ctx.putImageData(new ImageData(pixels, w, h), 0, 0)`.
- Keep the photo `Blob` (not the bitmap: it is transferred away) so "Run again" can re-analyse with new settings.
- Revoke object URLs when re-rendering the library (`URL.revokeObjectURL`) to avoid leaking memory on the JS side too.
- Create Blobs (`canvas.toBlob`) **before** opening an IndexedDB transaction (Ledger's rule).
- Settings writes are debounced (250 ms).
