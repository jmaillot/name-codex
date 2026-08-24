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

## Cross-Milestone Trends

### Process Evolution

| Milestone | Sessions | Phases | Key Change |
|-----------|----------|--------|------------|
| v1.0 | 1 | 1 | Baseline formalization: GSD init → roadmap → plan → execute → secure → archive in one pass |
| v1.1 | ~6 | 5 | Quality & Refactor decomposition + safety net: ErrorBoundary, 7 lib +16 components, Vitest 137 tests, CI triple gate, cleanup lean — zero behavior change |
| v1.2 | ~2 | 1 | Performance at scale: Map-indexed lookups, memoized/capped/persona-narrowed reference, stable keys — zero behavior change, fastest ship |
| v1.3 | ~3 | 3 | UI reskin via approved UI-SPEC contract + mechanical check:tokens gate; honest drift recording (D-12) + gap-closure flow closed workflow-8 regression same-phase |

### Cumulative Quality

| Milestone | Tests | Coverage | Zero-Dep Additions |
|-----------|-------|----------|-------------------|
| v1.0 | 0 | — | 0 |
| v1.1 | 137 | 85.46% lines (v8, src/lib) | 0 (net -1 dep, -3 assets, -5 config fields, -4 branches) |
| v1.2 | 137 | 85.46% lines (unchanged) | 0 (4 files touched, no new deps, no new runtime code paths beyond Map/useMemo) |
| v1.3 | 137 | 85.46% lines (unchanged) | 0 (CSS-only + one hook fix; zero deps added; tokens.css is plain CSS) |

### Top Lessons (Verified Across Milestones)

1. *(pending — verified after multiple milestones)*
2. *(pending — verified after multiple milestones)*