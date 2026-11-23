# Opening a database, versions and upgrades

Source: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB (fetched 2026-11-22)

- `const req = indexedDB.open('salsashapes', 1)` → `IDBOpenDBRequest`; `req.result` is the `IDBDatabase` in `onsuccess`.
- The version is an integer that names the schema. Versions are rounded (2.1 and 2.4 both become 2, and upgrading between them fires nothing).
- Missing database → created; higher version → `onupgradeneeded`; lower version → `VersionError` (always handle `onerror`).
- `onupgradeneeded` is the **only** place to create/delete stores and indexes. Creating an existing store or deleting a missing one throws. Changing a keyPath = delete + recreate (data lost: copy it first).
- After a successful upgrade, `onsuccess` fires.
- Multiple tabs: an upgrade waits until every other connection closes. `req.onblocked` fires meanwhile. Old tabs should do `db.onversionchange = () => db.close()` and tell the user to reload.
- Pattern: `if (e.oldVersion < 1) {…} if (e.oldVersion < 2) {…}` so any old version upgrades step by step.
