# Blobs, quotas and eviction

Sources: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria (fetched 2026-11-22) · https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API

- Values are stored by structured clone: `Blob`, `File`, typed arrays (`Int32Array`), `Date`, nested objects all work. Tested: an Int32Array and JPEG Blobs round-trip and decode (`tests/browser/db.test.html`).
- Chromium: up to **60 % of total disk** per origin (both modes); all browser storage capped at 80 % of the disk.
- **Best-effort** (default): may be evicted without warning under storage pressure, least-recently-used origin first, and the **whole origin** is cleared at once (IndexedDB, Cache Storage, …).
- `navigator.storage.persist()` requests persistent storage (Chrome decides automatically, no prompt). `navigator.storage.estimate()` → `{usage, quota}` (estimates, padded for cross-origin data).
- Over quota → `QuotaExceededError` on write: catch it, tell the user, free space.
- Keep records small: we store ≤800 px JPEGs and 240–360 px thumbnails, not raw camera files.
