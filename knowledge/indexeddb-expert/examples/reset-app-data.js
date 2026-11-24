// Worked example (Ledger): the "Reset app data" function.
// Close our own connection first (or our own tab would block the delete),
// delete the database, then the caches and the service worker, then reload.
async function resetAppData(db, name = 'balletposes') {
  if (db) db.close();
  await new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase(name);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
    req.onblocked = () => alert('Close the other tabs of this app, then try again.');
  });
  if (self.caches) for (const key of await caches.keys()) await caches.delete(key);
  if (navigator.serviceWorker) for (const r of await navigator.serviceWorker.getRegistrations()) await r.unregister();
  location.reload();
}
