# Transactions and errors

Source: https://developer.mozilla.org/en-US/docs/Web/API/IndexedDB_API/Using_IndexedDB (fetched 2026-11-22)

- `db.transaction(['attempts'], 'readwrite')`; modes `readonly` (default), `readwrite`, `versionchange` (upgrades only).
- One `readwrite` transaction per store at a time; many `readonly` can overlap. Keep the scope small.
- A transaction stays alive only while it has pending requests. Returning to the event loop without a request (e.g. `await fetch()`, `await canvas.toBlob()`) lets it finish; the next request throws `TransactionInactiveError`. **Prepare data first, then open the transaction.**
- When all requests finish, `complete` fires (that is the commit). `abort()` or an unhandled error rolls everything back and fires `abort`.
- Errors bubble request → transaction → database; unhandled errors abort the transaction; `event.stopPropagation()` handles one locally. A catch-all `db.onerror` is useful for logging.
- `add` fails on an existing key; `put` inserts or replaces. `getAll()` returns all values (fine for our sizes); cursors are lazier.
