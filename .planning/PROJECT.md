# Name Codex

## What This Is

Name Codex is a zero-backend, data-driven single-page application that helps IT administrators define, explore and govern naming conventions for Azure, Microsoft 365, Intune, Defender, Exchange and Groups resources. Users pick an object type, assemble its segments in a visual builder, and the app generates, validates and documents the final name in real time, in English or French.

## Core Value

The generated name must always reflect the selected convention — correct segments, correct ordering, correct validation — so a user can copy a compliant, governance-scored name with confidence.

## Shipped Milestone: v1.3 Developer Portal UI (2026-08-24)

Azure Portal / Fluent-inspired reskin with zero behavior change — semantic design-token dark theme (`tokens.css`, light mode = pure token swap), CommandBar layout with global search + EN/FR switcher, monospace developer-portal polish on denser panels. SAFE-01 proven end-to-end via full 9×EN/FR smoke matrix after fixing the one drift found (workflow-8 filter→builder refresh). Details: `.planning/milestones/v1.3-ROADMAP.md`.

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

### Active

(None — next milestone not defined. Run `/gsd-new-milestone`.)

### Future Candidates

<!-- Not committed to any milestone yet. -->

- DATA-01: JSON data layer validated by schema check and reference-integrity script before shipping
- DATA-02: Segment-level validation rules wired in (Region, Location, Environment, Instance, OS, PolicyId)
- LOCL-01: Additional languages beyond EN/FR
- Perf follow-ups if scale demands: virtualization, bundle-size budget, lazy JSON loading

### Validated (from v1.2)

- ✓ Convention Reference list is memoized and capped (persona-narrowed, no eager 1100-ID expansion per render) — Validated in Phase 7: Performance Optimizations (PERF-01, 07-02 a0a59bb)
- ✓ Glob module map is indexed once (Map keyed by normalized module name, not linear scans) — Validated in Phase 7: Performance Optimizations (PERF-02, 07-01 fae0517)
- ✓ Segment keys are stable (no `Date.now()` churn, focus preserved, no full editor remount) — Validated in Phase 7: Performance Optimizations (PERF-03, 07-03 4d8abeb)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- JSON data-layer schema validation and reference-integrity checks — deferred; fragile but not user-facing today (candidates for a future hardening milestone)
- Additional languages beyond EN/FR — explicitly excluded by user for this milestone
- Any backend, network layer, routing, or state library — deliberately not a goal; the app is static by design

## Context

- Technical environment: React ^19 + TypeScript ~6 + Vite ^8, plain CSS, no router/state library/server. All content is JSON bundled via eager `import.meta.glob`. Runtime state is browser-local (`localStorage` keys with `-v11-6` suffix). Vitest `jsdom` + `globals` + `v8` coverage 80% for `src/lib/` added in v1.1.
- The app is deployed at https://name-codex.jeremymaillot.fr/ via GitHub Pages (CI `npm ci` → `build` → `lint` → `test` → deploy, `needs [build,lint,test]`, Node 22).
- The codebase was mapped on 2026-08-19 (`.planning/codebase/`); STACK, STRUCTURE, CONVENTIONS, CONCERNS, INTEGRATIONS, TESTING and ARCHITECTURE documents exist. v1.1 decomposed `App.tsx` 1632→121 lines into `src/lib/` 7 modules + `src/components/` 16 files + `useAppState` hook; 137 tests lock the refactor.
- EN/FR internationalization is implemented (i18next + react-i18next) with a flat-key locale structure and full French translations; committed in `94c074a` with a follow-up label fix in `69adebf`.
- README.md and README_FR.md document the app and include an end-user guide.
- Planning artifacts are intentionally kept local-only (`.planning/` is git-ignored).
- v1.0 shipped on 2026-08-19: version `1.0.0`, footer version display, annotated git tag `v1.0.0` at `19318a7`.
- v1.1 shipped on 2026-08-21: 5 phases (2-6), 14 plans, 33 tasks, 47 files modified, 3,209 LOC TS/TSX, `5→137` tests, CI lint+test gates on Node 22, repo leaner (dead dep/assets/config removed), zero behavior change. Annotated tags `v1.0.0` and `v1.1` available.
- v1.2 shipped on 2026-08-21: 1 phase (7), 3 plans, 7 tasks, 4 files modified (`data.ts`, `useAppState.ts`, `segments.ts`, `ReferenceCard.tsx`), 3,216 LOC TS/TSX — Map-indexed module lookups, memoized/capped/persona-narrowed reference list, stable segment keys; 137 tests + build/lint green, 9-workflow smoke identical to v1.1, security audit 9/9 closed, UAT 6/6 pass. Annotated tag `v1.2`.

## Current State

<details>
<summary>Shipped: v1.0 — Baseline Release v1.0 (2026-08-19)</summary>

- Repository in a clean, tagged `v1.0.0` release state: pending i18n work committed, version `1.0.0` in package.json + lockfile, footer renders `v1.0.0`, annotated tag `v1.0.0` at the baseline commit.
- Production build (`tsc -b && vite build`) passes on the committed state.
- All baseline capabilities (BASE-01..08) validated; v1.0 requirements (REPO-01..03) complete.

</details>

<details>
<summary>Shipped: v1.1 — Quality & Refactor (2026-08-21)</summary>

- Monolith extracted: `src/lib/` 7 modules + `src/components/` 16 files + `useAppState` hook; `App.tsx` 121-line composition root; 9-workflow smoke test identical to v1.0 (Phase 3).
- Safety net: full repo backup `../backups/name-codex-backup-2026-08-20T101239Z.tar.gz` + `v1.0.0` rollback, ErrorBoundary bilingual fallback, CI lint gate → test gate `needs [build,lint,test]` on Node 22 (Phases 2 + 5).
- 5 correctness bugs fixed: EM/DEVSEC fallback range, corrupt localStorage `every(string)`+`try`, clipboard `textarea+execCommand`+`finally`, toast ref-timer, Defender rose `#e11d48` (Phase 4, 6 WARN/6 INFO deferred, 3 fixed as WR-03/04/06 in Phase 5).
- Tests: Vitest `jsdom`/`globals`/`v8` in `vite.config.ts` + `src/test/setup.ts`, 6 files 137 tests 85.46% lines covering 6 core funcs + JSON integrity + persona coupling (Phase 5).
- Cleanup: `@fluentui/react-icons` uninstalled (73 lock deletions), 3 Vite assets `git rm`, 24 rule JSONs + `validation-rules.json` segments block + 4 “Conditional Access Policy” branches removed in `Rule.ts`/`NavPanel`/`BuilderCard`/`useAppState` (Phase 6) — triple gate `build` 1926 modules/`lint`/`test` green, zero behavior change.
- Milestone: 5 phases (2-6), 14 plans, 33 tasks, 47 files, 3,209 LOC, 2 days execution, annotated tag `v1.1` at `b768043`.

</details>

<details>
<summary>Shipped: v1.2 — Performance (2026-08-21)</summary>

- Module lookups: `segmentModuleMap` (38) + `generatorModuleMap` (3) built once at import in `src/lib/data.ts`, keyed by normalized subpath; `getSegmentFile`/`getGeneratorFile` are single `Map.get` — no linear scan in render paths (PERF-02, fae0517).
- Reference list: `referenceEntries` memoized via `useMemo([builderSegments, activeFields, i18n.language])`, persona-narrowed via `personaRangeKeyForField` → `caPolicyIdOptionsForRange` (single 100-entry range), capped at 100 with truncation note — no eager 1100-ID expansion per render (PERF-01, a0a59bb).
- Segment keys: stable `${name}-${index}` / `${name}-custom-${prev.length}` replace `Date.now()` churn; editing preserves focus, no editor remount (PERF-03, 4d8abeb).
- Verification: 137 tests + build/lint green unchanged, 9-workflow smoke identical to v1.1, security audit 9 threats 0 open, UAT 6/6 pass.
- Milestone: 1 phase (7), 3 plans, 7 tasks, 4 files, same-day ship, annotated tag `v1.2`.
</details>

**Shipped: v1.3 — Developer Portal UI (2026-08-24)**

- Design tokens: `src/styles/tokens.css` (36 declarations verbatim from checker-approved UI-SPEC), wired as first import; full surface/control repaint; legacy `:root` + `--accent-2` retired; `check:tokens` gate proves 0 color/font literals + 9/9 WCAG pairs; light mode is a pure `data-theme="light"` swap (Phase 8).
- Layout: sticky token-only CommandBar (global search, language pill, primary actions), ConfigureCard 2-col reflow with CommandBar-owned search, single-row chrome at 1100px; EN/FR parity 372=372 keys incl. aria keys; collapsible rail removed by user-approved 09.1 fix — NavPanel always expanded at 280px (Phase 9).
- Polish: `var(--font-mono)` on core-3 code-like targets, all 5 legacy Consolas literals torn out, uniform density cut sheet landed exactly; IN-01 stale comments cleaned in gap closure (Phase 10, plan 10-01).
- Verification: workflow-8 drift caught by honest smoke record per D-12, empirically root-caused to selection-resolution precedence, fixed via filtered-first nullish chain (`useAppState.ts:102–106`, documented D-14 exception); full 9×EN/FR smoke matrix re-run with explicit user approval; live EN↔FR toggle confirmed; VERIFICATION passed 10/10; security gate threats_open: 0 across 11 threats.
- Milestone: 3 phases (8–10), 10 plans (incl. 2 gap-closure), ~25 tasks, 24 files (+1,662/−264), src/ 4,830 LOC TS/TSX/CSS, ~1 day execution.

## Next Milestone Goals

(None committed — project stable as shipped.)

Candidates carried forward:
- **Data integrity**: JSON data-layer schema validation + reference-integrity script before shipping (DATA-01); segment-level validation rules wired in (DATA-02)
- **Localization**: additional languages beyond EN/FR (LOCL-01)
- **Light mode**: now a pure `data-theme="light"` token swap thanks to Phase 8
- Deferred perf follow-ups if scale demands: virtualization, bundle-size budget, lazy loading of JSON

## Constraints

- **Tech stack**: React 19 + TypeScript + Vite, plain CSS, no backend — app is static by design; do not introduce a server or build-time env requirements
- **Deployment**: static build to GitHub Pages via `.github/workflows/deploy.yml` (`base: './'`); CI runs `npm ci` → `build` → `lint` → `test` → deploy (`needs [build,lint,test]`, Node 22, `actions/setup-node@v4` cache npm)
- **Data model**: conventions/segments/generators are plain JSON, auto-discovered at build time — new conventions must require no code changes
- **Bilingual**: EN/FR parity required; French UI/data strings must stay complete (locales/en.json and locales/fr.json mirror each other)
- **Local tooling**: `node_modules` currently holds Windows-only native bindings; on Linux, `npm ci` is required before `npm run lint`/`npm run build`/`npm test`
- **v1.3 git policy**: testing only — all work stays on branch `gsd/v1.3-developer-portal-ui`; merge to `main` only on explicit user approval

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

---
*Last updated: 2026-08-24 after v1.3 milestone completion*
