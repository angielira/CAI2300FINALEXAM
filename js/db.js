/* Salsa Shape Matcher: the IndexedDB layer.
 * Owner: Ledger (indexeddb-expert). Reviewed by Vera (qa-tester).
 *
 * Database "salsashapes", version 1, three object stores:
 *   references  { id, name, createdAt, points:Int32Array, aspect, solidity, imageBlob, thumbBlob }
 *               index "byName" (name), index "byCreated" (createdAt)
 *   attempts    { id, createdAt, refId, refName, score, parts, metrics, ms, originalBlob, resultBlob, thumbBlob }
 *               index "byCreated" (createdAt), index "byRef" (refId)
 *   settings    { key, ...values }
 * Every read/write runs inside its own short transaction. Nothing awaits non-IDB
 * work while a transaction is open (that would make it inactive).
 */
'use strict';

const DB_NAME = 'salsashapes';
const DB_VERSION = 1;

let dbPromise = null;
const listeners = { blocked: [], versionchange: [] };

function on(event, fn) { listeners[event].push(fn); }
function emit(event, detail) { listeners[event].forEach((fn) => fn(detail)); }

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (!('indexedDB' in self)) { reject(new Error('This browser has no IndexedDB.')); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);

    req.onupgradeneeded = (event) => {
      // The ONLY place the schema can change. Runs on first visit and on version bumps.
      const db = req.result;
      if (event.oldVersion < 1) {
        const refs = db.createObjectStore('references', { keyPath: 'id' });
        refs.createIndex('byName', 'name', { unique: false });
        refs.createIndex('byCreated', 'createdAt', { unique: false });
        const attempts = db.createObjectStore('attempts', { keyPath: 'id' });
        attempts.createIndex('byCreated', 'createdAt', { unique: false });
        attempts.createIndex('byRef', 'refId', { unique: false });
        db.createObjectStore('settings', { keyPath: 'key' });
      }
      // Future: if (event.oldVersion < 2) { ...add a store or index... }
    };

    // Another tab still has an older version open: the upgrade waits.
    req.onblocked = () => emit('blocked');

    req.onsuccess = () => {
      const db = req.result;
      // A newer version opened in another tab: close so it can upgrade.
      db.onversionchange = () => { db.close(); dbPromise = null; emit('versionchange'); };
      // The browser closed it (DevTools "Clear site data", storage eviction): reopen next time.
      const mine = dbPromise;                       // set by now: onsuccess always runs later
      db.onclose = () => { if (dbPromise === mine) dbPromise = null; };
      resolve(db);
    };
    req.onerror = () => { dbPromise = null; reject(req.error); };
  });
  return dbPromise;
}

/** Run one request in its own transaction and resolve when the transaction commits. */
async function run(store, mode, makeRequest) {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    let result;
    const req = makeRequest(tx.objectStore(store));
    if (req) req.onsuccess = () => { result = req.result; };
    tx.oncomplete = () => resolve(result);
    tx.onerror = () => reject(tx.error || (req && req.error));
    tx.onabort = () => reject(tx.error || new Error('Transaction aborted'));
  });
}

function newId() {
  return (self.crypto && crypto.randomUUID) ? crypto.randomUUID()
    : Date.now().toString(36) + Math.random().toString(36).slice(2);
}

const DB = {
  DB_NAME, DB_VERSION, on, openDB, newId,

  // References (the shapes you practise towards)
  saveReference: (ref) => run('references', 'readwrite', (s) => s.put(ref)),
  getReference: (id) => run('references', 'readonly', (s) => s.get(id)),
  deleteReference: (id) => run('references', 'readwrite', (s) => s.delete(id)),
  async listReferences() {
    const all = await run('references', 'readonly', (s) => s.index('byCreated').getAll());
    return (all || []).reverse();                   // newest first
  },

  // Practice attempts (your history)
  saveAttempt: (a) => run('attempts', 'readwrite', (s) => s.put(a)),
  getAttempt: (id) => run('attempts', 'readonly', (s) => s.get(id)),
  deleteAttempt: (id) => run('attempts', 'readwrite', (s) => s.delete(id)),
  async listAttempts() {
    const all = await run('attempts', 'readonly', (s) => s.index('byCreated').getAll());
    return (all || []).reverse();
  },
  attemptsFor: (refId) => run('attempts', 'readonly', (s) => s.index('byRef').getAll(refId)),

  // Settings
  async getSettings() {
    const row = await run('settings', 'readonly', (s) => s.get('prefs'));
    return row || null;
  },
  saveSettings: (prefs) => run('settings', 'readwrite', (s) => s.put({ key: 'prefs', ...prefs })),

  /** How much this site stores (IndexedDB + caches), as estimated by the browser. */
  async estimate() {
    if (!navigator.storage || !navigator.storage.estimate) return null;
    return navigator.storage.estimate();
  },

  /** "Reset app data": close our connection, delete the whole database. */
  async resetAll() {
    if (dbPromise) {
      try { (await dbPromise).close(); } catch (e) { /* was not open */ }
      dbPromise = null;
    }
    await new Promise((resolve, reject) => {
      const req = indexedDB.deleteDatabase(DB_NAME);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
      req.onblocked = () => emit('blocked');        // another tab holds it open
    });
  },
};

self.DB = DB;
