# Netlify headers

Source: https://docs.netlify.com/manage/routing/headers/ (fetched 2026-11-22)

- Add `[[headers]]` tables to `netlify.toml`: `for` = path (supports `*` wildcards and `:placeholder`s, not combined in one segment), `[headers.values]` = map of header → value. Names are case-insensitive.
- Multi-value headers: a multi-line string, collapsed to one comma-joined header.
- Headers apply only to files served from Netlify's storage (not proxied content, functions or edge functions).
- Can't be customised: `Content-Length`, `Content-Encoding`, `Location`, `Set-Cookie`, `Date`.
- Headers in `netlify.toml` / `_headers` are global across deploy contexts.
