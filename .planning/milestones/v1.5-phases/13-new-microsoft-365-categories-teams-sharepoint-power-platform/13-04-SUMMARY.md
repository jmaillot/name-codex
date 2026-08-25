---
phase: 13-new-microsoft-365-categories-teams-sharepoint-power-platform
plan: 04
subsystem: validation
tags: [validation, purview, i18n, unit-tests, gap-closure]

# Dependency graph
requires:
  - phase: 13-new-microsoft-365-categories-teams-sharepoint-power-platform (plans 01–03)
    provides: Purview sensitivity-label convention JSON + validateName row pipeline + locale parity baseline
provides:
  - Generic per-field `allowedPattern` capability on any NamingField (enforced as an extra validation row in validateName)
  - Space-free Purview Sublabel names (`^[A-Za-z0-9&/-]+$`) while parent Classification keeps space support ("Highly Confidential" stays valid)
  - New locale key ui.valFieldPattern in EN + FR (parity preserved)
affects:
  - Any future convention can declare field-level character restrictions declaratively

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Field-declared allowedPattern consumed by per-segment validation rows (empty-value bypass mirrors the existing pattern row)"

key-files:
  created: []
  modified:
    - src/types/Rule.ts
    - src/lib/validation.ts
    - src/lib/validation.test.ts
    - src/rules/purview/purview-sensitivity-label.json
    - src/locales/en.json
    - src/locales/fr.json

key-decisions:
  - "Validation feedback only — normalizeName/removeCharacters untouched; stripping was explicitly out of scope per plan"
  - "Generic mechanism on NamingField rather than a Purview-specific hardcode, so any convention field can opt in"
  - "Empty-value bypass on the new row so incomplete segments don't double-fail"

patterns-established:
  - "Per-field allowedPattern as a declarative extension point on NamingField for character-class restrictions"

requirements-completed: [UAT-13-07]

# Metrics
duration: continuation session ~10min
completed: 2026-08-24
---

# Phase 13 Plan 04: UAT Gap Closure — Space-Free Purview Sublabels Summary

**Generic per-field allowedPattern validation plus a no-space character class on the Purview Sensitivity Label Sublabel field, closing UAT-13-07**

## Gap Closure

- **Gap source:** 13-UAT.md test 7 — user wanted Purview sublabel names to contain no spaces
- **Severity:** minor
- **Status:** CLOSED — verified by human checkpoint approval

## Performance

- **Duration:** ~10 min (continuation session after human-verify checkpoint)
- **Started:** 2026-08-24 (earlier session executed tasks 1–2)
- **Completed:** 2026-08-24
- **Tasks:** 3 (2 auto + 1 human-verify checkpoint)
- **Files modified:** 6

## Accomplishments

- `NamingField` gained optional `allowedPattern`; `validateName` emits one localized validation row (`ui.valFieldPattern`) per segment whose matching field declares a pattern — zero behavior change for conventions without one
- Purview Sublabel field enforces `^[A-Za-z0-9&/-]+$` (no spaces): "Pay Roll" flags a failing segment row, "Pay-Roll" passes, and parent Classification values like "Highly Confidential" remain valid
- Bilingual tips updated inline and via `data.field.Sublabel.tip` overrides ("short, stable, and space-free" / « courts, stables et sans espaces »)

## Task Commits

Each task was committed atomically:

1. **task 1: Per-field allowedPattern validation** - `05e1daf` (feat) — types, validateName row, 6 unit tests, EN/FR keys
2. **task 2: Apply to Purview Sublabel + bilingual tips** - `fadebdc` (feat) — rule JSON allowedPattern + tips, parity gate green
3. **task 3: Re-verify UAT test 7 scenario** - human verification **approved** by user; this SUMMARY is the task deliverable

## Verification

Phase gate results at closure:

- `npm run build` ✓
- `npm run lint` ✓
- `npm test -- --run` ✓ — **143/143 passing** (includes 6 new allowedPattern tests)
- Locale parity: sorted key sets of en.json vs fr.json — **430 = 430**
- Human checkpoint: user re-ran the original failing flow (Purview → Sensitivity Label → Sublabel variant → "Pay Roll" fails / "Pay-Roll" passes / "Highly Confidential" unaffected) and replied **approved**

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test-authoring matcher fix in Task 1**
- **Found during:** task 1
- **Issue:** one newly authored unit test used a matcher that didn't assert what the test intended (test-code issue only, not product code)
- **Fix:** corrected the matcher so the assertion targets the new allowedPattern row
- **Files modified:** src/lib/validation.test.ts
- **Commit:** `05e1daf`

No other deviations from plan content.

## Self-Check: PASSED

- Both task commits exist in git log (`05e1daf`, `fadebdc`)
- All six files_modified artifacts present in the commits' diffs
