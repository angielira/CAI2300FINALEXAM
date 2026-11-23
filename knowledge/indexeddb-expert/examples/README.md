# Example outputs (recorded 2026-11-22, Chrome headless)

```
blocked-upgrade-demo.html
v2: BLOCKED by an open older connection
after 300 ms the upgrade finished? false
old connection closes (user closed the old tab)
v2 open: stores = more, things
v2 connection got versionchange and closed itself
v3 open without waiting: true
title: PASS
```
- `reset-app-data.js`: the same steps as `DB.resetAll()` + the app's reset button; exercised by `tests/browser/db.test.html?phase=reset` (PASS: database deleted, fresh database empty).
- `versioned-schema.js`: version 1 is exactly the app's schema (tested by `db.test.html`); the version-2 branch is a pattern for future changes (syntax-checked, not shipped).
