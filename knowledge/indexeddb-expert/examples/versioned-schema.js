// Worked example (Ledger): a schema that can grow without losing data.
// Version 1 is what the app ships. Version 2 shows how a future "favourite" index would be added.
function openLibrary(version = 1) {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('salsashapes', version);
    req.onupgradeneeded = (e) => {
      const db = req.result, tx = req.transaction;
      if (e.oldVersion < 1) {
        const refs = db.createObjectStore('references', { keyPath: 'id' });
        refs.createIndex('byName', 'name');
        refs.createIndex('byCreated', 'createdAt');
        const att = db.createObjectStore('attempts', { keyPath: 'id' });
        att.createIndex('byCreated', 'createdAt');
        att.createIndex('byRef', 'refId');
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      if (e.oldVersion < 2 && version >= 2) {
        tx.objectStore('references').createIndex('byFavourite', 'favourite');   // existing rows are kept
      }
    };
    req.onblocked = () => console.warn('Upgrade waiting: another tab has the old version open.');
    req.onsuccess = () => { req.result.onversionchange = () => req.result.close(); resolve(req.result); };
    req.onerror = () => reject(req.error);
  });
}
