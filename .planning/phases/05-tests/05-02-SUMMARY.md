---
phase: 05-tests
plan: "02"
subsystem: testing
tags: [vitest, jsdom, v8, coverage, parse, validation, generators, segments, storage, data-integrity]
requires:
  - phase: 05-tests
    provides: Vitest configured with jsdom/globals/v8 80% coverage and hardened storage loaders (05-01)
provides:
  - Six co-located Vitest suites locking parsePattern, normalizeName, validateName, governanceScore, generateCaPolicyIds, valuesForField plus JSON reference-integrity
  - Synthetic NamingConvention fixtures for isolated validation/segments edge cases
  - Persona-range coupling locked (ca-policy-id personaRanges vs caNumberingRanges) and EM000 vs EM001 fallback documented
affects: [06-cleanup, Phase 3 refactor safety net, CI coverage gate]
tech-stack:
  added: []
  patterns: ["co-located src/lib/*.test.ts with globals describe/it/expect per D-03/D-09", "synthetic fixtures in src/test/fixtures for isolated edge cases", "real JSON via import.meta.glob for integrity suite", "beforeEach localStorage clear + vi.clearAllMocks isolation"]
key-files:
  created: [src/lib/validation.test.ts, src/lib/storage.test.ts, src/lib/generators.test.ts, src/lib/segments.test.ts, src/lib/data-integrity.test.ts, src/test/fixtures/synthetic-conventions.ts]
  modified: [src/lib/parse.test.ts, tsconfig.app.json]
key-decisions:
  - "Keep parse.test.ts as pre-existing 19 cases and extend only validation/storage/generators/segments/integrity to reach 137 tests"
  - "Exclude src/**/*.test.ts and src/test/** from tsconfig.app.json so tsc -b stays green with vitest globals (build independent per D-15)"
  - "Fix data-integrity pattern-token aggregation to include all pattern-specific fields (entra-app-registration enterprise Company/Department) rather than failing on text fields"
patterns-established:
  - "Co-located unit tests import from relative './validation' etc. with no per-file describe import (globals)"
  - "Synthetic makeConvention(overrides) for deterministic validation/governance edge suites without real JSON dependency"
  - "Integrity suite uses real allConventions + getSegmentFile/getGeneratorFile + caNumberingRanges to catch silent empty-dropdown typos"
requirements-completed: [QA-02]
duration: 12min
completed: 2026-08-21
---

# Phase 05 Plan 02: Unit Tests + Integrity Suite Summary

**Six Vitest suites (137 tests) locking parse, validation, generators, segments, storage plus JSON reference-integrity — persona-range coupling and EM000 fallback documented, coverage 85% lines on src/lib.**

## Performance

- **Duration:** 12 min
- **Started:** 2026-08-21T10:17:00Z
- **Completed:** 2026-08-21T10:29:00Z
- **Tasks:** 3
- **Files modified:** 8

## Accomplishments

- Extended pre-existing parse.test.ts (19 tests) with validation.test.ts (30+ cases: normalizeName chained truncate/lowercase/remove, validateName empty/locked/recommended/allowedPattern, governanceScore 0/50/67/100, isLocked helpers), storage.test.ts (15 cases: [123] → null, Storage.prototype.getItem throw → null, isolation), generators.test.ts (20 cases: EM000..EM999 fallback documents IN-01 off-by-one, DEVSEC, personaRangeKeyForField case-insensitive), segments.test.ts (20 cases: valuesForField library/generator/allowedValues, allowedValuesByField first-match fragility, persona-range scoping), and data-integrity.test.ts (11 cases: every library/generator resolves, pattern tokens map, personaRanges ⊂ caNumberingRanges)
- Locked persona-range coupling (ca-policy-id.json personaRanges keys vs ca-numbering-ranges.json) so typo fails test instead of silent 1100-ID fallback expansion; locked EM000 as first fallback ID not EM001
- Full suite green: npm test 6 files 137 tests pass, npm run test:coverage 85.46% lines, npm run build and lint still green

## task Commits

Each task was committed atomically:

1. **task 1: Write tests for parse, validation, and storage (with edge suites)** - `087b86e` (feat)
2. **task 2: Write tests for generators, segments, and JSON reference-integrity** - `126b9e0` (feat)
3. **task 3: Verify full suite passes with coverage gate and tidy up** - `bf19989` (chore: tsconfig exclude for build)

**Plan metadata:** N/A (no final docs commit — STATE.md/ROADMAP.md owned by orchestrator per instructions)

## Files Created/Modified

- `src/lib/parse.test.ts` - Pre-existing 19 cases for parsePattern/patternToSegments (verified, committed)
- `src/lib/validation.test.ts` - normalizeName, validateName, governanceScore, isLocked/isRecommended/isFixed helpers with synthetic conventions
- `src/lib/storage.test.ts` - loadJSONArray/loadJSONRecord/loadJSON corrupt + throw-safety with jsdom isolation
- `src/lib/generators.test.ts` - generateSequence, generateCaPolicyIds EM/DEVSEC fallback, caPolicyIdFallbackRange, caPolicyIdOptionsForRange, personaRangeKeyForField
- `src/lib/segments.test.ts` - valuesForField, optionsForSegment allowedValuesByField first-match, persona-range scoping, defaultValueForField, fieldByName
- `src/lib/data-integrity.test.ts` - allConventions library/generator resolution, pattern token mapping, personaRanges coupling, shape validation
- `src/test/fixtures/synthetic-conventions.ts` - makeConvention(overrides) + makeCaPersonaFixture helpers
- `tsconfig.app.json` - Exclude co-located tests and fixtures from tsc -b so build stays independent

## Decisions Made

- Retain existing parse.test.ts 19 cases (already met 05-02 min 40 lines /10 cases) and focus new work on remaining five suites to avoid churn.
- Add `exclude: ["src/**/*.test.ts", "src/test/**"]` to tsconfig.app.json rather than adding `vitest/globals` types, keeping test globals isolated to vitest and build independent per D-15.
- Aggregate all pattern fields (`conv.fields` + all `conv.patterns[].fields`) for pattern-token integrity check; entra-app-registration enterprise pattern defines Company/Department in pattern-specific fields, not top-level, so earlier aggregation missed them.
- Keep coverage threshold at lines:80 (overall 85.46) without per-file thresholds; segments.ts at 65% (uncovered fieldLabel/buildSegments) does not block gate — future Phase 6 cleanup can raise per-file if desired.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed data-integrity pattern token aggregation missing pattern-specific fields**
- **Found during:** task 2 (generators, segments, data-integrity)
- **Issue:** `every pattern token maps to a known segment` failed for `entra-app-registration` token `Company` — aggregation used only `conv.fields` + catalog, but enterprise pattern defines `Company` in `patterns[].fields`, so test incorrectly flagged valid text fields as unknown
- **Fix:** Aggregate `allPatternFields = [...conv.fields, ...conv.patterns.flatMap(p=>p.fields)]` and use for fieldByName check and allNames assertion
- **Files modified:** src/lib/data-integrity.test.ts
- **Verification:** `npm test -- data-integrity` passes (11 tests); full suite 137 pass
- **Committed in:** 126b9e0 (part of task 2 commit)

**2. [Rule 3 - Blocking] Excluded test files from tsc -b to keep npm run build green**
- **Found during:** task 3 (verify full suite)
- **Issue:** `npm run build` (`tsc -b && vite build`) includes `src` and now contains 6 `*.test.ts` files using vitest globals `describe/it/expect/vi` without types — tsc failed with `Cannot find name 'describe'` and `Property 'value' does not exist on type 'NamingFieldOption'`
- **Fix:** Added `exclude: ["src/**/*.test.ts", "src/test/**"]` to tsconfig.app.json so tsc -b only checks app source; vite build already inert to test block
- **Files modified:** tsconfig.app.json
- **Verification:** `npm run build` exits 0, `npm test` still 137 pass, `npm run test:coverage` still 85% lines
- **Committed in:** bf19989

---

**Total deviations:** 2 auto-fixed (1 bug, 1 blocking)
**Impact on plan:** Both fixes required for correctness/build-green. No scope creep; plan intent fully preserved. Coverage gate not lowered, vite threshold untouched.

## Issues Encountered

- Coverage report lists only 4 of 7 src/lib files (generators, segments, storage, validation) — parse.ts and data.ts not shown but counted in All files 85.46% >80 threshold; likely v8 include still passes because overall >80. No action needed for 05-02 but Phase 6 could add per-file thresholds if desired.
- Oxlint warnings for `i18n.language` exhaustive-deps and triple-slash reference remain (pre-existing, not introduced by tests); lint still exits 0.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- QA-02 fully locked: 6 required functions + integrity + storage/ governance edge suites all green; Phase 3 refactor identical-behavior guarantee now enforced.
- JSON typo will fail data-integrity suite instead of shipping empty dropdown; persona-range coupling locked.
- Ready for 06-cleanup (App.tsx decomposition, memoization) with safety net; CI `npm test` already gates deploy per 05-01.

---
*Phase: 05-tests*
*Completed: 2026-08-21*

## Self-Check: PASSED

- FOUND: src/lib/parse.test.ts
- FOUND: src/lib/validation.test.ts
- FOUND: src/lib/storage.test.ts
- FOUND: src/lib/generators.test.ts
- FOUND: src/lib/segments.test.ts
- FOUND: src/lib/data-integrity.test.ts
- FOUND: src/test/fixtures/synthetic-conventions.ts
- FOUND: 087b86e
- FOUND: 126b9e0
- FOUND: bf19989
