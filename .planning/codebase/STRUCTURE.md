---
type: codebase-doc
doc: structure
last_updated: 2026-08-19
last_mapped_commit: c37becaef560ef8eea72992c340c4ac27fd8c0f8
---
# Codebase Structure

**Analysis Date:** 2026-08-19

## Directory Layout

```
name-codex/
├── .github/
│   └── workflows/
│       └── deploy.yml            # GitHub Pages CI/CD (build + deploy dist/)
├── .planning/                    # GSD planning artifacts (not tracked by app)
│   └── codebase/                 # Codebase mapper documents (this file lives here)
├── dist/                         # Production build output (gitignored, served by Pages)
├── docs/
│   └── screenshot.png            # README screenshot
├── public/                       # Static assets copied verbatim to dist/
│   ├── apple-touch-icon.png
│   ├── favicon-16x16.png
│   ├── favicon-32x32.png
│   ├── favicon-192.png
│   ├── favicon-512.png
│   ├── favicon.svg
│   └── icons.svg
├── src/
│   ├── App.tsx                   # ENTIRE application (1572 lines: UI + logic + data loading)
│   ├── App.css                   # All component styling (1327 lines, plain CSS)
│   ├── index.css                 # Root font smoothing (6 lines)
│   ├── main.tsx                  # React bootstrap (createRoot + StrictMode)
│   ├── assets/
│   │   ├── hero.png
│   │   ├── name-codex.svg        # Logo
│   │   ├── react.svg / vite.svg  # Default Vite assets (unused leftovers)
│   │   └── icons/                # Category icons (azure, entra-id, exchange, groups,
│   │                             #   intune, conditional-access, defender — SVG)
│   ├── data/
│   │   ├── segment-catalog.json      # Shared segment field definitions
│   │   ├── validation-rules.json     # Global/per-category validation overrides
│   │   ├── ca-numbering-ranges.json  # CA policy ID persona → prefix ranges
│   │   ├── generators/               # Programmatic value generators (3 files)
│   │   └── segments/                 # Segment value libraries (38 files)
│   │       ├── core/                 # Shared segments (country, environment, instance…)
│   │       ├── azure/                # Azure-specific segments
│   │       ├── conditional-access/   # CA segments (persona, apps, controls…)
│   │       ├── defender/             # Defender segments
│   │       ├── entra/                # Entra ID segments
│   │       ├── exchange/             # Exchange segments
│   │       ├── groups/               # Groups segments
│   │       └── intune/               # Intune segments
│   ├── rules/                        # Naming conventions (25 files, 7 categories)
│   │   ├── azure/                    # 8 rules
│   │   ├── conditional-access/       # 2 rules
│   │   ├── defender/                 # 3 rules
│   │   ├── entra-id/                 # 1 rule
│   │   ├── exchange/                 # 2 rules
│   │   ├── groups/                   # 4 rules
│   │   └── intune/                   # 5 rules
│   └── types/
│       └── Rule.ts                  # NamingConvention / NamingField / config types
├── index.html                   # HTML shell (mounts #root, loads /src/main.tsx)
├── package.json                 # Scripts + dependencies (react, lucide-react, fluentui icons)
├── package-lock.json
├── tsconfig.json                # Solution-style: references app + node configs
├── tsconfig.app.json            # App TS config (bundler resolution, strict checks)
├── tsconfig.node.json           # Node-side TS config (vite.config.ts)
├── vite.config.ts               # Vite config (react plugin, base: './')
├── .oxlintrc.json               # oxlint config (react/ts/oxc plugins)
├── .gitignore
└── README.md
```

## Directory Purposes

**`src/` — Application source:**
- Purpose: All TypeScript code, styles, and JSON data
- Contains: `App.tsx`, `main.tsx`, `App.css`, `index.css`, `types/`, `data/`, `rules/`, `assets/`
- Key files: `src/App.tsx` (all logic + UI), `src/types/Rule.ts` (domain types)

**`src/data/` — Segment & governance data:**
- Purpose: Data consumed by the engine — segment value libraries, generators, global configs
- Contains: `segment-catalog.json` (shared field definitions, 230 lines), `validation-rules.json` (49 lines), `ca-numbering-ranges.json` (90 lines), `generators/` (3 files), `segments/` (38 files)
- Loaded via: eager `import.meta.glob("./data/segments/**/*.json")` and `import.meta.glob("./data/generators/*.json")` in `src/App.tsx:65-73`

**`src/rules/` — Naming conventions:**
- Purpose: One JSON file per naming standard; the primary content the app renders
- Contains: 25 convention files organized by category subdirectory (`azure/`, `conditional-access/`, `defender/`, `entra-id/`, `exchange/`, `groups/`, `intune/`)
- Loaded via: eager `import.meta.glob("./rules/**/*.json")` in `src/App.tsx:248-251`

**`src/types/` — TypeScript domain types:**
- Purpose: The data-contract interfaces for rules, fields, builder configs, and validation
- Contains: `src/types/Rule.ts` (`NamingConvention`, `NamingField`, `NamingPatternOption`, `NamingBuilderConfig`, `NamingValidationConfig`, `DropdownValue`, `NamingFieldOption`)

**`src/assets/` — Static images & icons:**
- Purpose: Logo (`name-codex.svg`), category icons (`icons/`), and screenshots
- Note: `react.svg` / `vite.svg` are Vite scaffolding leftovers — not referenced by the app

**`public/` — Root-level static assets:**
- Purpose: Favicons and icons copied verbatim to the build root, referenced from `index.html:5-8`
- Committed: Yes

**`.github/workflows/` — CI/CD:**
- Purpose: Deploy the static build to GitHub Pages on push to `main` (`deploy.yml`: `npm ci` → `npm run build` → upload `dist/` → deploy-pages)

**`dist/` — Build output:**
- Purpose: Production bundle produced by `npm run build`
- Generated: Yes (gitignored — `dist` in `.gitignore:11`; not tracked in git)

**`.planning/` — GSD planning artifacts:**
- Purpose: Phase plans, codebase maps, and execution tracking for the GSD workflow
- Generated: Yes (gitignored; not tracked in git)

## Key File Locations

**Entry Points:**
- `index.html`: HTML shell, mounts `#root`, loads `/src/main.tsx`
- `src/main.tsx`: React 19 `createRoot` + `<StrictMode>` render of `<App />`
- `src/App.tsx` (`App` component at line 541): the sole top-level component

**Configuration:**
- `package.json`: scripts (`dev`, `build`, `lint`, `preview`), deps
- `vite.config.ts`: react plugin, `base: './'` for subpath deployment
- `tsconfig.json` / `tsconfig.app.json` / `tsconfig.node.json`: project references, bundler resolution, strict flags (`noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`)
- `.oxlintrc.json`: lint rules (react + typescript + oxc plugins)
- `.github/workflows/deploy.yml`: deployment pipeline

**Core Logic (all in `src/App.tsx`):**
- Pattern parsing: `parsePattern()` — `src/App.tsx:276`
- Segment value resolution: `valuesForField()` — `src/App.tsx:350`; `optionsForSegment()` — `src/App.tsx:219`
- Generators: `generateSequence()` / `generateCaPolicyIds()` / `generateValues()` — `src/App.tsx:108-155`
- Builder state: `buildSegments()` — `src/App.tsx:400`
- Name generation & normalization: `normalizeName()` — `src/App.tsx:448`
- Validation: `validateName()` — `src/App.tsx:462`; `governanceScore()` — `src/App.tsx:486`
- Persistence helpers: inline in `App` effects/handlers — `src/App.tsx:645-698, 947-977`

**Types:**
- `src/types/Rule.ts`: all domain interfaces

**Testing:**
- Not detected — no test framework, no test files, no `*.test.*` / `*.spec.*` anywhere

## Naming Conventions

**Files:**
- JSON data files: `kebab-case` (e.g. `azure-virtual-machine.json`, `ca-emergency-policy.json`, `segment-catalog.json`)
- TypeScript files: `camelCase` single-word or short names (`App.tsx`, `main.tsx`, `Rule.ts`)
- Icon assets: `kebab-case.svg` (e.g. `conditional-access.svg`)

**Directories:**
- All lowercase: `rules`, `data`, `segments`, `generators`, `types`, `assets`, `icons`
- Category directories inside `src/rules/` and `src/data/segments/` mirror the app's categories: `azure`, `conditional-access`, `defender`, `entra`/`entra-id`, `exchange`, `groups`, `intune`, plus `core` for shared segments

**Types:**
- Interfaces: `PascalCase` with a domain prefix (`NamingConvention`, `NamingField`, `NamingBuilderConfig`, `NamingValidationConfig`, `NamingPatternOption`)
- Type aliases: `PascalCase` (`DropdownValue`, `NamingFieldOption`); local component-level types in `App.tsx` (`BuilderSegment`, `ValidationResult`, `PatternToken`, `SegmentGenerator`)

**Functions:**
- `camelCase`, verb-first where possible (`buildSegments`, `generateValues`, `normalizeName`, `validateName`, `parsePattern`, `optionsForSegment`)

**Components:**
- `PascalCase` (`App`, `InfoIcon`, `CardTitle`)

**Variables/State:**
- `camelCase`; UI state pairs as `noun` + `setNoun` (`builderSegments`, `selectedConventionId`, `objectSearch`, `actionFeedback`)

**CSS Classes:**
- `kebab-case` (`builder-row`, `card-title-line`, `glass-card`, `multi-select-chip`, `policy-id-editor`)

**Data IDs:**
- Rule `id` values: `kebab-case`, prefixed by category (`azure-virtual-machine`, `ca-emergency-policy`, `endpoint-security-policy`)

**localStorage Keys:**
- `name-codex-` prefix with explicit version suffix: `name-codex-history-v11-6`, `name-codex-favorites-v11-6`, `name-codex-last-object-by-category-v11-6`

## Where to Add New Code

**New naming convention (no code changes needed):**
- Create `src/rules/<category>/<my-rule>.json` following the `NamingConvention` shape (`src/types/Rule.ts:61-79`); it is auto-discovered by `import.meta.glob` and appears in the category nav
- Reference existing segment libraries via the `library` field (e.g. `"library": "core/environment"`); inline `values` for one-off segments
- Reference a generator via the `generator` field (e.g. `"generator": "devsec-policy-id"`)

**New segment library:**
- Add `src/data/segments/<category>/<name>.json` with `{ "name": ..., "values": [...] }` shape (see `src/data/segments/core/instance.json`)
- Optional: register the field in `src/data/segment-catalog.json` to give it a shared `label`, `type`, `tip`, and catalog-wide `library` reference

**New generator:**
- Add `src/data/generators/<name>.json` with `type: "sequence"` (range expansion) or `type: "caPolicyId"` (prefixed persona ranges; see `src/data/generators/ca-policy-id.json`)

**New validation override:**
- Edit `src/data/validation-rules.json` (per-category/per-name) or use the rule's inline `validation` block

**New UI / component:**
- Currently all UI lives in `src/App.tsx`; for small additions extend `App`, for substantial work create a component in a new `src/components/` directory and import it in `src/App.tsx`

**New types:**
- Add interfaces to `src/types/Rule.ts` and import with `import type { ... } from "./types/Rule"` (or `src/types/Rule` with `allowImportingTsExtensions` + `verbatimModuleSyntax`)

**New global static asset (favicon etc.):**
- Place in `public/` and reference with a root-relative path (`/favicon.svg`) from `index.html`

**New icon asset:**
- Add SVG under `src/assets/icons/` and wire it into `getCategoryIcon()` at `src/App.tsx:294-308`

**Tests:**
- No test infrastructure exists. If introducing one, prefer Vitest (Vite-native) with config at the repo root; note the pure helper functions in `src/App.tsx` (e.g. `parsePattern`, `valuesForField`, `validateName`) are the natural unit-test targets

## Special Directories

**`dist/`:**
- Purpose: Production bundle output
- Generated: Yes (`npm run build`)
- Committed: No (`dist` in `.gitignore:11`)

**`node_modules/`:**
- Purpose: npm dependencies
- Generated: Yes
- Committed: No

**`.planning/`:**
- Purpose: GSD workflow artifacts (codebase maps, phase plans)
- Generated: Yes (by GSD tooling)
- Committed: No

**`docs/`:**
- Purpose: README assets (screenshot)
- Generated: No
- Committed: Yes

**`public/`:**
- Purpose: Static files copied to the build root
- Generated: No
- Committed: Yes

---

*Structure analysis: 2026-08-19*
