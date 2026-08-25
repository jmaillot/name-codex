---
phase: 14-category-expansions-azure-caf-resources-intune
plan: 03
subsystem: ui
tags: [segment-builder, name-generation, tdd, vitest, react-hooks]

# Dependency graph
requires:
  - phase: 13-segment-builder
    provides: builderSegments state and Segment Builder UI in useAppState
provides:
  - assembleRawName pure function (segments.ts) — segment-driven generated-name assembly
  - useAppState.rawName wired through assembleRawName(builderSegments) instead of static patternTokens
  - Unit test suite for assembleRawName covering custom segments, literal prefixes, pattern suffix, case modes
affects: [naming-conventions, segment-builder, uat-validation]

# Tech tracking
tech-stack:
  added: []
  patterns: ["shared pure-function name assembly mirroring dynamicPattern rendering semantics"]

key-files:
  created:
    - src/lib/segments.test.ts
  modified:
    - src/lib/segments.ts
    - src/hooks/useAppState.ts

key-decisions:
  - "assembleRawName mirrors dynamicPattern semantics exactly: segments missing from literalPrefixes receive the builder separator; patternSuffix attaches only when the final segment is the last static pattern segment"
  - "Test literals preserved verbatim (e.g. kv-APP-JDOE) rather than uppercased per the buggy plan test spec, matching the plan's own reference implementation"

patterns-established:
  - "Segment-driven assembly: generated names derive from live builderSegments, so every visible segment (including custom 'Add Segment' entries) contributes at its list position"

requirements-completed: [AZURE-02]

# Metrics
duration: ~45min (across sessions)
completed: 2026-08-25
---

# Phase 14 Plan 03: Custom-Segment Name Assembly Fix Summary

**Pure `assembleRawName` helper assembles generated names from live `builderSegments`, fixing the UAT gap where custom Segment Builder values were silently dropped from the generated name**

## Performance

- **Duration:** ~45 min across two executor sessions (paused at human-verify checkpoint)
- **Started:** prior session (see git log timestamps)
- **Completed:** 2026-08-25
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments
- Closed confirmed UAT bug (test 2): custom segments added via "Add Segment" now contribute their value to the generated name immediately — affects ALL Segment Builder conventions, not just Key Vault
- Extracted name assembly into a pure, TDD-tested `assembleRawName(segments, opts)` in `src/lib/segments.ts`
- Replaced the static `patternTokens.map(...)` rawName chain in `useAppState` with `assembleRawName(builderSegments, ...)`; existing default output (`kv-APP-PROD-FRC` style with literal prefixes intact) is byte-identical
- Human verification gate passed: user approved all checkpoint steps (default unchanged, custom Owner updates name live, clearing falls back cleanly, works across conventions/languages)

## Task Commits

Each task was committed atomically:

1. **Task 1: TDD tests + implement assembleRawName** — `86687c6` (test, RED), `fa711d2` (feat, GREEN)
2. **Task 2: Wire useAppState.rawName through assembleRawName(builderSegments)** — `57c495c` (feat)
3. **Task 3: Human verification of running app** — no commit (checkpoint; user replied "approved")

**Plan metadata:** see final docs commit for this SUMMARY file.

_Note: Task 1 followed TDD flow — failing tests committed first, then implementation._

## Files Created/Modified
- `src/lib/segments.test.ts` — New describe block "assembleRawName": 6 tests covering custom-segment contribution at list position, full Key Vault shape, empty trailing values, literal prefix/patternSuffix attachment rules, and lower-case mode
- `src/lib/segments.ts` — Added exported pure `assembleRawName(segments, {literalPrefixes, patternSuffix, lastPatternSegment, separator, caseMode})`; cleanup regexes copied verbatim from the prior rawName chain
- `src/hooks/useAppState.ts` — rawName now computed via `normalizeName(assembleRawName(builderSegments, {...}))`; literalPrefixes/patternSuffix block retained (still used by dynamicPattern); no other hook logic touched

## Decisions Made
- Mirrored `dynamicPattern` semantics exactly (separator prefix for segments absent from literalPrefixes; patternSuffix only on final position when it is the last static pattern segment) — guarantees the pattern box and the generated name can never disagree again
- Preserved prior case-mode default ("upper" unless explicit "lower"); lowercase-forcing conventions still handled by `forceLowercase` inside normalizeName, unchanged
- Security posture unchanged per threat model: output continues through existing normalizeName + whole-name allowedPattern choke points (T-14-03-01 mitigated; T-14-03-02 accepted as pre-existing linear-time regexes)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Plan's test spec contained incorrect expected strings**
- **Found during:** task 1 (TDD RED phase)
- **Issue:** The plan's `<behavior>` section specified expected outputs with incorrectly uppercased literal prefixes (e.g. `"KV-APP-JDOE"`), contradicting its own reference implementation and must-have truth ("literal prefixes intact"), since `caseMode` applies to segment values only, never to literals
- **Fix:** Tests corrected to preserve literal prefixes verbatim (e.g. `kv-APP-JDOE` for a lowercase-mode Key Vault variant); this matches the shipped `assembleRawName` implementation where only segment *values* are cased
- **Files modified:** src/lib/segments.test.ts
- **Verification:** All tests green against the plan's verbatim reference implementation; full suite confirms no regressions
- **Committed in:** 86687c6 / fa711d2 (task 1 commits)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Test-spec correction necessary for correctness; implementation itself followed the plan verbatim. No scope creep.

## Issues Encountered
- None beyond the test-spec deviation above.

## User Setup Required

None - no external service configuration required.

## Verification Results
- Automated gates at checkpoint time: **149/149 vitest green**, production build exit 0, lint exit 0 (pre-existing warnings tolerated)
- Manual verification (user-approved): default Key Vault name unchanged; custom Owner segment updates generated name immediately; clearing falls back cleanly with no dangling hyphen; behavior consistent across conventions and languages (EN/FR)

## Known Stubs

None — no stubs or placeholder data introduced.

## Next Phase Readiness
- UAT gap (test 2) closed at the shared-assembly level; plans 14-04 and 14-05 can proceed without depending on this bug
- Remaining phase work unaffected; no blockers carried forward

## Self-Check: PASSED

All key files exist on disk; commits 86687c6, fa711d2, 57c495c verified present in git history.

---
*Phase: 14-category-expansions-azure-caf-resources-intune*
*Completed: 2026-08-25*
