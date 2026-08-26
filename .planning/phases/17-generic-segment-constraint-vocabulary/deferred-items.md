# Phase 17 — Deferred Items

## From 17-01 execution

- **Pre-existing lint warning** (`scripts/check-data.test.mjs:14`): unused `dirname` import from `node:path`. Present at base commit d4d12e9d (Phase 16); untouched by this plan's changes per the scope boundary rule. Lint exits 0 (warning only). Candidate for a future cleanup pass.
