# 05 · Why the app can hang, and how to fix it in Chrome DevTools

Sources:
- Chrome DevTools, view and change IndexedDB data: https://developer.chrome.com/docs/devtools/storage/indexeddb (not fetched in the build session: needed approval; steps written from the official page and Chrome's current UI as known)
- MDN Using IndexedDB (blocked upgrades): https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB
- MDN Using Web Workers (terminate, onerror): https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers

## Nine ways it can get stuck
| What you see | Likely cause | Built-in protection | Manual fix |
|---|---|---|---|
| Pill stuck on "Loading OpenCV…" | 10 MB opencv.js still downloading, or blocked | 2-minute load timeout → error banner with **Try again** | Check Console for a red error; check your connection; reload |
| "OpenCV error" banner | docs.opencv.org unreachable (offline, firewall) | worker tries 4.13.0 then 4.x | Reload when online; after one good visit the service worker has a copy |
| Spinner "OpenCV is looking…" forever | worker stuck on a huge photo or GrabCut | photos capped at 800 px; worker restarted after 30 s | Turn GrabCut off; reload |
| Library says "Opening library…", banner about other tabs | a blocked database upgrade: another tab still has the old version open | `onblocked` banner; old tabs close on `onversionchange` | Close other tabs of the app, reload |
| "No dancer found" | wall and clothes too similar, busy background | message suggests fixes | Manual threshold slider, GrabCut on, plainer wall |
| Odd old data / errors after an update | stale or broken records | n/a | **Reset app data**, or DevTools → Application → Storage → Clear site data |
| "Could not save" | `QuotaExceededError` | caught, explained | Delete attempts; Reset app data |
| Page slows down after many photos | a Mat not deleted (Wasm memory leak) | tracker frees every Mat; "Mats still in memory: 0" | Reload now; ask the orchestrator to have the WebAssembly expert find the leak |
| Old version of the app after a deploy | service worker served cached files | network-first for app files; `sw.js` never cached | Reload once; or Application → Service workers → Unregister |

## DevTools walk-through (Chrome)
1. Right-click the app → **Inspect** (⌘⌥I / Ctrl+Shift+I).
2. Top tabs: **»** → **Application** (or click it if visible).
3. Left sidebar → **Storage → IndexedDB** → expand → **salsashapes**: shows version 1 and stores `references`, `attempts`, `settings`. **Delete database** removes just this database.
4. Click a store to see one row per record; expand a value to look inside (Blobs show as Blob, points as Int32Array).
5. The view does **not** update live: press the refresh button above the table after a new attempt.
6. Reset everything: sidebar **Storage** → under **Clear site data** keep IndexedDB (and Cache storage) ticked → **Clear site data** → close DevTools → reload.
7. Service worker problems: **Application → Service workers → Unregister**, or tick **Update on reload** while testing.
