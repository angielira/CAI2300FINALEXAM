---
name: indexeddb-persistence
description: Design and change the IndexedDB library safely: versioned schema, short transactions, Blobs, quota errors, blocked upgrades and Reset app data.
---

# indexeddb-persistence

Shared by: `indexeddb-expert`, `frontend-engineer`, `qa-tester`

1. Read `docs/03-indexeddb-storage.md` and `js/db.js`.
2. Schema changes only in `onupgradeneeded`, guarded by `if (event.oldVersion < N)`, and bump `DB_VERSION`.
3. One short transaction per operation; prepare Blobs *before* opening it (no awaits on non-IDB work inside).
4. Handle `onblocked` (banner: close other tabs) and `onversionchange` (close the connection).
5. Catch `QuotaExceededError` and tell the user what to delete.
6. Prove it: run `tests/browser/db.test.html` phases write → read → reset with `tests/browser/cdp.mjs` and the same `--profile`.
