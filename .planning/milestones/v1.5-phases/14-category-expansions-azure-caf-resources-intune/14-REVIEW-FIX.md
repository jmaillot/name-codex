---
phase: 14-category-expansions-azure-caf-resources-intune
fixed_at: 2026-08-25T13:00:00Z
review_path: .planning/phases/14-category-expansions-azure-caf-resources-intune/14-REVIEW.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 14: Code Review Fix Report

**Fixed at:** 2026-08-25T13:00:00Z
**Source review:** .planning/phases/14-category-expansions-azure-caf-resources-intune/14-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 2 (CR-01, WR-01 only, per orchestrator directive)
- Fixed: 2
- Skipped: 0

## Fixed Issues

### CR-01: `caseMode: "preserve"` coerced to uppercase, corrupting names for 9 conventions

**Files modified:** `src/hooks/useAppState.ts`, `src/hooks/useAppState.preserve-case.test.tsx` (new), `src/lib/segments.test.ts`
**Commit:** 78f0245
**Status:** fixed: requires human verification (logic-error class — though covered by a red→green regression test)
**Applied fix:** TDD flow as directed:
1. Added a failing hook-level regression test (`src/hooks/useAppState.preserve-case.test.tsx`, self-contained harness selecting Teams → `teams-project-team`) asserting `generatedName === "PRJ-Atlas-Finance"` for a `caseMode: "preserve"` convention. Confirmed RED pre-fix: got `"PRJ-ATLAS-FINANCE"`, exactly matching the review's reproduction.
2. Added an `assembleRawName` contract unit test in `src/lib/segments.test.ts`: `caseMode: undefined` keeps mixed-case values untouched.
3. Applied the review's one-line fix adapted to current code at `src/hooks/useAppState.ts:253`: `caseMode` is now only forced when explicitly configured (`"lower"` → `"lower"`, `"upper"` → `"upper"`, `"preserve"`/unset → `undefined`), letting `assembleRawName`'s `cased()` no-op otherwise.
4. Re-ran tests: GREEN (36/36 across both touched files).

Note: no worktree isolation was used because branch `gsd/v1.5-naming-convention-expansion` is checked out in the main working tree (a second worktree on the same branch is rejected by git); orchestrator explicitly directed commits to this branch from the project root. `gsd-sdk query commit` refused ("commit_docs disabled"), so plain `git commit` was used with the same atomic message format.

### WR-01: New macro-expansion validation row has no locale key — French users get English text

**Files modified:** `src/locales/en.json`, `src/locales/fr.json`
**Commit:** d1cc1a1
**Applied fix:** Added `ui.valMacroLength` to both locales adjacent to `valRecommendedPresent`:
- EN: `"Expanded macros fit within {{max}} characters or less"`
- FR: `"Les macros développées tiennent dans {{max}} caractères ou moins"`

Verified programmatically after edit: JSON parses cleanly; EN/FR key parity holds (492 = 492 keys, zero missing either direction); `data.*` baseline unchanged at 398 keys. `src/lib/validation.ts:55` already references `ui.valMacroLength` — no source change needed there. The hardcoded-fallback string in validation.ts remains as a safety net and stays consistent with the new EN wording.

## Verification (gates)

- `npx vitest run` (full suite): all 8 files / 143 tests passed. Two worker-startup timeout errors occurred (the known WSL forks flake, hitting `parse.test.ts` and `validation.test.ts` before they ran); re-ran both files in isolation → 57/57 passed. Suite effectively fully green.
- `npm run build`: exit 0.
- `npm run lint`: exit 0 (5 warnings, 0 errors — all on pre-existing lines unrelated to these fixes).

## Skipped Issues

None — both in-scope findings were fixed. WR-02..WR-06 and IN-01..IN-05 were intentionally left untouched per orchestrator scope directive and remain recorded in 14-REVIEW.md.

---

_Fixed: 2026-08-25T13:00:00Z_
_Fixer: ox-alpha (gsd-code-fixer)_
_Iteration: 1_
