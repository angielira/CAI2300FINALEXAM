# Seeing and resetting IndexedDB in Chrome DevTools

Source: https://developer.chrome.com/docs/devtools/storage/indexeddb (not fetched in the build session: approval needed; steps match Chrome's Application panel)

1. Right-click the page → **Inspect** → **Application** tab (under **»** if hidden).
2. Sidebar **Storage → IndexedDB** → expand the origin's databases → **salsashapes** shows its version and object stores.
3. Click a store (`references`, `attempts`, `settings`) to list records; expand a value to inspect it. Click an index to see records in index order.
4. The view is **not live**: press **Refresh** after the app writes.
5. Select a record and delete it, or **Clear object store**, or (on the database) **Delete database**.
6. Everything at once: sidebar **Storage** → **Clear site data** (IndexedDB, Cache storage, service workers…) → reload.
