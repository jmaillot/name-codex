---
type: integrations
last_updated: 2026-08-19
last_mapped_commit: c37becaef560ef8eea72992c340c4ac27fd8c0f8
---

# External Integrations

**Analysis Date:** 2026-08-19

## APIs & External Services

**Runtime: None.**
- The application makes **zero network calls at runtime** — no `fetch`, `axios`, `XMLHttpRequest`, `WebSocket`, or third-party SDK usage exists anywhere in `src/` (verified by grep across `*.ts`/`*.tsx`).
- There are no CDN-sourced assets or `@import` of remote resources in `src/` or `index.html`; all scripts, styles and assets are bundled locally by Vite.
- All domain content (naming conventions, segment values, validation rules, policy-ID generators) is shipped as static JSON committed to the repo and loaded eagerly at build/bundle time via `import.meta.glob` in `src/App.tsx`:
  - `src/rules/**/*.json` — naming conventions per category (Azure, Entra ID, Exchange, Groups, Intune, Conditional Access, Defender)
  - `src/data/segments/**/*.json` — segment value libraries
  - `src/data/generators/*.json` — auto-numbered policy ID generators
  - `src/data/segment-catalog.json`, `src/data/validation-rules.json`, `src/data/ca-numbering-ranges.json`

## Data Storage

**Databases:**
- None — no database client, no ORM, no persistence layer.

**File Storage:**
- Local filesystem (repo) only — the data layer is static JSON files under `src/data/` and `src/rules/`; the production build outputs to `dist/`.

**Caching:**
- None (no service worker, no IndexedDB, no cache API).

**Client-side persistence:**
- `localStorage` (browser API) — used for favorites, copy history and last-selected object per category. Keys in `src/App.tsx`:
  - `name-codex-history-v11-6` — copied-name history (`src/App.tsx:688`, `:952`)
  - `name-codex-favorites-v11-6` — saved favorites (`src/App.tsx:691`, `:965`)
  - `name-codex-last-object-by-category-v11-6` — last-selected object per category (`src/App.tsx:646`, `:666`, `:694`)
  - `name-codex-recent-objects-v11-5` — legacy key, actively removed on load (`src/App.tsx:697`)

## Browser APIs Used

- `localStorage` — persistence (see above)
- `navigator.clipboard.writeText` — copy generated name / Markdown docs to clipboard (`src/App.tsx:949`, `:957`)

## Authentication & Identity

**Auth Provider:**
- None. No login, no OAuth, no tokens, no identity flows. The app is fully public and client-side only.

## Monitoring & Observability

**Error Tracking:**
- None — no Sentry, no telemetry SDK.

**Logs:**
- None — no logging framework or analytics; the browser console is the only sink.

## CI/CD & Deployment

**Hosting:**
- GitHub Pages — live at https://name-codex.jeremymaillot.fr/ (custom domain; `base: './'` in `vite.config.ts` makes asset paths relative for subpath hosting)

**CI Pipeline:**
- GitHub Actions — `.github/workflows/deploy.yml`:
  - Triggers: push to `main`, manual `workflow_dispatch`
  - `build` job: `actions/checkout@v4` → `actions/setup-node@v4` (Node 20, npm cache) → `npm ci` → `npm run build` → `actions/upload-pages-artifact@v3` (path `dist`)
  - `deploy` job: `actions/deploy-pages@v4` with `environment: github-pages`
  - Permissions: `contents: read`, `pages: write`, `id-token: write` (OIDC for Pages deploy)
  - Concurrency group `pages` with `cancel-in-progress: true`

## Environment Configuration

**Required env vars:**
- None — no `.env` files, no `import.meta.env` usage, no CI secrets beyond the automatic `GITHUB_TOKEN`-based Pages OIDC flow.

**Secrets location:**
- Not applicable — no secrets are used.

## Webhooks & Callbacks

**Incoming:**
- None — no webhook endpoints (no server).

**Outgoing:**
- None — the app never calls out to external endpoints.

## External Data Sources

**Not applicable** — all data is static content committed to the repository. Nothing is fetched from Microsoft/Azure/Entra APIs; the naming standards are authored locally as JSON.

---

*Integration audit: 2026-08-19*
