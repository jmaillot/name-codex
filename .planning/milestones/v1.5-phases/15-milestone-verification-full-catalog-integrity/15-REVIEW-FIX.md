---
phase: 15-milestone-verification-full-catalog-integrity
fixed_at: 2026-08-25T16:00:00Z
review_path: .planning/phases/15-milestone-verification-full-catalog-integrity/15-REVIEW.md
iteration: 1
findings_in_scope: 6
fixed: 6
skipped: 0
status: all_fixed
---

# Phase 15: Code Review Fix Report

**Fixed at:** 2026-08-25T16:00:00Z
**Source review:** .planning/phases/15-milestone-verification-full-catalog-integrity/15-REVIEW.md
**Iteration:** 1

**Summary:**
- Findings in scope: 6 (1 Critical, 5 Warning; Info findings excluded per fix_scope)
- Fixed: 6
- Skipped: 0

## Fixed Issues

### CR-01: Length validation is dead code — name is truncated before it is validated, and truncation can silently corrupt `%RAND:n%` macros

**Files modified:** `src/lib/validation.ts`, `src/hooks/useAppState.ts`
**Commit:** 3335273
**Status:** fixed: requires human verification (logic change)
**Applied fix:** Added an options parameter to `normalizeName` (`{ truncate?: boolean }`, default `true`). In `useAppState`, the assembled raw name is now normalized **without truncation** into `validatedName`, which is passed to `validateName` so the length row and the `%RAND:n%` expansion row operate on the pre-truncation value. The displayed/copied `generatedName` is derived from `validatedName` with a second `normalizeName` call that applies truncation only — making the previously redundant double-normalize intentional. Under-length names behave exactly as before (normalization ops are idempotent); only over-length input changes behavior.

### WR-01: Switching language resets all builder segment values mid-edit

**Files modified:** `src/hooks/useAppState.ts`
**Commit:** 0d0eaef
**Applied fix:** Removed `i18n.language` from the `buildSegments` rebuild effect's dependency array and added a dedicated effect keyed on `[i18n.language]` that maps existing segments to refresh only their `label` via `fieldLabel(fieldByName(...))`, preserving all user-entered values.

### WR-02: `moveSegment` can displace locked segments via an adjacent swap

**Files modified:** `src/hooks/useAppState.ts`, `src/components/ResultCard.tsx`, `src/locales/en.json`, `src/locales/fr.json`
**Commit:** 2489e58
**Applied fix:** Added the symmetric target guard in `moveSegment`: after resolving `targetSegment`, if it is locked, show feedback and return `prev` unchanged. Wired up the missing "locked" feedback rendering in `ResultCard` (`actionFeedback === "locked"` warning span) plus new `ui.lockedWarn` locale keys in both en.json and fr.json (locale key-parity test stays green).

### WR-03: `copyMarkdown` shows success feedback even when the clipboard write failed

**Files modified:** `src/hooks/useAppState.ts`, `src/components/ResultCard.tsx`, `src/locales/en.json`, `src/locales/fr.json`
**Commit:** c96b94c
**Applied fix:** `copyMarkdown` now branches on `writeClipboard`'s boolean result — `showFeedback("markdown")` on success, new `showFeedback("copy-failed")` on failure. Added matching `copy-failed` warning branch in `ResultCard` and `ui.copyFailed` keys to en.json/fr.json.

### WR-04: Global-search reachability test is tautological — it cannot fail

**Files modified:** `src/lib/data-integrity.test.ts`
**Commit:** 7640289
**Applied fix:** The test now replicates the exact predicate used by `filteredConventions` in `useAppState` (name/description/id/pattern) and queries each convention with a **partial** id fragment (id minus its leading token), so prefix-only or broken matchers would fail instead of the trivially-true `c.id.includes(c.id)`.

### WR-05: Pattern-token integrity test has redundant dead logic and an overly broad fallback escape hatch

**Files modified:** `src/lib/data-integrity.test.ts`
**Commit:** 149d96b
**Applied fix:** Collapsed the dead re-derivation branch (`catalogNames`/`allNames`) into a single assertion `resolved !== undefined || exempt`. Replaced the broad `.includes("Policy")` whitelist with explicit exemptions: frozen `Set(["PolicyId"])` plus documented `CA-` generator prefixes. Verified manually that `DefPolicyType` and `PolicyName` (the only other "Policy"-containing tokens) are real convention field names resolved by `fieldByName`, so narrowing the exemption does not break the suite.

## Skipped Issues

None — all in-scope findings were fixed.

## Verification Notes

- **Tier 2 (type check):** `npx tsc -b` passes cleanly across all six fixes.
- **Tier 2 (tests):** `vitest` could not run — worker startup fails identically on the *unmodified* main working tree (environment issue: vitest fork/thread workers time out under WSL). This is pre-existing and unrelated to these fixes; full suite run is deferred to the verifier phase per workflow.
- **Targeted logic checks:** fragment math for WR-04 verified against all 20 ids; WR-05 exemption narrowing cross-checked against every pattern token containing "Policy"/"CA-" in `src/rules/**`.
- **Isolation:** fixes were committed on a temporary branch inside an isolated worktree, then fast-forwarded onto `gsd/v1.5-naming-convention-expansion` (main tree was clean; ff-only merge). Worktree and temp branch removed after merge.

---

_Fixed: 2026-08-25T16:00:00Z_
_Fixer: OpenCode (gsd-code-fixer)_
_Iteration: 1_
