# 03 · IndexedDB: the shape library

**Question:** how do we store reference shapes, practice attempts (image Blobs), settings and history in IndexedDB, with versions, transactions and storage limits?

Sources:
- MDN IndexedDB API: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API
- MDN Using IndexedDB: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB (fetched 2026-11-22)
- MDN Storage quotas and eviction criteria: https://developer.mozilla.org/en-US/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria (fetched 2026-11-22)

## Key ideas (from MDN)
- `indexedDB.open(name, version)` returns a request; the database is ready in `onsuccess`. A version is an **integer** (2.4 rounds to 2). A missing database is created; a higher version triggers an upgrade; a lower one is a `VersionError`.
- `onupgradeneeded` is the **only** place the schema can change: create/delete object stores and indexes. To change a store's keyPath you must delete and recreate it (its data goes with it).
- `onblocked` fires when another tab still has the old version open. The old tab should listen for `db.onversionchange` and call `db.close()` so the upgrade can proceed.
- Transactions: `readonly` (default) or `readwrite`. Only one readwrite transaction per store runs at a time. A transaction stays active only while it has pending requests: **awaiting a `fetch()` or a timer inside a transaction lets it auto-commit**, and the next request throws `TransactionInactiveError`. So: prepare Blobs first, then open the transaction.
- Errors bubble request → transaction → database; an unhandled error aborts the whole transaction.
- Values are stored with the structured-clone algorithm: plain objects, `Blob`s, typed arrays (`Int32Array` contour points) all store directly (tested in `tests/browser/db.test.html`).

## Our schema: database `salsashapes`, version 1
| Store | keyPath | Indexes | Holds |
|---|---|---|---|
| `references` | `id` | `byName`, `byCreated` | name, contour `points` (Int32Array), `aspect`, `solidity`, result image Blob, thumbnail Blob |
| `attempts` | `id` | `byCreated`, `byRef` | refId/refName, score and its parts, metrics, time, original photo Blob (≤800 px JPEG), result Blob, thumbnail Blob |
| `settings` | `key` | none | one row `prefs`: threshold, clean-up, GrabCut, ghost, autosave, selected reference |

IDs are `crypto.randomUUID()`. Lists use `index('byCreated').getAll()` and reverse for newest first. Practise-history charts use `index('byRef').getAll(refId)`.

## Storage limits (MDN)
- Chromium lets one origin use up to **60 % of the total disk**; browser-wide cap 80 %.
- Default is **best-effort**: the browser may evict a whole origin's data (least-recently-used first) under storage pressure. `navigator.storage.persist()` asks for persistent storage (Chrome decides automatically).
- `navigator.storage.estimate()` gives usage/quota, which is shown in the app footer.
- Writes over quota fail with `QuotaExceededError`; the app catches it and suggests deleting attempts or using Reset app data.
- A refresh keeps data; it is **not a backup** (lecture slide 8). Clearing site data deletes it.

## Reset app data
Close our connection, then `indexedDB.deleteDatabase('salsashapes')` (handle `onblocked`), delete Cache Storage, unregister the service worker, reload.
