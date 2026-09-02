# Name Codex

## What This Is

Name Codex is a zero-backend, data-driven single-page application that helps IT administrators define, explore and govern naming conventions for Azure, Microsoft 365 (Teams, SharePoint, Exchange, Groups), Intune, Defender, Power Platform and Purview resources. Users pick an object type, assemble its segments in a visual builder, and the app generates, validates and documents the final name in real time, in English or French. The UI ships a complete dual dark/light theme that follows OS preference with a persistent manual toggle. Catalog is 59 conventions across 11 categories (Azure 27) — all JSON data-driven — with check:data gate (135 files PASS), bilingual EN/FR parity (911), and 240 vitest tests.

## Core Value

The generated name must always reflect the selected convention — correct segments, correct ordering, correct validation — so a user can copy a compliant, governance-scored name with confidence.

## Shipped Milestone: v1.10 Governance Insights (2026-09-01)

Governance Score actionable hints per failing rule (Add Environment, Fix double hyphen), Markdown policy export now includes Governance Score and JSON export provides structured conventionId/pattern/segments/validation/score, plus global search promotion scanning all 59 conventions live by translated name/description/id/pattern. 11 files (+241/-22), 59 conventions, 135 files PASS, 911 parity, 240 tests, 2 phases (24-25) 3 plans 6 tasks. Details: `.planning/milestones/v1.10-ROADMAP.md` / `.planning/ROADMAP.md`.

<details>
<summary>Shipped: v1.9 — Taxonomy and Description Fixes (2026-09-01)</summary>

Post-v1.8 fixes (59 conventions / Azure 27, 135 files PASS, 240 tests, 895 parity): APIM `APIM-[Purpose]-[Environment]` 7, AGW 8, APPI 13, ADF 14, EVH `EVHNS`+`EVH` grouped, LB grouped `lbi`/`lbe`, LOG 8, SQLDB 10, SQLSRV 11; descriptions expanded for all categories (Azure 13 + non-Azure 17) and `Pattern` removed from all descriptions/locales; validation expanded for all categories (check:data `description` ≥50/≥30, no pattern; data-integrity 20 tests). Tag `v1.9` at `a882674`.

</details>

<details>
<summary>Shipped: v1.8 — Data Tier + Observability + Network Edge (2026-09-01)</summary>

10 high-demand CAF conventions as pure JSON — sql/sqlsrv/apim/adf (53), log/appi/evh Namespace+Hub (56), lb/agw/afw + department 5→9 (59, Azure 24→27). 3 phases (21-23), 115→128 files PASS, 816 parity, 238 tests, zero code diff beyond Phase 19 wiring. Details: `.planning/ROADMAP.md` Phases 21-23.

</details>

<details>
<summary>Shipped: v1.7 — Constraint Wiring & CAF Expansion (2026-08-31)</summary>

Wired generic `SegmentConstraints` (allowedPattern filters options via `optionsForSegment`, minLength/maxLength validation rows + clamp, docs flipped live) and shipped 6 CAF conventions `acr/aks/cosmos/sb/func/app` (44→50, 18 Azure, 107 files, 490 EN/FR). Phases 19-20. Details: `.planning/ROADMAP.md`.

</details>

<details>
<summary>Shipped: v1.6 — Data Integrity (2026-08-28)</summary>

Zero-dep check:data gate validates every JSON under src/rules, src/data/segments, src/data/generators (unique values, non-empty descriptions, constraint declarations) — 96 files PASS — and blocks merge via parallel CI data job (DATA-01a/b). Generic segment constraint vocabulary (allowedPattern, minLength, maxLength) validated by the gate, typed as SegmentConstraints, documented bilingual in docs/DATA-FORMAT.md/_FR.md and deliberately inert (DATA-02). Region catalog 4→40 short codes (AUE..WUS3) and Country 4→40 ISO codes (AE..ZA) with EN/FR parity prove the gate as first real content growth (REG-01, UAT 7/7, vitest 226 PASS, threats_open 0). Details: `.planning/milestones/v1.6-ROADMAP.md`.

</details>

<details>
<summary>Shipped: v1.5 — Naming Convention Expansion (2026-08-25)</summary>

Catalog grew from 25 conventions across 7 categories to 45 across 11 — new Microsoft Teams, SharePoint, Power Platform and Purview categories plus Azure CAF (storage account with no-hyphen outlier validation, key vault, NSG, public IP) and Intune expansions (Autopilot device-name macro budget, Group Tag, Update Ring, Assignment Group) — all shipped as data-driven JSON with EN/FR parity and brand SVG icons. Builder correctness hardened via generic per-field `allowedPattern` validation and `assembleRawName`; catalog integrity locked by new vitest proofs (183 tests). Verification verdict COMPLETE-WITH-WAIVER: 9/9 mechanical gates green; manual dual smoke matrix waived by user approval. Details: `.planning/milestones/v1.5-ROADMAP.md`.

</details>

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Browse naming conventions by category (Azure, Entra ID, Exchange, Groups, Intune, Conditional Access, Defender) with search, pattern variants, descriptions and examples — existing (`src/rules/`)
- ✓ Visually assemble a name from segments with fixed/locked/recommended/reorderable behavior, custom segment addition, literals in patterns and empty-segment collapse — existing (`src/App.tsx` `buildSegments`, `renderSegmentEditor`)
- ✓ Live name generation with validation rules (length, allowed characters, mandatory segments) and a governance score /100 with per-rule checklist — existing (`normalizeName`, `validateName`, `governanceScore`)
- ✓ Segment governance: mutual exclusions, conditional values (allowed-values-by-field), auto-numbered policy IDs (CA/EM/DEVSEC) with persona-based ranges — existing (`optionsForSegment`, `generateCaPolicyIds`)
- ✓ Output & persistence: copy name/Markdown, favorites, history, last-object-per-category restore, Convention Reference value dictionary — existing (localStorage `name-codex-*` keys)
- ✓ Data-driven content layer: all conventions, segment libraries and generators are plain JSON bundled at build time — adding a convention requires no code changes — existing (`src/rules/`, `src/data/segments/`, `src/data/generators/`)
- ✓ Internationalization EN/FR with language switcher, translated UI, fields, tips and data values — existing (`src/i18n.ts`, `src/locales/en.json`, `src/locales/fr.json`)
- ✓ Static deployment to GitHub Pages via CI — existing (`.github/workflows/deploy.yml`)
- ✓ Repository in a clean, tagged `v1.0.0` release state: version `1.0.0` in package.json and lockfile, footer renders `v1.0.0`, annotated git tag `v1.0.0` at the baseline commit, production build passes on the committed state — Validated in Phase 1: Baseline Release v1.0
- ✓ React error boundary added in `main.tsx` so render/parse exceptions never blank the app — Validated in Phase 2: Backup & Safety Net (REFACT-03)
- ✓ Pure logic extracted from `App.tsx` into `src/lib/` modules (pattern parsing, validation, generators, segment resolution, storage) — Validated in Phase 3: Refactor App.tsx (REFACT-01)
- ✓ UI sections extracted from `App.tsx` into `src/components/` (builder row, reference card, score card, nav) — Validated in Phase 3: Refactor App.tsx (REFACT-02)
- ✓ Convention Reference lists correct EM/DEVSEC policy IDs (not CA0xx) for Emergency CA and Endpoint Security policies — Validated in Phase 4: Bug Fixes (BUGFIX-01)
- ✓ App no longer crashes on corrupt localStorage data (guarded parse + schema validation) — Validated in Phase 4: Bug Fixes (BUGFIX-02)
- ✓ Copy falls back to textarea + `execCommand` when Clipboard API is unavailable — Validated in Phase 4: Bug Fixes (BUGFIX-03)
- ✓ Feedback toasts sequence correctly (timer cleared per action) — Validated in Phase 4: Bug Fixes (BUGFIX-04)
- ✓ Defender for M365 category icon gets proper background/color styling — Validated in Phase 4: Bug Fixes (BUGFIX-05)
- ✓ `npm run lint` (oxlint) runs in CI gate alongside build and fails on lint errors — Validated in Phase 2: Backup & Safety Net (QA-01) + Phase 6 Node 22 bump (lint+test parallel, `needs [build,lint,test]`)
- ✓ Vitest configured with unit tests locking down the extracted core logic (137 tests, 85.46% lines, `jsdom` + `globals` + `v8`) — Validated in Phase 5: Tests (QA-02)
- ✓ Dead dependency `@fluentui/react-icons` removed from `package.json` + lockfile — Validated in Phase 6: Cleanup (CLEAN-01)
- ✓ Vite template assets (`vite.svg`, `react.svg`, `hero.png`) removed via `git rm` — Validated in Phase 6: Cleanup (CLEAN-02)
- ✓ Dead config/branches removed (`requireLockedSegments`/`requireRecommendedSegments`/`policyExamples`, “Conditional Access Policy” branches, `validation-rules.json` `segments` block) — Validated in Phase 6: Cleanup (CLEAN-03)
- ✓ Convention Reference list is memoized and capped (persona-narrowed, no eager 1100-ID expansion) — Validated in Phase 7: Performance Optimizations (PERF-01, useMemo + slice(0,100) + personaRangeKeyForField)
- ✓ Glob module map is indexed once (Map keyed by normalized name, no linear scans) — Validated in Phase 7: Performance Optimizations (PERF-02, segmentModuleMap 38 + generatorModuleMap 3)
- ✓ Segment keys are stable (no `Date.now()` churn, focus preserved) — Validated in Phase 7: Performance Optimizations (PERF-03, name-index / name-custom-prev.length)
- ✓ Fluent-style dark theme via semantic CSS tokens; future light mode is a pure token swap — Validated in Phase 8 (THEME-01); Groups/Intune brand SVG icons visually inert under token colors, accepted as-is
- ✓ Top command bar with global search, EN/FR language pill and primary actions — Validated in Phase 9 (LAYOUT-01)
- ✓ Left-rail navigation delivered as adjusted: collapsible rail removed by user-approved 09.1 fix (`82a1ea8`), NavPanel permanently expanded at 280px — Validated in Phase 9 (LAYOUT-02, scope adjustment)
- ✓ Monospace styling for patterns/generated names/policy IDs + denser panels per approved cut sheet — Validated in Phase 10 (DETAIL-01)
- ✓ Zero behavior change proven end-to-end — workflow-8 drift found and fixed, full 18/18 smoke matrix user-approved, VERIFICATION passed 10/10 — Closed in Phase 10 (SAFE-01)
- ✓ Light-mode values for all semantic tokens in `tokens.css`, WCAG AA pairs proven in both themes via theme-scoped `check:tokens` gate (18/18) — v1.4, Phase 11 (THEME-L-01)
- ✓ Theme resolution on boot: OS preference default, persisted localStorage override wins, pre-paint attribute applied before first render — v1.4, Phase 12 (THEME-L-02)
- ✓ Sun/moon toggle pill in the CommandBar with EN/FR label parity 374=374 and 175ms color-only fade — v1.4, Phase 12 (THEME-L-03)
- ✓ Zero behavior change beyond theming: exactly 137 tests, build/lint green, PERF-01..03 re-proofs, dual-theme smoke matrix user-approved 18/18 PASS — Closed in Phase 12 (THEME-L-04)
- ✓ Microsoft Teams category: project/department/service-team names (`PRJ-`/`DEPT-`/`SRV-`, ≤30-char maxLength) + Entra naming-policy format `GRP_[GroupName]_[Department]` with attribute tokens — v1.5, Phase 13 (TEAMS-01..04)
- ✓ SharePoint category: group-connected Team-site, Communication-site, Hub-site names with URL-segment guidance — v1.5, Phase 13 (SPO-01..03)
- ✓ Power Platform environment names per ALM strategy `<lifecycle>-<region>-<bu>-<purpose>` — v1.5, Phase 13 (PP-01)
- ✓ Purview compliance names: sensitivity label (+sublabel), retention label/policy, DLP policy with immutable-after-save / 7-day lead-time / audit-persistence tips — v1.5, Phase 13 (PURV-01..04)
- ✓ Azure CAF expansion: storage account (lowercase/no-hyphen `allowedPattern` + 24-char limit), key vault, NSG, public IP — v1.5, Phase 14 (AZURE-01..04)
- ✓ Intune expansion: Autopilot device-name template (%SERIAL%/%RAND:x% macros, hard 15-char budget), Group Tag, Update Ring, Assignment Group taxonomy — v1.5, Phase 14 (INTUNE-01..04)
- ✓ Catalog integrity proven: 45 conventions across 11 categories auto-discovered with zero code changes, locked by vitest proofs (45-count, search reachability ×20, EN=FR parity; suite 137→183 green) — Closed in Phase 15 (QUAL-01, verdict COMPLETE-WITH-WAIVER)
- ✓ JSON data layer validated by zero-dep check:data gate (schema shape, unique values, non-empty descriptions, constraint declarations; 96 files PASS) with CI data job fan-in to deploy — v1.6, Phases 16–18 (DATA-01a/b)
- ✓ Generic segment constraint vocabulary (allowedPattern raw anchored regex, minLength, maxLength) validated by check:data, typed SegmentConstraints, documented bilingual DATA-FORMAT.md/_FR.md — deliberately inert, no runtime wiring — v1.6, Phase 17 (DATA-02)
- ✓ Region catalog 4→40 short codes (AUE..WUS3) + Country 4→40 ISO codes (AE..ZA) with EN/FR parity, proving the gate as first real content growth; builder still assembles correct names — v1.6, Phase 18 (REG-01, UAT 7/7, threats_open 0)
- ✓ Builder enforces declared `SegmentConstraints` — `allowedPattern` filters options / `minLength`+`maxLength` clamp and validate inputs for Region, Environment, Instance and CAF Workload fields — v1.7, Phase 19 (WIRE-01)
- ✓ Container Registry names per CAF (`acr-[Environment]-[Region]-[Instance]`, lowercase globally unique, hyphen-free) — v1.7, Phase 20 (CAF-01)
- ✓ Kubernetes Service (AKS) names per CAF (`aks-[Environment]-[Region]-[Workload]-[Instance]`) — v1.7, Phase 20 (CAF-02)
- ✓ Cosmos DB names per CAF (`cosmos-[Workload]-[Environment]-[Region]-[Instance]` workload-first) — v1.7, Phase 20 (CAF-03)
- ✓ Service Bus names per CAF (`sb-[Workload]-[Environment]-[Region]-[Instance]`) — v1.7, Phase 20 (CAF-04)
- ✓ Function App names per CAF (`func-[Workload]-[Environment]-[Region]-[Instance]`, globally unique) — v1.7, Phase 20 (CAF-05)
- ✓ App Service names per CAF (`app-[Workload]-[Environment]-[Region]-[Instance]`, globally unique) — v1.7, Phase 20 (CAF-06)
- ✓ SQL Server + SQL DB + API Management + Data Factory as CAF `sqlsrv/sql/apim/adf-[Workload]-[Env]-[Region]-[Instance]` with workload libs — v1.8, Phase 21 (SQL-01..04)
- ✓ Log Analytics + App Insights + Event Hub (Namespace+Hub) as `log/appi/evh` with per-resource workload libs — v1.8, Phase 22 (OBS-01..03)
- ✓ Load Balancer + Application Gateway + Firewall + Department 5→9 (`LEGAL`/`SALES`/`SECURITY`/`RESEARCH`+Marketing) — v1.8, Phase 23 (NET-01..03 + DEPT-01) — catalog 59, Azure 27
- ✓ Taxonomy/description fixes for all categories — APIM `APIM-[Purpose]-[Environment]` (7), AGW (8), APPI (13), ADF (14), EVH `EVHNS`+`EVH` grouped, LB `lbi`/`lbe`, LOG (8), SQLDB (10), SQLSRV (11); descriptions expanded (Azure 13 + non-Azure 17), Pattern removed, validation ≥50/≥30 — v1.9 (59 conventions, 135 files, 911 parity, 240 tests)
- ✓ Governance Score actionable hints per failing rule with segment-aware navigation — v1.10, Phase 24 (GOV-01)
- ✓ Markdown policy export with Governance Score + JSON policy export for automation — v1.10, Phase 24 (GOV-02, GOV-03)
- ✓ Global search promotion scanning all 59 conventions live by translated name/description/id/pattern — v1.10, Phase 25 (NAV-01)

- ✓ Redis Cache `redis-[Workload]-[Environment]-[Region]-[Instance]` → updated to `redis-[Purpose]-[Region]-[Environment]` lowercase — v1.11, Phase 26 (CAF-07)
- ✓ Bastion Host `bas-[Workload]-[Environment]-[Region]-[Instance]` → updated to `BAS-[Region]-[Environment]` → `BAS-[Region]-[Environment]` Region-based — v1.11, Phase 26 + direct push (CAF-08)
- ✓ Recovery Services Vault `rsv-[Workload]-[Environment]-[Region]-[Instance]` → `rsv-[Workload]-[Region]-[Environment]` lowercase — v1.11, Phase 26 + direct push (CAF-09)
- ✓ NAT Gateway `ngw-[Workload]-[Environment]-[Region]-[Instance]` → `ngw-[Workload]-[Region]-[Environment]` lowercase — v1.11, Phase 26 + direct push (CAF-10)
- ✓ Synapse Workspace `synw-[Workload]-[Environment]-[Region]-[Instance]` → `synw-[Workload]-[Region]-[Environment]` all lowercase — v1.11, Phase 27 + direct push (CAF-11)
- ✓ Cognitive Services `cog-[Workload]-[Environment]-[Region]-[Instance]` → `ais-[Workload]-[Location]-[Environment]` Azure AI Services lowercase — v1.11, Phase 27 + direct push (CAF-12)
- ✓ Backup Vault `bvault-[Workload]-[Region]-[Environment]` lowercase with bvault-workload (SHARED/BACKUP/ARCHIVE/DR/SERVER/DATA/SAP/VAULT) — v1.12, Phase 28 (CAF-13)
- ✓ Databricks Workspace `adb-[Workload]-[Region]-[Environment]` lowercase with adb-workload (DATA/ANALYTICS/AI/ML/DATALAKE/ETL/STREAMING/BI) — v1.12, Phase 28 (CAF-14)
- ✓ Machine Learning Workspace `mlw-[Workload]-[Region]-[Environment]` lowercase with mlw-workload (SHARED/TRAIN/INFER/ML/AI/DATA/RESEARCH/ANALYTICS) as CAF-15 third pick — v1.12, Phase 28 (CAF-15) — catalog 65→68 Azure 33→36 153 files PASS 240 tests

### Active
- [ ] **CAF-16**: User can generate 4th new CAF convention per backlog as lowercase `prefix-[Workload]-[Region]-[Environment]`
- [ ] **CAF-17**: User can generate 5th new CAF convention per backlog as lowercase `prefix-[Workload]-[Region]-[Environment]`
- [ ] **CAF-18**: User can generate 6th new CAF convention per backlog as lowercase `prefix-[Workload]-[Region]-[Environment]`

### Future Candidates

<!-- Not committed to any milestone yet. -->

- GOV-04: Compliance checklist view (requires GOV-01)
- NAV-02: Category insights — per-category stats (convention count, compliance overview)
- LOCL-01: Additional languages beyond EN/FR
- Remaining CAF resources backlog per `docs/CATALOG-POSSIBILITIES.md` (bvault, adb, etc.)
- DATA-REF: Reference-integrity checks in `check:data` (segment-library refs, generator types, pattern tokens resolve)
- DATA-LOCL: Locale-key parity enforcement in `check:data` gate
- Perf follow-ups if scale demands: virtualization, bundle-size budget, lazy JSON loading

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Formal JSON Schema + ajv tooling — hand-rolled validator suffices at this scale (v1.6 decision, keep)
- Any backend, network layer, routing, or state library — deliberately not a goal; the app is static by design
- Location catalog alignment to region geography — deferred per user choice in v1.7 scoping (REG-02 partial); Location stays 2 values (AAD/AZ) this milestone
- Full CAF sweep in one go — scoped to 6 high-demand resources this milestone; remaining CAF resources stay in `docs/CATALOG-POSSIBILITIES.md` backlog

## Current Milestone: v1.12 CAF Expansion III

**Goal:** Expand the Azure CAF catalog with six additional high-demand conventions as pure data-driven JSON — EN/FR parity, Region-based lowercase patterns, all gates green — continuing the Region + lowercase convention established in recent direct pushes (BAS/ais/adf/ngw/redis/synw/rsv).

**Target features:**
- Six CAF conventions from backlog per `docs/CATALOG-POSSIBILITIES.md` (e.g., `bvault` Backup Vault, `adb` Databricks, plus 4 most-demanded remaining) — each as `prefix-[Workload/Purpose]-[Region]-[Environment]` lowercase with `core/region` + `core/environment` + per-resource Workload/Purpose library via `getConstraintsForField`
- Bilingual EN/FR locale keys for each new rule and workload library, auto-discovered via `import.meta.glob` — catalog 65→71 (Azure 33→39)

**Key context:** v1.11 shipped 6 Infra/Data AI conventions (59→65, Azure 27→33) but subsequent direct pushes updated 7 patterns to Region-based and lowercase (BAS, ais, adf, ngw, redis, synw, rsv) on main. v1.12 formalizes the next CAF sweep under the same data-driven, zero-code pattern with `check:data` + `build/lint/test` + `check:tokens` green.

## Constraints

- **Tech stack**: React 19 + TypeScript + Vite, plain CSS, no backend — app is static by design; do not introduce a server or build-time env requirements
- **Deployment**: static build to GitHub Pages via `.github/workflows/deploy.yml` (`base: './'`); CI runs `npm ci` → `build` → `lint` → `test` → `data` (`check:data`) → deploy (`needs [build,lint,test,data]`, Node 22, `actions/setup-node@v4` cache npm)
- **Data model**: conventions/segments/generators are plain JSON, auto-discovered at build time — new conventions must require no code changes
- **Bilingual**: EN/FR parity required; French UI/data strings must stay complete (locales/en.json and locales/fr.json mirror each other)
- **Local tooling**: `node_modules` currently holds Windows-only native bindings; on Linux, `npm ci` is required before `npm run lint`/`npm run build`/`npm test`
- **Git policy**: milestone work stays on its `gsd/<milestone>` branch (v1.4: `gsd/v1.4-light-mode`); merge to `main` only on explicit user approval; release markers are annotated tags

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| First milestone is baseline-only | User chose to formalize/document existing app; no improvement work in v1 | ✓ Done (Phase 1) |
| Planning artifacts kept local-only | User chose to keep `.planning/` git-ignored, not committed to git | ✓ Done |
| EN/FR i18n via i18next + keyed locale files | User selected keyed locale files over label_fr fields; translates in fr.json | ✓ Good |
| YOLO mode, coarse granularity, parallel plans | User workflow preferences | ✓ Good |
| v1.0.0 tag stays local (not pushed) | Local-only baseline milestone; pushing/deploy is the user's decision | ✓ Done (tag at 19318a7) |
| Version surfaced via `import pkg from "../package.json"` | Single source of truth; no hardcoded version string in JSX | ✓ Good |
| Version bumps via `npm version X --no-git-tag-version` | package.json + lockfile stay in sync atomically | ✓ Good |
| Release markers use annotated tags | tagger, date, and message recorded in the tag object | ✓ Good |
| Refactor before bug fixes, cleanup last | Fixes target extracted modules; cleanup avoids touching in-flight code | ✓ Good (Phases 3→4→6) |
| Backup sibling ../backups tar including .planning | Git-ignored planning captured, never committed, definitive snapshot | ✓ Good (../backups/*.tar.gz 925K) |
| ErrorBoundary class component bilingual fallback + Reload | React requires class, matches i18n, console.error only | ✓ Good (Phase 2) |
| CI lint gate parallel needs [build,lint] → [build,lint,test] Node 22 | Deploy blocked unless safety nets pass; Node 22 aligns local 22 | ✓ Good (Phases 2+5+6) |
| 7 lib modules + 16 components + useAppState 121 lines | Identical behavior, smoke 9/9 identical to v1.0 | ✓ Good (Phase 3) |
| Storage every(string) + getItem try at choke point | Single point protects all consumers, corrupt localStorage → empty state | ✓ Good (Phases 4→5 WR-04/06) |
| writeClipboard textarea finally + setSelectionRange | Stable identity, iOS support, no orphan leak | ✓ Good (Phases 4→5 WR-03) |
| Toast ref-held timer cleared per action | Persist across renders without state churn | ✓ Good (Phase 4) |
| Vitest in vite.config.ts jsdom/globals/v8 80% for src/lib | Single config, jsdom for mocks, threshold locks refactor | ✓ Good (Phase 5) |
| WR-03/04/06 fixed as Phase 5 task 0 before locking tests | Tests assert hardened contract, not buggy behavior | ✓ Good (Phase 5) |
| Cleanup npm uninstall atomic + git rm staged, grep proofs | Verifiable leaner, easy revert per CLEAN group, 2 commits | ✓ Good (Phase 6) |
| Module Maps eager at module scope keyed by normalized name | O(1) Map.get vs O(N) scan per render, built once at import | ✓ Good (Phase 7) |
| Marker-based subpath extraction (/segments/, /generators/) | Preserves nested keys like core/region; basename pop() broke resolution | ✓ Good (Phase 7) |
| referenceEntries useMemo + persona-narrow + slice(0,100) cap | Persona gives correct single range; cap is safety net for no-persona fallback | ✓ Good (Phase 7) |
| Stable keys name-index / name-custom-prev.length replacing Date.now() | Deterministic, no remount churn, focus preserved naturally | ✓ Good (Phase 7) |
| Perf proof via criterion check + grep, no benchmark suite | Zero behavior change is the lock; 137 tests + smoke identical to v1.1 | ✓ Good (Phase 7) |
| Token layer verbatim from checker-approved UI-SPEC; check:tokens gate | No invented values; gate proves 0 literals + WCAG pairs mechanically every phase | ✓ Good (Phase 8) |
| Brand SVG icons kept despite inert token tinting | Official art preferred over fill="currentColor" refactor; user accepted at checkpoint | ⚠️ Revisit if themed icons wanted |
| Collapsible rail removed by approved mid-phase fix (09.1) | Live layout review showed always-expanded NavPanel is better UX | ✓ Good (user-approved adjustment of LAYOUT-02) |
| Honest FAIL recording per D-12 drift rule (workflow 8) | Drift surfaced immediately instead of being deferred to UAT; no tag-on-drift | ✓ Good (Phase 10 gap closure) |
| Filtered-first selection resolution at useAppState.ts:102–106 | Empirically proven root cause; nullish chain terminates at allConventions[0]; PERF guards re-proven | ✓ Good (D-14 exception documented) |
| Light canvas #e4e9f2 + darkened secondary text #54647e per user checkpoint | User-selected navy tint; secondary text holds AA (4.92:1) on new canvas | ✓ Good (Phase 11) |
| Brand-title gradient tokenized (--brand-title-from/to) | Gradient adapts per theme instead of hardcoding dark tints | ✓ Good (Phase 11) |
| check:tokens theme-scoped dual parse (never merged maps) | Gate proves WCAG pairs per theme mechanically every pretest run | ✓ Good (Phase 11) |
| Boot-time resolution only — no matchMedia live listener (D-05) | Simplest contract honoring OS at load; toggle is the manual override | ✓ Good (Phase 12) |
| Pre-paint inline script duplicates storage key string w/ sync note (D-09) | data-theme set before React mounts = no flash of wrong theme; single-source-of-truth documented | ✓ Good (Phase 12) |
| Explicit-only persistence, no reset UI (D-08) | Absent key = follow OS; clearing storage IS the reset | ✓ Good (Phase 12) |
| Dual-theme smoke matrix user-run with honest recording (D-10/D-12) | Visual judgment belongs to the user; FAILs are findings not process failures | ✓ Good (Phase 12) |
| No new unit tests for theming — suite stays exactly 137 (D-11) | Behavior-neutral lock held; verification via gates + grep re-proofs + user smoke | ✓ Good (Phase 12) |
| v1.5 catalog growth as data-driven JSON only; zero-code-diff proof vs `v1.4` | 45 conventions / 11 categories with no code changes; each of 36 surviving src diffs justified to its originating commit (D-06/D-09) | ✓ Good (Phases 13–15) |
| Generic per-field `allowedPattern` validation instead of storage-account special case | One mechanism covers the no-hyphen outlier AND Purview Sublabel no-space class (closed UAT-13-07) | ✓ Good (Phase 13/15) |
| Pure `assembleRawName` from live `builderSegments` | Custom Segment Builder values were silently dropped from generated names; pure helper fixes assembly at one point | ✓ Good (Phase 14 UAT fix) |
| Catalog-integrity assertions locked into vitest suite (45 count, 11 categories, search reachability ×20, EN=FR) | Future data additions are mechanically guarded against drift; suite 137→183 | ✓ Good (Phase 15) |
| Dual smoke matrix waived by direct user approval; honest COMPLETE-WITH-WAIVER verdict | User chose to forego manual subjective coverage; nothing fabricated — mechanical evidence stands alone | ⚠️ Revisit: budget for manual smoke next milestone |
| Zero-dep check:data gate hand-rolled not ajv, exported validators for vitest, collect-all file:reason, empty-string sentinel allowed | Keeps bundle zero, tests import validators directly, intentional blank values (defender no-notification) preserved | ✓ Good (Phase 16) |
| Generic constraints file-level only, raw anchored regex, declaration-only validation, bilingual DATA-FORMAT docs | Mirrors NamingValidationConfig naming, one regex convention, gate never executes patterns (ReDoS safe), contributor doc is one-stop reference | ✓ Good (Phase 17) |
| Region+Country expanded as 40 short codes per user approval (deviation from canonical slugs) + Country bonus out of scope | Preserves WE/NE/FRC/FRS backward compat, short codes match naming convention style, Country ISO-2 is principal list 40 | ✓ Good (Phase 18, UAT 7/7) |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

- v1.6 shipped on 2026-08-28: 3 phases (16–18), 5+0 plans, 6 tasks, 96 files gated, 226 tests, data gate + constraint docs + 80 catalog entries (Region+Country); direct impl on main, UAT 7/7, threats_open 0. Tag v1.6 pending.
- v1.7 shipped on 2026-08-31: constraint wiring (WIRE-01) + 6 CAF conventions (acr/aks/cosmos/sb/func/app); catalog 45→50, Phases 19-20.
- v1.8 shipped on 2026-09-01: 10 CAF conventions (sql/sqlsrv/apim/adf/log/appi/evh/lb/agw/afw + dept 5→9); catalog 50→59, Azure 18→27, Phases 21-23.
- v1.9 shipped on 2026-09-01: taxonomy/description fixes for all 11 categories; 59 conventions, 135 files PASS, 911→895→911 parity, 240 tests. Tag v1.9 at a882674.
- v1.10 shipped on 2026-09-01: governance insights (GOV-01..03 + NAV-01); 2 phases (24-25), 59 conventions, 135 files PASS, 911 parity, 240 tests.
- v1.11 shipped on 2026-09-01: CAF Expansion II — Infra + Data/AI (redis/bas/rsv/ngw/synw/cog); catalog 59→65, Azure 27→33, direct pushes to Region-based lowercase (BAS, ais, adf, ngw, redis, synw, rsv) on main. Tags v1.11 at 0574403/d63fa6b.
- v1.12 started on 2026-09-02: CAF Expansion III — 6 high-demand CAF conventions as Region-based lowercase; catalog 65→71 planned.
- v1.12 Phase 28 shipped on 2026-09-02: Backup Vault + Databricks + ML Workspace (bvault/adb/mlw) as Region-based lowercase CAF; catalog 65→68 Azure 33→36 153 files PASS 240 tests 1018 EN/FR parity.

---
*Last updated: 2026-09-02 at Phase 28 complete*
