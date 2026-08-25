---
phase: 13-new-microsoft-365-categories-teams-sharepoint-power-platform
fixed_at: 2026-08-24T17:20:00Z
review_path: .planning/phases/13-new-microsoft-365-categories-teams-sharepoint-power-platform/13-REVIEW.md
iteration: 1
findings_in_scope: 2
fixed: 2
skipped: 0
status: all_fixed
---

# Phase 13: Code Review Fix Report

**Fixed at:** 2026-08-24T17:20:00Z
**Source review:** .planning/phases/13-new-microsoft-365-categories-teams-sharepoint-power-platform/13-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 2 (fix_scope: critical_warning)
- Fixed: 2
- Skipped: 0

## Fixed Issues

### CR-01: Engine forces ALL-CAPS output; new rules' examples and semantics assume mixed case — Entra attribute placeholders corrupted

**Files modified:** `src/types/Rule.ts`, `src/hooks/useAppState.ts`, `src/rules/teams/m365-group-naming-policy.json`, `src/rules/teams/team-department.json`, `src/rules/teams/team-project.json`, `src/rules/teams/team-service.json`, `src/rules/sharepoint/spo-hub-site.json`, `src/rules/purview/purview-sensitivity-label.json`, `src/rules/purview/purview-retention-label.json`, `src/rules/purview/purview-retention-policy.json`, `src/rules/purview/purview-dlp-policy.json`
**Commit:** 8607c5d
**Status:** fixed: requires human verification (logic change)
**Applied fix:** Introduced per-rule `caseMode?: "upper" | "lower" | "preserve"` on `NamingValidationConfig`. The raw-name assembly in `useAppState.ts` now applies the convention's case mode instead of unconditionally uppercasing segment values (default remains `"upper"` for full backwards compatibility with all pre-existing rules). Added `"caseMode": "preserve"` to the `validation` block of all nine new rule files, so mixed-case examples are reproducible and the M365 Group Naming Policy's `[Department]`-style Entra attribute placeholders are never re-cased into tokens Entra ID cannot resolve.

### WR-01: Category → icon and category → CSS class mappings are parallel hand-maintained structures

**Files modified:** `src/components/NavPanel.tsx`
**Commit:** 35ce9a6
**Applied fix:** Collapsed `getCategoryIcon()`'s object literal and `getCategoryClass()`'s switch statement into a single `CATEGORY_META: Record<string, { icon; cls }>` source of truth. Adding a category now requires exactly one entry instead of two synchronized structures; unknown categories still fall back to the Azure icon and empty class as before.

## Skipped Issues

None — all in-scope findings were fixed.

---

_Verification:_ Tier 1 re-reads confirmed all edits intact; Tier 2 `tsc --noEmit` passed clean after each fix; all rule JSON files parse; vitest suite passes post-fix (137/137).

_Note:_ Out-of-scope Info findings (IN-01 dead `category-icon` className, IN-02 pp-environment example values, IN-03 SVG asset optimization) were intentionally left untouched per `fix_scope: critical_warning`.

_Fixed: 2026-08-24T17:20:00Z_
_Fixer: OpenCode (gsd-code-fixer)_
_Iteration: 1_
