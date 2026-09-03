# Project Retrospective

*A living document updated after each milestone. Lessons feed forward into future planning.*

## Milestone: v1.0 — Baseline Release v1.0

**Shipped:** 2026-08-19
**Phases:** 1 | **Plans:** 3 | **Sessions:** 1

### What Was Built
- Committed the pending i18n fix (French Purpose label "Objet"), leaving a clean working tree
- Bumped version to `1.0.0` (package.json + lockfile atomically) and surfaced it in the app footer via `v{pkg.version}` single source of truth
- Annotated git tag `v1.0.0` at the build-verified baseline commit `19318a7`; production build passes on committed state

### What Worked
- Wave-based sequential execution fit the strict dependency chain (commit → version → tag) cleanly
- `npm version --no-git-tag-version` kept package.json + lockfile in sync atomically
- Explicit-path staging (`git add src/locales/fr.json`) with `git diff --cached --stat` verification prevented scope creep
- Release-gate sequencing (clean tree + passing build strictly before tag) made a bad tag structurally impossible
- YOLO auto-approval kept the small phase moving without confirmation friction

### What Was Inefficient
- `npm ci` was SIGTERM'd twice by tool timeouts on the slow registry + `/mnt/c` WSL mount (~6 min install); needed a detached `nohup` re-run
- gsd-code-reviewer returned without producing `01-REVIEW.md` — review gate was advisory but incomplete

### Patterns Established
- Version display wired to package.json via JSON import (no hardcoded version string in JSX)
- Locale corrections committed with `fix(i18n):` scope, staged by explicit path only
- Release markers use annotated tags (tagger, date, message recorded in the tag object)

### Key Lessons
1. On Linux with Windows-created node_modules, always plan `npm ci` as an explicit first step with retry headroom — budget for slow registry + cross-mount I/O.
2. When a plan's first task commits an already-uncommitted change, run that plan on the main working tree (not a worktree) or the change is invisible to the executor.
3. For a baseline-only milestone, keep plans coarse — three single-purpose plans (commit / version / tag) executed in ~38 min with zero deviations.

### Cost Observations
- Model mix: ~100% sonnet (executor + verifier profile)
- Sessions: 1
- Notable: Small, well-scoped plans completed with zero rework; the only overhead was environment (npm ci) not reasoning

---

## Milestone: v1.1 — Quality & Refactor

**Shipped:** 2026-08-21
**Phases:** 5 | **Plans:** 14 | **Sessions:** ~6 (discuss+plan+execute per phase)

### What Was Built
- Full repo backup `../backups/name-codex-backup-2026-08-20T101239Z.tar.gz` (925K) with `v1.0.0` rollback verified; ErrorBoundary `src/components/ErrorBoundary.tsx` bilingual fallback + Reload in `main.tsx`; CI lint gate `needs[build,lint]` → `needs[build,lint,test]` on Node 22 (Phase 2, QA-01/REFACT-03)
- Monolith `src/App.tsx` 1632→121 lines decomposed into `src/lib/` 7 modules + `src/components/` 16 files + `useAppState` hook; 9-workflow smoke test 9/9 identical to v1.0 (Phase 3, REFACT-01/02)
- 5 correctness bugs fixed: EM/DEVSEC IDs via `caPolicyIdFallbackRange` (EM000..999), corrupt localStorage `loadJSONArray/loadJSONRecord` `every(string)`+`try`, clipboard `textarea+execCommand` `finally`+`setSelectionRange`, toast `useRef` timer, Defender rose `#e11d48` (Phase 4, BUGFIX-01..05)
- Vitest `jsdom`/`globals`/`v8` 80% for `src/lib/` in `vite.config.ts` + `src/test/setup.ts`, 3 scripts `test/test:watch/test:coverage`, WR-03/04/06 fixed as task 0, parallel test job Node 22; 6 files 137 tests 85.46% lines locking 6 core funcs + JSON integrity + persona coupling (Phase 5, QA-02)
- Dead code pruned: `@fluentui/react-icons` `npm uninstall` 73 lock deletions, 3 Vite assets `git rm`, 24 rule JSONs + `validation-rules.json` segments block + 4 “Conditional Access Policy” branches in `Rule.ts`/`NavPanel`/`BuilderCard`/`useAppState` removed; triple gate `build 1926 modules`/`lint`/`test` green zero behavior change (Phase 6, CLEAN-01..03)

### What Worked
- Wave-based execution with 1-wave 2-plan parallel groups (Phase 6) and 2-wave sequential (Phase 5) fit dependencies — `files_modified` overlap check prevented parallel conflicts
- `npm uninstall` atomic + `git rm` staged deletions with `grep` proofs made cleanup verifiable and reversible per CLEAN group (2 commits)
- Refactor order (Phase 3→4→6) kept fixes targeting extracted modules, cleanup last avoiding in-flight touch — zero rework
- Vitest co-located `src/lib/*.test.ts` + real+synthetic fixtures + `vi.stubGlobal` isolation caught persona-range coupling (1100-ID fallback) and storage `every(string)` guards
- Backup sibling tar including `.planning` gave definitive rollback companion to `v1.0.0` tag; tag stayed local per user decision, no push friction

### What Was Inefficient
- `node_modules` held only `win32` bindings initially — Linux `npm ci` required before `build/lint/test`; Phase 5 `Node 20→22` bump added extra `npm ci` cycle
- `grep -r ... | head` masked exit code (pipe exits 0) — needed direct `grep; echo $?` to prove zero hits
- `tsc -b` buildinfo caching hid intermediate TS errors (`policyExamples` removal left reader until task 2) — `npm run build` (`tsc -b && vite build`) was the true gate
- `grep -r "Conditional Access Policy" src/` still matched data strings in locales/rules (5 hits) — scoped verification to `src/components/ src/hooks/` needed to prove 4 dead branches removed
- Code-reviewer returned empty for 01/03 (tooling issue) — security auditor filled gap for Phases 2/4 with 11/11 threats closed

### Patterns Established
- ErrorBoundary as class component in `src/components/` imported in `main.tsx` — first defensive UI, bilingual static fallback + `console.error` only
- `src/lib/` choke point pattern: `loadJSONArray/loadJSONRecord` `every(string)` + `getItem` `try` protects all consumers
- Vitest in `vite.config.ts` `test:{environment:'jsdom',globals:true,setupFiles,coverage:{provider:'v8',include:['src/lib/**'],thresholds:{lines:80}}}` — single config, `src/test/setup.ts` jest-dom, 3 scripts
- CI triple gate: parallel `build`/`lint`/`test` jobs `needs[build,lint,test]` deploy on Node 22 `actions/setup-node@v4` cache npm
- Cleanup: `npm uninstall` atomic + `git rm` staged + `grep` proofs each dead token + `build+lint+test` triple gate + 2 commits by CLEAN group

### Key Lessons
1. Fix deferred review WARNs as task 0 before locking tests — tests then assert hardened contract, not buggy cast behavior (WR-03/04/06 → 05-01).
2. Scope cleanup verifications to code-only (`src/components`/`src/hooks`/`src/types`/`src/lib`) — data strings in `locales`/`rules` are intentional and mask grep-zero proofs.
3. On WSL/Linux with Windows-created node_modules, budget explicit `npm ci` before any `build/lint/test` and pin Node 22 in CI for `jsdom`/`v8` bindings.
4. Use `grep` without `| head` for grep-zero proofs; pipe masks failure exit code.
5. Keep `ROADMAP.md` collapsed per milestone after archiving — preserves constant-size planning and one-line traceability to `.planning/milestones/`.

### Cost Observations
- Model mix: ~100% sonnet (executor smart profile, planner opus per config)
- Sessions: ~6 discuss/plan/execute cycles (Phases 2-6)
- Notable: 5 phases shipped in 2 days (14 plans, 33 tasks, 47 files, 3,209 LOC); cleanup and test gates kept rework at 3 auto-fixed deviations total — all necessary for build-green

---

## Milestone: v1.2 — Performance

**Shipped:** 2026-08-21
**Phases:** 1 | **Plans:** 3 | **Sessions:** ~2 (plan+execute+secure+UAT)

### What Was Built
- Once-indexed module Maps in `src/lib/data.ts` — `segmentModuleMap` (38) + `generatorModuleMap` (3) keyed by normalized subpath; `getSegmentFile`/`getGeneratorFile` are single `Map.get`, no linear scan in render paths (PERF-02, fae0517)
- Memoized + capped + persona-narrowed Convention Reference — `useMemo([builderSegments, activeFields, i18n.language])`, `slice(0,100)` cap for generator fields, persona path via `personaRangeKeyForField` → `caPolicyIdOptionsForRange`; truncation note in `ReferenceCard` (PERF-01, a0a59bb)
- Stable segment keys — `${name}-${index}` and `${name}-custom-${prev.length}` replace `Date.now()` churn; editing preserves focus, no editor remount (PERF-03, 4d8abeb)
- Verification: 137 tests + build/lint green unchanged, 9-workflow smoke identical to v1.1, security audit 9 threats 0 open, UAT 6/6 pass

### What Worked
- 137-test lock from v1.1 made perf changes safe — every plan verified zero behavior change via the same triple gate
- Grep-zero proofs (`Object.entries.*\.find ==0`, `Date.now ==0`) gave cheap objective criterion checks without a benchmark suite
- Coarse granularity (3 plans for 3 requirements) fit the small scope — all plans executed in ~6 min total
- UAT script written from success criteria caught nothing broken — criteria were precise enough to test directly

### What Was Inefficient
- Initial Map key extraction used basename `pop()`, breaking nested modules like `core/region` — 3 tests failed and required an auto-fix to marker-based extraction; a pre-plan grep of nested paths would have caught it
- ROADMAP progress table was stale (0/3 Not started despite summaries on disk) at milestone close — needed manual sync before archiving

### Patterns Established
- Module-scope Map indexing: eager glob → Map built once at import, O(1) lookups in render paths
- Reference capping: memoize derived lists in the hook (not components), cap generator fields only, persona-narrowing as primary path with cap as safety net
- Stable React keys: never timestamp/random in keys; deterministic `name-index` scheme survives reorder and HMR

### Key Lessons
1. When indexing glob maps by name, extract keys preserving subpaths (marker-based), not basename — nested module resolution depends on it.
2. Prior-milestone test locks pay off immediately: perf work with zero-behavior guarantees is fast when the suite is already green.
3. Sync ROADMAP progress (`roadmap update-plan-progress`) before closing a milestone so readiness analysis reflects disk truth.

### Cost Observations
- Model mix: ~100% sonnet (executor profile)
- Sessions: ~2
- Notable: Fastest milestone yet — 3 plans, 7 tasks, 4 files, same-day ship with only 1 auto-fixed deviation

---

## Milestone: v1.3 — Developer Portal UI

**Shipped:** 2026-08-24
**Phases:** 3 (8–10) | **Plans:** 10 (incl. 2 gap-closure)

### What Was Built
- Semantic design-token layer (`tokens.css`, 36 declarations from checker-approved UI-SPEC) with full surface repaint and a mechanical `check:tokens` gate (0 literals, 9/9 WCAG pairs); light mode is now a pure token swap
- CommandBar layout restructure: global search, EN/FR language pill, ConfigureCard 2-col reflow, single-row chrome at 1100px; EN/FR parity 372=372 keys
- Developer-portal polish: `var(--font-mono)` on core-3 code-like targets (5 Consolas literals torn out), uniform density cut sheet landed exactly
- Behavior-neutrality proven end-to-end: workflow-8 drift caught → empirically root-caused → fixed (filtered-first selection resolution at useAppState.ts:102–106) → full 18/18 smoke matrix user-approved

### What Worked
- Verbatim token values from the checker-approved UI-SPEC eliminated invented-value churn; the check:tokens gate turned conformance into a mechanical proof
- Honest checkpoint recording per D-12 (10-02 recorded FAIL instead of deferring): drift surfaced immediately while context was fresh, and gap-closure plans (10-03/10-04) closed it within the same phase
- Empirical spec-repro diagnosis before fixing (temporary vitest spec replicating hook semantics against real data, run once then deleted) proved root cause without polluting the 137-test lock
- Wave-based execution kept orchestrator lean; executor agents committed atomically with verifiable grep gates

### What Was Inefficient
- Subagent spawns hit repeated transient `network_error` failures (~6 retries across the session); fallback rule (spot-check + inline completion) saved each case but cost time
- Duplicate threat-ID prefixes (`T-10b-*` in both 10-02 and 10-03 plans) required disambiguation in SECURITY.md
- ROADMAP requirement checkboxes went stale between phases (only THEME-01 checked at close) — corrected during archival
- key-link verifier reported false "Source file not found" for existing files — manual path verification needed

### Patterns Established
- D-14-style diff-boundary rules per phase, with explicit documented exceptions when scope must cross
- Gap closure as first-class flow: VERIFICATION gaps_found → --gaps planning → waves 3-4 execution → re-verification pass
- Smoke matrices recorded verbatim with explicit user approval; unconfirmed runs never marked pass

### Key Lessons
1. A mechanical conformance gate (check:tokens) beats prose acceptance criteria for visual work
2. Honest failure recording converts a blocked milestone into a same-day fix instead of post-tag regret
3. Diagnose-before-fix (with empirical repro) prevents "fixing" non-regressions — the hook was byte-identical to v1.2

### Cost Observations
- Model mix: sonnet executors/checkers, opus planner, orchestrator inherit
- Sessions: 1 long session for execute→verify→secure phases 10 + milestone close
- Notable: network-error retries were the dominant inefficiency; work itself was clean

## Milestone: v1.4 — Light Mode

**Shipped:** 2026-08-24
**Phases:** 2 (11–12) | **Plans:** 5

### What Was Built
- Complete navy-tinted light palette in `:root[data-theme="light"]` (all 28 UI-SPEC value groups, tokenized brand-title gradient, user-selected #e4e9f2 canvas); zero changes outside tokens.css (Phase 11)
- Theme-scoped `check:tokens` gate: dual-theme parse (never merged), 18/18 WCAG pairs per pretest run with var()-chain resolution and negative-control testing (Phase 11)
- Boot-time theme resolution: inline pre-paint script + `src/lib/theme.ts`, allowlist-validated `name-codex-theme-v14-0` key, no flash of wrong theme; sun/moon CommandBar toggle with bilingual labels parity 374=374 and 175ms color-only fade with reduced-motion guard + unmount cleanup (Phase 12)
- Behavior-neutrality proven: exactly 137 tests (zero added), PERF-01..03 grep re-proofs, dual-theme smoke matrix user-approved 18/18 PASS; code review 0 critical, WR-01 + IN-01..07 resolved via review-fix

### What Worked
- Building on v1.3's reserved token block made light mode genuinely a pure swap — Phase 11 touched nothing but tokens.css (+ one justified App.css fix)
- D-10/D-12 honest-recording smoke matrix again converted visual judgment into a clean evidence artifact without polluting the test suite
- D-11 "no new tests, prove by gates + grep re-proofs" kept the behavior-neutral lock intact and avoided brittle theme unit tests
- Discuss-phase captured 11 decisions (D-01..D-11) up front; planning and execution ran with zero decision ambiguity afterward
- UI-SPEC approved before planning meant both phases had prescriptive contracts; plan checker/research disabled without loss

### What Was Inefficient
- Subagent `network_error` retries persisted (ui-checker failed 3× → orchestrator inline verification fallback used again)
- milestone.complete CLI extracted garbage one-liner accomplishments from SUMMARY frontmatter — manual MILESTONES.md rewrite required
- Review-fix ran twice (critical_warning scope, then --all) because info findings were initially out of scope; a single --all pass would have been cheaper

### Patterns Established
- Theme storage key derives from current app version (`-v14-0`), deliberately outside the legacy `-v11-6` family; inline boot script duplicates the key string with a documented sync note (D-09)
- Transient `html.theme-anim` class pattern for scoped global fades with reduced-motion guard and unmount cleanup
- Explicit-only persistence (absent key = follow OS; clearing storage is the reset — no reset UI)

### Key Lessons
1. Reserve extension points at design time (v1.3's empty light block) — the cheapest feature is the one your past self already scaffolded
2. User-run visual matrices plus mechanical gates are complementary: gates catch regressions, humans catch aesthetics — neither substitutes for the other
3. Scope review-fix once (--all) when findings are cosmetic; two passes cost more than the fixes themselves

### Cost Observations
- Model mix: sonnet executors/fixers, opus discuss/planning, orchestrator inherit
- Sessions: 1 long session (discuss → UI → plan → execute → review → fix → close)
- Notable: fastest full-lifecycle milestone (~3h tag-to-tag) on the most contract-heavy phase pair so far

## Milestone: v1.5 — Naming Convention Expansion

**Shipped:** 2026-08-25
**Phases:** 3 (13–15) | **Plans:** 13

### What Was Built
- Catalog grew 25→45 conventions across 7→11 categories: new Teams, SharePoint, Power Platform, Purview categories + Azure CAF expansion (storage account no-hyphen outlier, key vault, NSG, public IP) + Intune expansion (Autopilot macro budget ≤15 chars, Group Tag, Update Ring, Assignment Group) — all data-driven JSON with EN/FR parity and brand SVG icons (Phases 13–14)
- Builder correctness sweep: generic per-field `allowedPattern` validation (closed UAT-13-07), pure `assembleRawName` from live `builderSegments`, `validateName` synced to `activeFields`, stale-select sentinel, phantom-default input removed (WR-01..WR-06)
- Catalog integrity locked in vitest: 45-count / 11-category / search-reachability ×20 / EN=FR parity assertions; suite 137→183 green
- Verification: 9/9 mechanical gates green with verbatim evidence; zero-code-diff proof vs `v1.4` (36 survivors each justified); dual smoke matrix waived by user approval — honest COMPLETE-WITH-WAIVER verdict

### What Worked
- Data-driven JSON architecture meant 20 new conventions shipped with near-zero code surface — the zero-code-diff contract was checkable by diff, not assertion
- Research-first grounding (`research/SUMMARY.md` from learn.microsoft.com/CAF) eliminated convention-design guesswork; plans were prescriptive
- Wave-based plan dependencies (locale-file overlap) prevented merge conflicts between parallel executors
- Honest-recording culture held under pressure: the waived smoke matrix was recorded as waived (0/24 cells), not fabricated as pass

### What Was Inefficient
- milestone.complete CLI again extracted junk one-liners ("One-liner:", non-accomplishment lines) — manual MILESTONES.md rewrite required (second occurrence)
- Phase 13 UAT gap (UAT-13-07) required a gap-closure plan after execution; a pre-execution validation-pattern review might have caught it
- Code review surfaced a blocker (truncation-before-validate ordering) at milestone end rather than mid-phase — deferred as known debt

### Patterns Established
- Generic per-field `allowedPattern` in validation rules — special-case character constraints live in data, not code branches
- Catalog-integrity vitest proofs as a growth guardrail — every future convention addition is mechanically checked against count/category/search/locale-parity expectations
- Zero-code-diff proof ritual: diff vs previous tag, justify every survivor to its originating commit

### Key Lessons
1. When the architecture is truly data-driven, "add features" milestones become verification-heavy, not build-heavy — budget for integrity proofs, not implementation
2. Waivers are legitimate outcomes only when recorded honestly; an unexecuted matrix marked "waived" is trustworthy, one marked "pass" is not
3. Manual smoke coverage foregone compounds: next milestone should re-budget for it before drift accumulates unseen

### Cost Observations
- Model mix: sonnet executors/reviewers, orchestrator inherit
- Sessions: continuous session flow across 3 phases (2026-08-24 → 08-25)
- Notable: largest catalog delta per plan of any milestone (20 conventions / 13 plans); 60 commits, 68 files (+3,663/−598)

## Milestone: v1.12 — CAF Expansion III

**Shipped:** 2026-09-03
**Phases:** 2 (28–29) | **Plans:** 2 | **Tasks:** 4 | **Sessions:** 3 (plan → execute → review-fix → verify → close)

### What Was Built
- Phase 28: Backup Vault + Databricks + Machine Learning Workspace (bvault/adb/mlw) as `prefix-[Workload]-[Region]-[Environment]` lowercase with 3×8-value workload libraries, 30 EN/FR keys, catalog 65→68 (Azure 33→36), all gates green (153 files PASS, 240 tests)
- Phase 29: Front Door + Private Endpoint + DNS Zone (afd/pe/dnsz) as `prefix-[Workload]-[Region]-[Environment]` (dnsz reworked to `dnsz-[Workload]-[Environment].[Domain]` dotted-domain) with 3×8-value workload libraries, 30 EN/FR keys, catalog 68→71 (Azure 36→39), 159 files PASS, 1048 parity, all review findings fixed — closing v1.12 at 71 conventions
- Zero code diff: all 6 conventions shipped as pure JSON with 6 workload libs, auto-discovered via `import.meta.glob` with no code changes beyond Phase 19 constraint wiring
- Catalog integrity locked: 71-count / Azure-39 / 47-search-reachability / EN=FR parity assertions in vitest; suite 240/240 green across 11 categories
- Review-driven rework: CR-01 (dnsz dot-forbidding validator → dotted-domain with maxLength 63, Region removed, Domain field added), WR-02 (duplicated descriptions), WR-01 (pe vs CAF pep disclosure), IN-01 (vacuous test block) — all fixed in one commit with re-verification to `passed`

### What Worked
- Wave-based single-wave parallel execution fit the independent plans; `files_modified` overlap check passed (no conflicts)
- Verification depth was high: 6/6 must-haves programmatically verified with regex spot-checks, 16 behavioral checks, 4 gates re-run by verifier, EN/FR parity computed (1048=1048), auto-discovery traced end-to-end
- Code review surfaced a real domain-accuracy blocker (CR-01) that the declared must-haves mechanically passed but Microsoft's actual DNS zone rules would reject — review-verifier escalation caught it before milestone shipped
- Human disposition (a) was the thorough fix: dotted-domain model matches Azure's 1-63 char / 2-34 label constraint, not just rewording; verifier explicitly scoped options with tradeoff analysis
- Pre-flight + audit-open caught only the optional UAT spot-check (1 pending, non-blocking) — no other open artifacts; requirements staleness (3× "Planned" traceability rows) was fixed inline before archiving

### What Was Inefficient
- Phase 28-29 executed on milestone branch `gsd/v1.12-caf-expansion-iii` then merged to main — milestone branch workflow added fetch/HEAD pinning logic but paid off with clean `971ad3e` merge
- SDK's `milestone.complete` CLI extracted only 1 of 2 accomplishments (Phase 29's summary one-liner had a parsing gap) — manual MILESTONES.md patch required
- `.planning` is git-ignored with `commit_docs: false` — every docs commit needed `git add -f` and direct `git commit`, not `gsd-sdk query commit` (which returns "commit_docs disabled"); planning history required force-staging
- Roadmap + requirements still carried "Planned" staleness at milestone close — needed manual edit to "Complete"/"Shipped" before archiving; `roadmap.analyze` showed `roadmap_complete: false` even though `disk_status: complete`

### Patterns Established
- Dotted-domain CAF pattern vocabulary: `prefix-[Workload]-[Environment].[Domain]` for global resources where the Azure name IS the DNS domain (zone name = domain, not prefix-segment label) — distinct from `prefix-[Workload]-[Region]-[Environment]` for regional resources
- Global-resource rule pattern: DNS zones have no Region segment (global) — field set is Workload + Environment + Domain, not Workload + Region + Environment; builder `defaultSegments` reflects placement, not always region
- Review-verifier escalation pattern: critical review findings that don't fail declared must-haves (planning/spec defect vs execution failure) escalate as `human_needed` with disposition options (a/b/c) and are not silently passed — preserves product accuracy while keeping mechanical verification honest

### Key Lessons
1. When a CAF abbreviation table says `<DNS domain name>` (no abbreviation), don't invent one and claim "per CAF" — model the actual Azure constraint or explicitly document the house extension.
2. For conventions claiming "naming per CAF", cross-reference Microsoft's naming-rules (character sets, dot requirements, label counts, maxLength) not just abbreviation tables — CAF abbreviation correctness ≠ naming-rule correctness.
3. `commit_docs: false` + `.planning` gitignore means planning docs require `git add -f` everywhere — SDK's `commit` subcommand is a no-op in this repo and force-staging is the canonical path for docs.

### Cost Observations
- Model mix: ~100% sonnet (executor + reviewer + verifier)
- Sessions: 3 (28 execute/verify → 29 execute/verify/review-fix/close → 03 archive/retrospective)
- Notable: 6 conventions / 2 plans / 4 tasks / ~16 commits on milestone branch, 1 auto-fixed deviation (none — manual review fix was the deviation), 2-day milestone (2026-09-02 → 2026-09-03)

---

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 1 | 1 | Baseline formalization: GSD init → roadmap → plan → execute → secure → archive in one pass |
| v1.1 | ~6 | 5 | Quality & Refactor decomposition + safety net: ErrorBoundary, 7 lib +16 components, Vitest 137 tests, CI triple gate, cleanup lean — zero behavior change |
| v1.2 | ~2 | 1 | Performance at scale: Map-indexed lookups, memoized/capped/persona-narrowed reference, stable keys — zero behavior change, fastest ship |
| v1.3 | ~3 | 3 | UI reskin via approved UI-SPEC contract + mechanical check:tokens gate; honest drift recording (D-12) + gap-closure flow closed workflow-8 regression same-phase |
| v1.4 | 1 | 2 | Pure token-swap theming on the reserved v1.3 block: discuss-first decision capture (D-01..D-11), prescriptive UI-SPEC, user-run smoke matrix, zero new tests |
| v1.5 | ~2 | 3 | Data-driven catalog growth 25→45 conventions: research-first JSON authoring, wave-parallel plans, zero-code-diff proof vs tag, catalog-integrity test guardrails |
| v1.6 | 1 | 3 | Data Integrity: check:data gate + generic constraint vocabulary + Region/Country 4→40 expansion (short codes), UAT verified |
| v1.7 | 1 | 2 | Constraint Wiring + CAF Expansion: live SegmentConstraints filtering + 6 CAF conventions (acr/aks/cosmos/sb/func/app), 50 conventions |
| v1.8 | 1 | 3 | Data Tier + Observability + Network Edge: 10 CAF conventions (sql/sqlsrv/apim/adf/log/appi/evh/lb/agw/afw) + dept 5→9, 59 conventions |
| v1.9 | 1 | 1 | Taxonomy/Description Fixes: post-v1.8 fixes for all categories + validation expansion (135 files PASS, 240 tests) |
| v1.10 | 1 | 2 | Governance Insights: actionable hints + Markdown/JSON exports + global search promotion, 59 conventions |
| v1.11 | 1 | 2 | CAF Expansion II: redis/bas/rsv/ngw + synw/cog (6 conventions, 65 total, 147 files PASS) |
| v1.12 | 3 | 2 | CAF Expansion III: bvault/adb/mlw + afd/pe/dnsz (6 conventions, 71 total, 159 files PASS) with dotted-domain rework — largest post-v1.5 catalog milestone, review-verifier escalation proven |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 0 | — | 0 |
| v1.1 | 137 | 85.46% lines (v8, src/lib) | 0 (net -1 dep, -3 assets, -5 config fields, -4 branches) |
| v1.2 | 137 | 85.46% lines (unchanged) | 0 (4 files touched, no new deps, no new runtime code paths beyond Map/useMemo) |
| v1.3 | 137 | 85.46% lines (unchanged) | 0 (CSS-only + one hook fix; zero deps added; tokens.css is plain CSS) |
| v1.4 | 137 | 85.46% lines (unchanged) | 0 (CSS tokens + one component; lucide-react already present) |
| v1.5 | 183 | coverage threshold unchanged (80% src/lib); +46 catalog-integrity/integrity-proof tests | 0 (20 new conventions as JSON only; src diffs justified to originating commits) |
| v1.6 | 226 | threshold unchanged | 0 (check:data gate + constraint vocabulary + Region/Country catalog growth) |
| v1.7 | 232 | threshold unchanged | 0 (constraint wiring + 6 CAF conventions, 50 conventions, 111 files PASS) |
| v1.8 | 238 | threshold unchanged | 0 (10 CAF conventions + dept taxonomy, 59 conventions, 128 files PASS) |
| v1.9 | 240 | threshold unchanged | 0 (taxonomy/description/validation fixes, 59 conventions, 135 files PASS) |
| v1.10 | 240 | threshold unchanged | 0 (governance insights + search, 59 conventions, 135 files PASS) |
| v1.11 | 240 | threshold unchanged | 0 (6 CAF conventions, 65 conventions, 147 files PASS) |
| v1.12 | 240 | threshold unchanged | 0 (6 CAF conventions incl. dotted-domain DNS, 71 conventions, 159 files PASS, 1048 parity) |

### Top Lessons (Verified Across Milestones)

1. *(pending — verified after multiple milestones)*
2. *(pending — verified after multiple milestones)*