---
type: stack
last_updated: 2026-08-19
last_mapped_commit: c37becaef560ef8eea72992c340c4ac27fd8c0f8
---

# Technology Stack

**Analysis Date:** 2026-08-19

## Languages

**Primary:**
- TypeScript ~6.0.2 (resolved 6.0.3) — all application code in `src/` (`src/App.tsx`, `src/main.tsx`, `src/types/Rule.ts`)
- HTML — entry shell `index.html`
- CSS — styling in `src/index.css`, `src/App.css`

**Secondary:**
- JSON — the entire domain data layer: naming conventions, segment libraries, validation rules and ID generators are plain JSON files under `src/rules/`, `src/data/segments/`, `src/data/generators/` (loaded at build time via `import.meta.glob` in `src/App.tsx`)

## Runtime

**Environment:**
- Browser runtime — this is a client-only SPA; there is no server runtime
- Node.js for dev/build tooling — CI workflow pins Node 20 (`.github/workflows/deploy.yml`), local environment runs Node v22
- No `engines` field in `package.json` or `package-lock.json`

**Package Manager:**
- npm (lockfileVersion 3)
- Lockfile: `package-lock.json` present, committed
- Install command used in CI: `npm ci` (`.github/workflows/deploy.yml`)

## Frameworks

**Core:**
- React ^19.2.7 (resolved 19.2.8) — UI framework (`src/main.tsx` mounts `<App />` into `#root` via `createRoot`)
- react-dom ^19.2.7 (resolved 19.2.8)
- TypeScript config uses `"jsx": "react-jsx"` (`tsconfig.app.json`)

**Icons:**
- lucide-react ^1.31.0 — used in `src/App.tsx` (imports `ArrowUp, ArrowDown, X, Pin, Lock, Star`)
- @fluentui/react-icons ^2.0.334 — declared in `package.json` dependencies but **not imported anywhere in `src/`** (dead dependency)

**Testing:**
- Not applicable — no test framework, no test files, no test scripts

**Build/Dev:**
- Vite ^8.1.1 (resolved 8.1.5) — dev server, HMR, production bundler
- @vitejs/plugin-react ^6.0.3 (resolved 6.0.4) — React fast-refresh plugin
- oxlint ^1.71.0 (resolved 1.75.0) — linting (`npm run lint`)

## Key Dependencies

**Critical (runtime):**
- react / react-dom ^19.2.7 — the only runtime framework
- lucide-react ^1.31.0 — all in-app icons (`src/App.tsx:2`)

**Infrastructure (dev):**
- vite ^8.1.1 — bundler and dev server
- typescript ~6.0.2 — type-checking gate in `npm run build` (`tsc -b && vite build`)
- oxlint ^1.71.0 — lint gate
- @types/node ^24.13.2, @types/react ^19.2.17, @types/react-dom ^19.2.3 — type definitions
- @fluentui/react-icons — installed but unused (see Concerns/cleanup candidate)

**Transitive:** ~85 top-level packages in `node_modules` per lockfile; no large framework chains beyond React + Vite.

## Configuration

**Environment:**
- No `.env` files present; no `import.meta.env` usage in `src/` — the app has **zero environment variables**
- All runtime "state" is browser-local: `localStorage` keys `name-codex-history-v11-6`, `name-codex-favorites-v11-6`, `name-codex-last-object-by-category-v11-6` (`src/App.tsx:646-697`)

**Build:**
- `vite.config.ts` — sets `base: './'` (relative asset paths, required for GitHub Pages subpath serving) and the React plugin
- `tsconfig.json` (references), `tsconfig.app.json` (app: ES2023 target, `moduleResolution: "bundler"`, `resolveJsonModule: true`, `verbatimModuleSyntax`), `tsconfig.node.json` (vite config: `module: "nodenext"`)
- `.oxlintrc.json` — enables `react`, `typescript`, `oxc` plugins; `react/rules-of-hooks` as error, `react/only-export-components` as warn

## Platform Requirements

**Development:**
- Node.js LTS (CI uses Node 20; local verified on Node v22)
- `npm install` then `npm run dev` (Vite dev server, default http://localhost:5173/)

**Production:**
- Static file host — build output `dist/` can be served by any static server
- Deployed to GitHub Pages at https://name-codex.jeremymaillot.fr/ via `.github/workflows/deploy.yml`
- No backend, no server-side rendering, no build-time env required

## Scripts (`package.json`)

| Script | Command | Purpose |
|--------|---------|---------|
| `npm run dev` | `vite` | Dev server with HMR |
| `npm run build` | `tsc -b && vite build` | Type-check + production build to `dist/` |
| `npm run lint` | `oxlint` | Lint with oxlint |
| `npm run preview` | `vite preview` | Preview production build locally |

---

*Stack analysis: 2026-08-19*
