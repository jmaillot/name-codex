---
phase: 15-milestone-verification-full-catalog-integrity
reviewed: 2026-08-25T00:00:00Z
depth: standard
files_reviewed: 7
files_reviewed_list:
  - src/components/SegmentEditor.tsx
  - src/data/validation-rules.json
  - src/hooks/useAppState.ts
  - src/lib/data-integrity.test.ts
  - src/lib/validation.ts
  - src/rules/azure/azure-storage-account.json
  - src/rules/intune/intune-autopilot-device-name.json
findings:
  critical: 1
  warning: 5
  info: 4
  total: 10
status: issues_found
---

# Phase 15: Code Review Report

**Reviewed:** 2026-08-25
**Depth:** standard
**Files Reviewed:** 7
**Status:** issues_found

## Summary

Reviewed the milestone-verification surface: the segment editor UI, app state hook, validation engine, data-integrity test suite, shared validation rules, and the two rule files (azure-storage-account, intune-autopilot-device-name) that anchor the WR-02/WR-03 regression guards.

The rule JSON files themselves are sound: the Azure storage-account `allowedPattern` (`^[a-z0-9][a-z0-9]{1,22}[a-z0-9]$`, 3–24 chars, lowercase/digits only) correctly encodes the Azure constraint and the direct-call unit tests for it pass. The Autopilot rule's description matches shipped validation behavior.

However, cross-file tracing through `useAppState` → `normalizeName` → `validateName` uncovered one blocker: the app validates the **already-truncated** name, making the "Length ≤ max" validation row structurally unable to fail and able to silently corrupt `%RAND:n%` macros. Several additional robustness and test-quality defects were found in `useAppState` and `data-integrity.test.ts`.

## Critical Issues

### CR-01: Length validation is dead code — name is truncated before it is validated, and truncation can silently corrupt `%RAND:n%` macros

**File:** `src/hooks/useAppState.ts:247-281` (with `src/lib/validation.ts:41`)

**Issue:** `normalizeName` slices the name to `rule.maxLength` (`n = n.slice(0, rule.maxLength)`, validation.ts:41). `useAppState` then passes the post-truncation `generatedName` to `validateName` (line 281). Consequences:

1. The validation row `Length is N characters or less` (`validation.ts:51`) **can never be invalid** in any UI flow — the name was already cut to `maxLength` before the check runs. The row always reports OK, giving false assurance.
2. Worse, blind truncation can mangle macros. Example on `intune-autopilot-device-name` (maxLength 15, custom-template pattern): a user enters the 23-character template `WORKSTATION-%RAND:12%`. Truncation yields `WORKSTATION-%RA`. The macro-length row is only added when `/%RAND:\d+%/.test(name)` matches the *whole* name — the truncated fragment doesn't match, so no expansion warning appears; the stray `%` passes the allowed pattern `^[A-Za-z0-9%:-]+$`; every row goes green. The user copies a corrupted template believing it validated. This directly contradicts the convention description's promise that the app "flags templates whose %RAND:n% expansion would exceed the 15-character limit."

Note the compensating clamps (`optionsForSegment` budget filter in segments.ts:225-232 and the `maxLengthBudget` clamp in useAppState.ts:366-389) only cover *dropdown* macro values and `dependsOn`-linked fields — they do not cover the free-text `Template` field or custom typed values, so CR-01 is reachable through normal UI usage.

The WR-02/WR-03 tests pass only because they call `validateName(...)` directly with hand-built inputs, bypassing the truncation step — tests verify the validator in isolation, not the validated pipeline.

**Fix:** Validate the pre-normalization name (or stop slicing in `normalizeName` and enforce max length purely via validation):

```ts
// src/hooks/useAppState.ts
const rawAssembled = assembleRawName(builderSegments, { ... });   // no truncation yet
const rawName = normalizeName(rawAssembled, selectedConvention);
const generatedName = normalizeName(rawName, selectedConvention);

// validate the UNTRUNCATED assembly so over-length / broken macros are flagged
const validationResults = validateName(rawAssembled, selectedConvention, builderSegments, activeFields);
```

Alternatively, keep truncation for the displayed name but add an explicit regression test that drives the full `useAppState` pipeline (assemble → normalize → validate) with an over-budget template and asserts a failing validation row.

## Warnings

### WR-01: Switching language resets all builder segment values mid-edit

**File:** `src/hooks/useAppState.ts:196-212`

**Issue:** The effect that rebuilds `builderSegments` includes `i18n.language` in its dependency array and calls `buildSegments(...)`, which reconstructs every segment from `defaultValue`s. Changing the UI language therefore wipes all user-entered/customized segment values without warning.

**Fix:** Only rebuild labels on language change (e.g., derive `label` during render via `fieldLabel`, or map existing segments to refresh `label` while preserving `value`), and reserve the full `buildSegments` reset for convention/pattern changes:

```ts
useEffect(() => {
  if (!selectedConvention) return;
  setBuilderSegments((prev) =>
    prev.map((s) => ({
      ...s,
      label: fieldLabel(fieldByName(activeFields, s.sourceName), s.sourceName),
    })),
  );
}, [i18n.language]);
```

### WR-02: `moveSegment` can displace locked segments via an adjacent swap

**File:** `src/hooks/useAppState.ts:403-441`

**Issue:** `moveSegment` blocks moving a locked segment *itself* and blocks moving across `fixedFirst` (upward) / `fixedLast` (downward) targets — but it never checks whether the **target** segment is `locked`. For `[Env, Instance(locked)]`, moving `Env` down swaps it past the locked `Instance`, relocating the locked segment and breaking the convention's positional guarantee. (The UI disables buttons only on the protected segment itself, so this is reachable.)

**Fix:** Add the symmetric target guard:

```ts
if (isLocked(selectedConvention, targetSegment.sourceName)) {
  showFeedback("locked");
  return prev;
}
```

### WR-03: `copyMarkdown` shows success feedback even when the clipboard write failed

**File:** `src/hooks/useAppState.ts:514-517`

**Issue:** `writeClipboard` returns `false` when both the async Clipboard API and the `execCommand` fallback fail, and `copyName` correctly branches on it — but `copyMarkdown` ignores the result and unconditionally calls `showFeedback("markdown")`. Users on permission-restricted contexts get a "copied" confirmation while nothing was copied (and unlike `copyName`, nothing is added to history either way).

**Fix:**

```ts
const copyMarkdown = async () => {
  const ok = await writeClipboard(markdown);
  if (ok) showFeedback("markdown");
  else showFeedback("copy-failed"); // surface an error feedback key
};
```

### WR-04: Global-search reachability test is tautological — it cannot fail

**File:** `src/lib/data-integrity.test.ts:172-179`

**Issue:** `"every new convention is reachable via global-search id match"` asserts `allConventions.some((c) => c.id.toLowerCase().includes(query))` where `query === id.toLowerCase()`. Any convention whose own `id` is in the array satisfies `c.id.includes(c.id)` trivially. The test proves existence (already covered by other tests), not search reachability, and would never catch a search implementation that, e.g., only matched prefixes or dropped diacritics handling.

**Fix:** Assert against the actual search predicate used by `filteredConventions` in `useAppState` (name/description/id/pattern matching), or at minimum test a *partial* substring of the id plus a term drawn from `name`/`description` so the test exercises the same code path as the UI.

### WR-05: Pattern-token integrity test has redundant dead logic and an overly broad fallback escape hatch

**File:** `src/lib/data-integrity.test.ts:72-91`

**Issue:** Two problems:
1. Inside `if (!resolved && !fallbackOk)`, the assertion `allNames.includes(token.value) || fallbackOk` re-derives almost exactly what `fieldByName(fields, token.value)` already determined (same name lists, same case-sensitive matching), building `catalogNames`/`allNames` arrays that add nothing. The branch is effectively `expect(resolved || fallbackOk).toBe(true)` written in a way that obscures intent.
2. `fallbackOk = token.value === "PolicyId" || token.value.startsWith("CA-") || token.value.includes("Policy")` whitelists *any* token containing "Policy", so a genuinely broken token like `GroupPolicyNmae` (typo) would silently pass the integrity gate this suite exists to enforce — undermining the phase's "full catalog integrity" goal.

**Fix:** Collapse to `expect(resolved ?? undefined, \`...\`).toBeDefined()` for non-exempt tokens, and shrink the exemption list to explicit ids (e.g., a frozen `Set(["PolicyId"])` plus documented CA generator prefixes) rather than a substring match on "Policy".

## Info

### IN-01: `generatedName` is normalized twice

**File:** `src/hooks/useAppState.ts:247-265`

**Issue:** `rawName = normalizeName(assembleRawName(...))` is immediately followed by `generatedName = normalizeName(rawName, ...)`. All three `normalizeName` operations (lowercase, character removal, truncation) are idempotent, so the second call is a no-op and just obscures the data flow (and hides CR-01's ordering problem).

**Fix:** Drop the second call and use `rawName` directly, or add a comment documenting why double application is intentional.

### IN-02: Category/name lookup into `validationRules` is dead code; module typed `as any`

**File:** `src/lib/validation.ts:32,46` and `src/data/validation-rules.json:1-6` (via `src/lib/data.ts:9`)

**Issue:** Both `normalizeName` and `validateName` first try `validationRules?.[convention.category]?.[convention.name]`, but `validation-rules.json` contains only a `default` key, so the lookup always misses and every convention falls through to `convention.validation`. The indirection suggests per-category overrides exist when they don't, and `export const validationRules = validationRulesData as any` (data.ts:9) erases type safety on the whole rule shape.

**Fix:** Either populate `validation-rules.json` with real per-convention entries or simplify the resolution chain to `convention.validation ?? validationRules.default`, and replace `as any` with a typed `ValidationRule` interface (`{ forceLowercase?: boolean; removeCharacters?: string[]; maxLength?: number; allowedPattern?: string }`).

### IN-03: Redundant nested `if (policy)` inside a guard that already requires `policy`

**File:** `src/hooks/useAppState.ts:348-350`

**Issue:** `if (policy && changed?.sourceName === ...)` is immediately followed by `if (policy) { ... }`. The inner check is always true — dead conditional noise inside an already dense function.

**Fix:** Remove the inner `if (policy)` and dedent its body.

### IN-04: Magic numbers for feedback timeout, history/favorites caps

**File:** `src/hooks/useAppState.ts:75-78,507,521`

**Issue:** Feedback timeout `2000` ms, history cap `12`, favorites cap `20` are inline literals repeated in sibling functions (`copyName`, `addFavorite`).

**Fix:** Extract named constants, e.g. `const FEEDBACK_MS = 2000; const HISTORY_LIMIT = 12; const FAVORITES_LIMIT = 20;` at module scope.

---

_Reviewed: 2026-08-25_
_Reviewer: OpenCode (gsd-code-reviewer)_
_Depth: standard_
