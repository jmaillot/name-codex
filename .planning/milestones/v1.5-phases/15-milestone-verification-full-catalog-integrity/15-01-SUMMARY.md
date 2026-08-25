---
phase: 15-milestone-verification-full-catalog-integrity
plan: 01
subsystem: testing
tags: [vitest, json-data, i18n, azure-caf, intune-autopilot, catalog-integrity]

# Dependency graph
requires:
  - phase: 14-category-expansions-azure-caf-resources-intune
    provides: 8 new rule JSONs (storage account, key vault, NSG, public IP + Autopilot/group-tag/update-ring/assignment-group) and deferred review warnings WR-02..WR-06
provides:
  - WR-02 fixed: Azure storage-account 3–24 minimum encoded in allowedPattern regex
  - WR-03 fixed: autopilot description matches corrected locale wording
  - Catalog-proof assertions in data-integrity suite: 45-count, 11-category map, 20-id search reachability, EN/FR flat-key parity
affects: [15-02, 15-VERIFICATION, milestone-close]

# Tech tracking
tech-stack:
  added: []
  patterns: [regex-encoded length minimum (key-vault technique), stale validation-rules override removal, locale-import parity assertion]

key-files:
  created: []
  modified:
    - src/rules/azure/azure-storage-account.json
    - src/rules/intune/intune-autopilot-device-name.json
    - src/data/validation-rules.json
    - src/lib/data-integrity.test.ts

key-decisions:
  - "Removed stale initial-commit 'Azure > Storage Account' override from validation-rules.json — it shadowed convention.validation via the validateName lookup precedence and kept the old ^[a-z0-9]+$ pattern live, so fixing the rule JSON alone would not have changed app behavior"
  - "WR-03 fix copies en.json:454 corrected wording verbatim into the rule JSON description; FR untouched (already correct)"

patterns-established:
  - "Catalog proofs live inside the single existing describe('data integrity') block — no new spec files (D-12)"
  - "Regex encodes both min and max length (^[prefix][middle]{1,22}[suffix]$) instead of a separate minLength key"

requirements-completed: [QUAL-01]  # partial contribution — catalog-proof portion; phase verification completes QUAL-01

# Metrics
duration: 33min
completed: 2026-08-25
---

# Phase 15 Plan 01: WR Sweep + Catalog Integrity Proofs Summary

**Storage-account 3-char minimum enforced via regex (plus stale validation-rules shadow removed) and autopilot description de-drifted, with 4 new vitest catalog proofs locking 45 conventions / 11 categories / 20-id search reachability / EN=FR parity**

## Performance

- **Duration:** 33 min
- **Started:** 2026-08-25T11:56:33Z
- **Completed:** 2026-08-25T12:29:58Z
- **Tasks:** 2 (task 1 TDD: RED+GREEN commits; task 2 single commit)
- **Files modified:** 4

## Accomplishments
- WR-02 closed: `azure-storage-account` allowedPattern is now `^[a-z0-9][a-z0-9]{1,22}[a-z0-9]$`, so a 2-char name fails the allowed-characters validation row while compliant names like `stappprod001` pass unchanged
- WR-03 closed: `intune-autopilot-device-name` description ends with "flags templates whose %RAND:n% expansion would exceed the 15-character limit — you must still ensure the final name is not all numbers", matching en.json:454; contradictory "typed length only" tail gone
- D-13 catalog proofs landed in the EXISTING `src/lib/data-integrity.test.ts` (D-12, zero new spec files): exactly-45 count, display-cased 11-category count map, global-search id reachability ×20 replicating the useAppState predicate, and EN/FR flat-key parity asserted deep-equal both directions

## Task Commits

Each task was committed atomically:

1. **task 1 (RED): failing tests for WR-02/WR-03** - `622972e` (test)
2. **task 1 (GREEN): apply both data fixes** - `262a84e` (fix)
3. **task 2: catalog-proof assertions** - `836a108` (test)

_Note: task 1 ran TDD — RED confirmed failing for the right reasons ("st" passed allowedPattern row; old description text present), then GREEN turned all tests green._

## Files Created/Modified
- `src/rules/azure/azure-storage-account.json` - allowedPattern now encodes the Azure 3–24 minimum; maxLength/forceLowercase/removeCharacters untouched
- `src/rules/intune/intune-autopilot-device-name.json` - description final sentence replaced with shipped-behavior wording
- `src/data/validation-rules.json` - stale `Azure > Storage Account` override block removed (see Deviations)
- `src/lib/data-integrity.test.ts` - +7 tests: 3 WR-02/WR-03 behavior locks + 4 catalog proofs; file now 18 tests

## Decisions Made
- Deleted rather than updated the legacy `validation-rules.json` Azure override: it was an initial-commit leftover for the pre-Phase-6 Storage Account rule that now shadows the Phase-14 convention (validateName resolves `validationRules[category][name]` before `convention.validation`). Removal restores per-convention JSON as single source of truth, matching the Phase 6 CLEAN-03 pruning precedent. Behavior verified identical for all other conventions (only this one category/name pair existed).
- Test rows located by index with label sanity-check (`rows[3].label` contains "Allowed characters") matching validation.test.ts numeric-index precedent; storage account yields 5 rows including recommended-present.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Removed stale validation-rules.json override that kept WR-02 alive**
- **Found during:** task 1 GREEN — after editing azure-storage-account.json, the new test still failed because validateName resolved the OLD pattern from `validationRules["Azure"]["Storage Account"]`
- **Issue:** initial-commit leftover entry shadowed the convention's own validation (category/name collision with the Phase-14 convention)
- **Fix:** deleted the `"Azure"` block from src/data/validation-rules.json so `convention.validation` wins; `src/data/**` is inside the plan's D-06 allowed-change whitelist
- **Files modified:** src/data/validation-rules.json
- **Verification:** RED→GREEN transition on the WR-02 test; full suite green; no other category overrides existed so no other convention affected
- **Committed in:** 262a84e (task 1 GREEN commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** The deviation was required for the plan's own fix to take effect at runtime. No scope creep; whitelist respected.

## Issues Encountered
- WSL `/mnt/c` environment flake: vitest forks workers intermittently time out at startup under full-suite parallelism ("Timeout waiting for worker to respond"), silently dropping a file's tests while reporting others green. Worked around with `--maxWorkers=2` (CLI flag only, no config change); full suite then passed cleanly: 10 files / 183 tests / 0 errors. Flagged here so later phase-15 gate runs don't misread a dropped file as green.

## User Setup Required
None - no external service configuration required.

## Known Stubs
None — no placeholder or unwired data introduced.

## Next Phase Readiness
- WR-02 and WR-03 swept (D-09 partially satisfied — WR-04..WR-06 remain for subsequent plans in this phase)
- Catalog proofs are now enforced by vitest, ready to be cited in 15-VERIFICATION.md (D-07/D-10)
- Full-suite baseline for the phase: 183 tests green (was 143 at v1.5 start-of-phase reference)

---
*Phase: 15-milestone-verification-full-catalog-integrity*
*Completed: 2026-08-25*

## Self-Check: PASSED

- All 4 modified files + SUMMARY.md exist on disk
- Commits 622972e / 262a84e / 836a108 present in git history
- allowedPattern contains the 3–24 regex; old `^[a-z0-9]+$` gone; "typed length only" wording absent
- Working tree clean; no new spec files created
