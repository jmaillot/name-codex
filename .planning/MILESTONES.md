# Project Milestones: Name Codex

## v1.5 Naming Convention Expansion (Shipped: 2026-08-25)

**Delivered:** Catalog grew from 25 conventions across 7 categories to 45 across 11 — new Microsoft Teams, SharePoint, Power Platform and Purview categories plus Azure CAF and Intune expansions — all shipped as data-driven JSON with EN/FR parity and proven by a zero-code-diff verification vs `v1.4`.

**Phases completed:** 3 phases (13–15), 13 plans, 25 tasks

**Key accomplishments:**

- Four brand-new categories (Teams, SharePoint, Power Platform, Purview) + Azure CAF expansion (storage account with lowercase/no-hyphen outlier validation + 24-char limit, key vault, NSG, public IP) + Intune expansion (Autopilot device name with `%SERIAL%`/`%RAND:x%` macro budget under the hard 15-char limit, Group Tag, Update Ring, Assignment Group) — all data-driven JSON only (AZURE-01..04, TEAMS-01..04, SPO-01..03, PP-01, PURV-01..04, INTUNE-01..04)
- Brand SVG icons for the new categories wired into the nav with theme-aware brand-color tokens; data-level fix replacing no-op Prefix segments with literal prefixes in patterns
- Builder correctness fixes from UAT/review sweeps: generic per-field `allowedPattern` validation (+ no-space class on Sensitivity Sublabel, closing UAT-13-07), pure `assembleRawName` honoring custom Segment Builder values, `validateName` synced to `activeFields`, stale-select sentinel option, phantom-default numeric input removed (WR-01..WR-06)
- Catalog integrity locked by 4 new vitest proofs in `data-integrity.test.ts` — 45 conventions / 11 categories / 20-id search reachability / EN=FR parity — suite grown 137→183 tests, all green
- Milestone verification honest verdict COMPLETE-WITH-WAIVER: all five mechanical gates exit 0 with verbatim evidence; v1.4..HEAD zero-code-diff proof with each of 36 survivors justified to its originating commit; dual smoke matrix waived by direct user approval (0/24 cells executed, none fabricated)

**Stats:**

- 68 files modified, +3,663 / −598 (git diff v1.4..HEAD)
- src/ now ~4,242 lines TS/TSX (plus grown JSON data layer)
- 3 phases, 13 plans, 25 tasks
- 2 days execution (2026-08-24 → 2026-08-25)

**Git range:** tag `v1.4` → `149d96b` (`fix(15)` WR-05 token exemptions) — 60 commits; tag `v1.5`

**Known waiver at close:** manual dual smoke matrix foregone by user approval — milestone proven on mechanical evidence only (see `.planning/phases/15-milestone-verification-full-catalog-integrity/15-VERIFICATION.md`). Code review follow-ups (1 blocker: truncation-before-validate ordering in `useAppState.ts`; 5 warnings) recorded in 15-REVIEW.md.

**What's next:** Not yet defined — `/gsd-new-milestone`. Candidates carried in PROJECT.md Future Candidates (DATA-01/02 schema validation, LOCL-01 extra languages, CAF abbreviation backlog).

---

## v1.4 Light Mode (Shipped: 2026-08-24)

**Delivered:** Full light theme as a pure token swap on the v1.3 semantic token layer — OS-aware boot-time theme resolution with persistent sun/moon CommandBar toggle — zero behavior change beyond theming, proven end-to-end by a user-approved 18/18 dual-theme smoke matrix (THEME-L-04).

**Phases completed:** 2 phases (11–12), 5 plans, 8 tasks

**Key accomplishments:**

- Complete navy-tinted light palette — all 28 UI-SPEC contract value groups populated into `:root[data-theme="light"]` (+`color-scheme: light`): #e4e9f2 canvas → #ffffff panels, darkened accent (#2e6fe0/#1e56c0), AA-safe status/category shades, tokenized brand-title gradient; zero changes outside tokens.css; worst pair --text-secondary on canvas = 4.92:1 (THEME-L-01)
- Theme-scoped `check:tokens` gate — parses `:root` and `:root[data-theme="light"]` into separate maps (never merged), full 9-pair WCAG matrix per theme (18/18) with var()-chain resolution and negative-control testing
- Boot-time theme resolution with no flash of wrong theme — inline pre-paint script + `src/lib/theme.ts`; allowlist-validated localStorage key `name-codex-theme-v14-0`; absent key = follow OS preference, stored override wins (THEME-L-02)
- Sun/moon toggle pill in CommandBar `[theme][EN/FR]` cluster — lucide-react icons showing target theme, bilingual tooltip/aria-labels parity 374=374 (`ui.themeSwitchToDark/Light`), 175ms color-only fade via transient `html.theme-anim` class with reduced-motion guard and unmount cleanup (THEME-L-03)
- Behavior-neutrality proven (THEME-L-04) — exactly 137 Vitest tests (zero added), build/lint green, PERF-01..03 grep re-proofs intact, dual-theme smoke matrix user-run 9×dark/light all PASS; code review 0 critical, WR-01 fixed (`a3567b1`) + IN-01..07 resolved

**Stats:**

- 31 files modified (+845 / −2023), src/ now 5,057 lines TS/TSX/CSS
- 2 phases, 5 plans, 8 tasks
- Same-day execution (2026-08-24, ~3h from v1.3 tag)

**Git range:** tag `v1.3` → `HEAD` (27 commits; tag `v1.4`)

**What's next:** No next milestone defined — project stable as shipped. `/gsd-new-milestone` when ready.

---

## v1.3 Developer Portal UI (Shipped: 2026-08-24)

**Delivered:** Azure Portal / Fluent-inspired reskin with zero behavior change — semantic design-token dark theme (light mode = pure token swap), CommandBar layout with global search + EN/FR switcher, monospace developer-portal polish on denser panels, and milestone-wide behavior-neutrality proven end-to-end (SAFE-01 signed off).

**Phases completed:** 3 phases (8–10), 10 plans, 17 tasks

**Key accomplishments:**

- Semantic token layer `src/styles/tokens.css` — 36 declarations from checker-approved UI-SPEC, wired as first import; full surface/controls repaint; legacy `:root` + `--accent-2` retired; `check:tokens` gate proves 0 color/font literals + 8→9/9 WCAG pairs; light mode is now a pure `data-theme="light"` swap (THEME-01)
- Layout restructure — sticky token-only CommandBar (global search, language pill, primary actions), ConfigureCard 2-col reflow with CommandBar-owned search, single-row 1100px chrome; EN/FR locale parity 372=372 keys incl. Phase 9 aria keys (LAYOUT-01; LAYOUT-02 delivered as approved adjustment: collapsible rail removed by user-approved 09.1 fix `82a1ea8`, NavPanel always expanded at 280px)
- Developer-portal polish — `var(--font-mono)` on all core-3 code-like targets (generated names, pattern code, policy IDs), 5 legacy Consolas literals torn out, uniform density cut sheet landed exactly; IN-01 stale comments cleaned in gap closure (DETAIL-01)
- Behavior-neutrality proven end-to-end (SAFE-01) — workflow-8 drift caught by honest smoke recording per D-12, empirically root-caused to selection-resolution precedence (`useAppState.ts:102–106`), fixed via filtered-first nullish chain, and the full 9×EN/FR smoke matrix re-run clean with explicit user approval
- Quality gates held at every phase boundary — exactly 137 Vitest tests (zero added), build/lint green, PERF-01..03 grep proofs intact, security gate threats_open: 0 across 11 classified threats

**Stats:**

- 24 files modified (+1,662 / −264), src/ now 4,830 lines TS/TSX/CSS
- 3 phases, 10 plans (incl. 2 gap-closure plans), ~25 tasks
- ~1 day execution (2026-08-23 → 2026-08-24)

**Git range:** `feat(08-01)` `6a3edf7` → `HEAD` (37 commits; tag `v1.3`)

**What's next:** No next milestone defined — project stable as shipped. `/gsd-new-milestone` when ready.

---

## v1.2 Performance (Shipped: 2026-08-21)

**Delivered:** Performance at scale with zero behavior change — Convention Reference memoized and capped (1100→100, persona-narrowed), glob module maps once-indexed via Map (no linear scan), stable segment keys preserving focus.

**Phases completed:** 7 (3 plans total)

**Key accomplishments:**

- Indexed glob modules once via Map keyed by normalized name — `segmentModuleMap` (38) + `generatorModuleMap` (3) at module scope, `getSegmentFile`/`getGeneratorFile` become single `Map.get` (marker-based subpath extraction preserves `core/region`), no `Object.entries(...).find` in render paths (PERF-02, fae0517)
- Memoized `referenceEntries` via `useMemo([builderSegments, activeFields, i18n.language])` with `slice(0,100)` cap for generator fields — persona-narrowed via `personaRangeKeyForField` → `caPolicyIdOptionsForRange` single 100-entry range, capped note in `ReferenceCard`, `grep generateCaPolicyIds` absent from reference path (PERF-01, a0a59bb)
- Stabilized segment keys removing `Date.now()` churn — `buildSegments` `${name}-${index}` and `addCustomSegment` `${name}-custom-${prev.length}`, `BuilderCard key={s.key}` preserves DOM, `grep Date.now ==0`, editing preserves focus without remount (PERF-03, 4d8abeb)
- Verified 9-threat security audit (0 open) and 6/6 UAT pass (Map lookup, persona-narrowed 100, capped fallback 100, focus preservation, reorder/custom, zero behavior change) — 137 tests + build/lint green unchanged

**Stats:**

- 4 files modified (git diff v1.1..v1.2)
- 3,216 lines TypeScript/TSX (`src/`)
- 1 phase, 3 plans, 7 tasks
- Same-day ship (2026-08-21, 3 perf commits + 6 UAT)

**Git range:** `perf(07-01)` → `perf(07-03)` (tag `v1.1` at `4bf5445` → `4d8abeb` `perf(07-03) stabilize segment keys`)

**What's next:** Data integrity hardening (DATA-01/02 JSON schema + segment-level validation wiring) + LOCL-01 extra languages; virtualization/bundle budget deferred as scale allows.

---

## v1.1 Quality & Refactor (Shipped: 2026-08-21)

**Delivered:** Monolith extracted into 7 lib modules + 16 components (identical behavior), 5 correctness bugs fixed, Vitest 137 tests locking the refactor, CI lint+test gates on Node 22, dead code pruned — zero behavior change, leaner repo.

**Phases completed:** 2-6 (14 plans total)

**Key accomplishments:**

- Extracted pure logic into `src/lib/` (7 modules) and UI into `src/components/` (16 files + `useAppState`), `App.tsx` 1632→121 lines, 9-workflow smoke test identical to v1.0 (REFACT-01/02)
- Added React ErrorBoundary in `main.tsx` with bilingual fallback + Reload (REFACT-03) and CI lint gate `needs[build,lint]` (QA-01) → extended to `needs[build,lint,test]` on Node 22
- Fixed 5 correctness bugs: EM/DEVSEC IDs via fallback range, corrupt localStorage guarded (`every(string)` + `try`), clipboard `textarea+execCommand` with `finally`, toast ref-timer, Defender rose `#e11d48` (BUGFIX-01..05)
- Configured Vitest `jsdom`/`globals`/`v8 80%` in `vite.config.ts` + `src/test/setup.ts`, fixed WR-03/04/06 as task 0, wired parallel test job; 137 tests (85.46% lines) covering 6 core funcs + JSON integrity + persona coupling (QA-02)
- Removed dead `@fluentui/react-icons` (73 lock deletions), 3 Vite assets via `git rm`, 24 rule JSONs + `validation-rules.json` segments block + 4 “Conditional Access Policy” branches (CLEAN-01..03)
- Milestone kept lean with zero user-visible change; planning local-only (`commit_docs:false`), YOLO coarse, atomic commits on `main`

**Stats:**

- 47 files modified (git diff --stat v1.0..v1.1)
- 3,209 lines TypeScript/TSX (`src/`)
- 5 phases, 14 plans, 33 tasks
- 2 days from v1.0 (2026-08-19) to v1.1 (2026-08-21) — v1.1 execution 2026-08-20→2026-08-21

**Git range:** `feat(02-01)` → `feat(06-02)` (tag `v1.0.0` at `19318a7` → `b768043` `feat(06-02) remove Conditional Access Policy branches`)

**What's next:** v1.2 hardening — performance (reference memoization, glob Map, stable keys PERF-01..03) + data integrity (JSON schema, segment-level validation DATA-01/02) + LOCL-01 extra languages; or project stable as shipped.

---

## v1.0 Baseline Release v1.0 (Shipped: 2026-08-19)

**Delivered:** Repository into clean, tagged `v1.0.0` release state — pending i18n committed, version surfaced in footer, annotated tag at baseline, production build passes.

**Phases completed:** 1 (3 plans total)

**Key accomplishments:**

- Committed pending `fr.json` Purpose label fix (`69adebf`)
- Bumped version to `1.0.0` via `npm version` + surfaced in footer via `import pkg from "../package.json"` (`19318a7`)
- Created annotated tag `v1.0.0` at `19318a7` (tagger jmaillot)
- Verified `npm run build` passes on committed state

**Stats:**

- 3 plans, 5 tasks
- 1 phase
- 1 day

**Git range:** `69adebf` → `19318a7` (tag `v1.0.0`)

**What's next:** v1.1 Quality & Refactor (extract monolith, safety net, bug fixes, tests, cleanup)
