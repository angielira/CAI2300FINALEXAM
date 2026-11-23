# Planning the build: dependencies and parallel waves

Sources: `docs/expert-roster.md`, `docs/README.md`, the exam guide (step 9), https://code.claude.com/docs/en/sub-agents (not fetched in the build session).

## Dependency graph for the Salsa Shape Matcher
```
Wave 1 (parallel): Iris pipeline · Ledger database · Wren flow+states · Rosa salsa content · Harbor netlify.toml
Wave 2 (parallel): Forge worker (needs Iris) · Sable styles (needs Wren) · Vera writes tests (needs Iris+Ledger)
Wave 3:            Juno page (needs Forge, Ledger, Sable, Rosa)
Wave 4 (parallel): reviews: Forge→Iris (memory), Iris→Forge (cv usage), Wren→Juno (states), Vera runs all tests
Wave 5 (parallel): Quill README/How it works/Resources · Harbor final headers · Echo syncs agents/knowledge
```
## Acceptance rules
- Work is accepted only after a peer review and Vera's PASS lines.
- A FAIL goes back to the owner with the exact output; the reviewer re-checks.
- Every hand-off is one row in `docs/handoff-log.md`.
