---
phase: 14-category-expansions-azure-caf-resources-intune
reviewed: 2026-08-25T00:00:00Z
depth: standard
files_reviewed: 26
files_reviewed_list:
  - src/components/SegmentEditor.tsx
  - src/data/segments/azure/caf-workloads.json
  - src/data/segments/intune/assignment-group-prefix.json
  - src/data/segments/intune/autopilot-macros.json
  - src/data/segments/intune/group-tags.json
  - src/data/segments/intune/update-rings.json
  - src/hooks/useAppState.autopilot.test.tsx
  - src/hooks/useAppState.ts
  - src/lib/autopilot-budget.test.ts
  - src/lib/macros.test.ts
  - src/lib/macros.ts
  - src/lib/segments.test.ts
  - src/lib/segments.ts
  - src/lib/validation.ts
  - src/locales/en.json
  - src/locales/fr.json
  - src/rules/azure/azure-key-vault.json
  - src/rules/azure/azure-network-security-group.json
  - src/rules/azure/azure-public-ip.json
  - src/rules/azure/azure-storage-account.json
  - src/rules/intune/intune-assignment-group.json
  - src/rules/intune/intune-autopilot-device-name.json
  - src/rules/intune/intune-group-tag.json
  - src/rules/intune/intune-update-ring.json
  - src/types/Rule.ts
  - vite.config.ts
findings:
  critical: 1
  warning: 6
  info: 5
  total: 12
status: issues_found
---

# Phase 14: Code Review Report

**Reviewed:** 2026-08-25T00:00:00Z
**Depth:** standard
**Files Reviewed:** 26
**Status:** issues_found

## Summary

Phase 14 delivers Azure CAF resource rules, Intune convention expansions as data-driven JSON segment libraries, and three gap-closure fixes: segment-driven name assembly (`assembleRawName`), budget-aware Autopilot RAND macros (`macros.ts`, `maxLengthBudget` filtering/clamping), and rule-scoped field tips. The macro math (`expandedLength`, `randWidth`) is correct and safely anchored; the budget filter/clamp wiring is well tested with real-rule integration tests; EN/FR locale parity for new `data.*` keys is complete; each CAF rule's `allowedValues` correctly excludes its own resource abbreviation.

One blocker was found: the new `assembleRawName` call site coerces every non-`lower` `caseMode` to `"upper"`, breaking the nine rules that declare `"caseMode": "preserve"` (introduced in commit 57c495c, phase 14-03). Remaining findings are an i18n gap for the new validation row, a missing minimum-length constraint on storage accounts, a stale rule description contradicting shipped behavior, latent handling of pattern-level fields in validation, and two state/UI consistency issues in `SegmentEditor`.

## Critical Issues

### CR-01: `caseMode: "preserve"` coerced to uppercase, corrupting names for 9 conventions

**File:** `src/hooks/useAppState.ts:253`
**Issue:** The raw-name assembly passes `caseMode: selectedConvention.validation?.caseMode === "lower" ? "lower" : "upper"`. Any `caseMode` that is not exactly `"lower"` — including the declared `"preserve"` and absent — is forced to `"upper"`, so `assembleRawName` uppercases every segment value. Nine rules declare `"caseMode": "preserve"` (`teams/team-project.json:46`, `team-service.json:46`, `team-department.json:46`, `m365-group-naming-policy.json:44`, `purview/*.json` ×4, `sharepoint/spo-hub-site.json:46`). Concretely, the documented example `PRJ-Atlas-Finance` (team-project.json:27) now generates `PRJ-ATLAS-FINANCE`; Purview labels such as `Highly Confidential` render as `HIGHLY CONFIDENTIAL`. This is a regression introduced by phase 14-03's segment-driven assembly (commit 57c495c).
**Fix:** Only force casing when explicitly configured; let `assembleRawName`'s `cased()` no-op otherwise:

```ts
caseMode:
  selectedConvention.validation?.caseMode === "lower" ? "lower"
  : selectedConvention.validation?.caseMode === "upper" ? "upper"
  : undefined, // "preserve" / unset → leave value casing untouched
```

(`assembleRawName` already treats anything other than `"lower"`/`"upper"` as preserve.) Add a hook-level regression test asserting `generatedName` keeps mixed case for a `caseMode: "preserve"` convention.

## Warnings

### WR-01: New macro-expansion validation row has no locale key — French users get English text

**File:** `src/lib/validation.ts:55` (keys missing in `src/locales/en.json` and `src/locales/fr.json`)
**Issue:** `validateName` emits the RAND-expansion row with `tl("ui.valMacroLength", ...)`, but `ui.valMacroLength` exists in neither `en.json` nor `fr.json` (verified by grep; the `ui` block ends at `valRecommendedPresent`). Every user therefore sees the hardcoded English fallback `"Expanded macros fit within {{max}} characters"` — in both languages, defeating the app's EN/FR parity maintained everywhere else.
**Fix:** Add to `en.json`:

```json
"valMacroLength": "Expanded macros fit within {{max}} characters or less"
```

and to `fr.json`:

```json
"valMacroLength": "Les macros développées tiennent dans {{max}} caractères ou moins"
```

### WR-02: Storage Account validation missing Azure's 3-character minimum

**File:** `src/rules/azure/azure-storage-account.json:39-44`
**Issue:** Azure storage account names must be **3–24** characters. Validation enforces `maxLength: 24` and `allowedPattern: "^[a-z0-9]+$"`, which accepts 1–2 character names (e.g. `st1`) as fully compliant. Sibling rule `azure-key-vault.json:42` correctly encodes its 3-char minimum via `[A-Za-z0-9-]{1,22}`; storage does not. A governance tool green-lighting invalid names is a correctness defect in its core purpose.
**Fix:** Encode the minimum in the pattern (keeps `maxLength: 24` doing the upper bound):

```json
"allowedPattern": "^[a-z0-9][a-z0-9]{1,22}[a-z0-9]$"
```

or add a `minLength` concept to `NamingValidationConfig` and `validateName`.

### WR-03: Autopilot rule description contradicts shipped behavior

**File:** `src/rules/intune/intune-autopilot-device-name.json:5`
**Issue:** The JSON description states the app "checks allowed characters and typed length **only**". Phase 14-04 added the `%RAND:n%` expansion-length validation row (`validation.ts:52-64`), and the EN/FR locale overrides of this same description were updated to mention it (`en.json:453`, `fr.json:453`) — but the source-of-truth JSON was not. The JSON is what ships in the data file and is the fallback whenever the locale key is absent; the two copies now make contradictory claims about the tool's guarantees.
**Fix:** Update the JSON `description` to match the corrected locale wording, e.g.: "...this app checks allowed characters and typed length, and also flags templates whose %RAND:n% expansion would exceed the 15-character limit — you must still ensure the final name is not all numbers." Consider deriving one from the other (locale key generated from rule id) so they cannot drift.

### WR-04: `validateName` ignores pattern-level fields — per-field patterns silently unenforced for some rules

**File:** `src/lib/validation.ts:71-80`
**Issue:** The per-field `allowedPattern` loop iterates `convention.fields` only, but segments are built from `activeFields`, which prefer `selectedPattern.fields` (`useAppState.ts:121-127`). `entra-app-registration.json` defines *all* its fields at pattern level (Tool, Function, AccessLevel, Environment, Version, Company, Department, Customer, Project) with top-level `fields: []` — none of those segments can ever get a field-pattern validation row, today or if someone adds `allowedPattern` later. Currently latent (none of those fields carry `allowedPattern`), but it is a structural trap: the builder and the validator read different field sources.
**Fix:** Pass the active field list into validation, e.g. change the signature to `validateName(name, convention, segments, fields = convention.fields)` and have `useAppState.ts:274` pass `activeFields`.

### WR-05: Controlled `<select>` displays an option that is no longer the stored value after option refiltering

**File:** `src/components/SegmentEditor.tsx:199-209` (with `src/lib/segments.ts:195-237`)
**Issue:** `optionsForSegment` dynamically filters options (`allowedValuesByField`, persona ranges, `maxLengthBudget`). When a dependency change removes the currently stored value from the option list, the `<select>` falls back to displaying the first option while `segment.value` keeps the stale removed value — the generated name then contains something the user is not seeing. The reactive clamp in `useAppState.ts:364-382` repairs only pure `%RAND:n%` values; multi-select, `%SERIAL%` mixes, and CA persona/platform dependencies have no equivalent reset.
**Fix:** Mirror the existing `caPolicyId`/budget resets generically: after computing filtered options in `updateSegmentValue`, reset any dependent segment whose value is no longer among `optionsForSegment(...)` (to `defaultValueForField(field)`), or render a disabled sentinel `<option>` when `!options.some(o => optionValue(o) === segment.value)` so the mismatch is at least visible.

### WR-06: PolicyId numeric input shows a phantom default that diverges from stored value and swallows keystrokes

**File:** `src/components/SegmentEditor.tsx:162-184`
**Issue:** The displayed value is `(stripped suffix) || caDefaultNumber`. When the stored number part is empty (value equals the prefix, e.g. `CA2`), the input displays `01` while the live preview and generated name use the empty suffix (`CA2`) — visible state contradicts actual state until blur. Worse, because the phantom `01` becomes the controlled value, a keystroke appended to it produces e.g. `015`, which `.slice(0, caDigits)` truncates back to `01`: the typed digit appears ignored and the stored value jumps from empty to the default.
**Fix:** Do not fabricate content in `value`; keep the input empty when the suffix is empty and rely on `placeholder={caDefaultNumber}`, moving the pad/default logic solely into `onBlur`:

```tsx
value={segment.value.startsWith(caPrefix) ? segment.value.slice(caPrefix.length) : segment.value}
```

## Info

### IN-01: Redundant double normalization of the generated name

**File:** `src/hooks/useAppState.ts:247-258`
**Issue:** `rawName` is the result of `normalizeName(assembleRawName(...))` and `generatedName = normalizeName(rawName, ...)` normalizes the identical string a second time.
**Fix:** Drop the second call (`const generatedName = rawName;`) or drop normalization inside the first call — keep one.

### IN-02: Dead nested condition in the caPolicyId reactive reset

**File:** `src/hooks/useAppState.ts:341-343`
**Issue:** Inside `if (policy && changed?.sourceName === ...)` the body re-tests `if (policy)`, which is always true there.
**Fix:** Remove the inner `if (policy)` wrapper and de-indent its body.

### IN-03: Misleading test title asserting a different number than expected

**File:** `src/lib/macros.test.ts:20-22`
**Issue:** Test is titled `"counts prefix + RAND expansion (DT-%RAND:4% = 6)"` but asserts `toBe(7)` (correct: 3 + 4). The wrong arithmetic in the title will mislead future maintainers debugging failures.
**Fix:** Retitle to `(DT-%RAND:4% = 7)`.

### IN-04: Test configuration weakens CI guardrails

**File:** `vite.config.ts:21,23-27`
**Issue:** `passWithNoTests: true` means a glob/regression that accidentally excludes all spec files reports success, and coverage `include` covers only `src/lib/**` — the phase-14 hook-level regressions (`useAppState.autopilot.test.tsx`) exercise code entirely outside measured coverage.
**Fix:** Set `passWithNoTests: false` and add `src/hooks/**/*.tsx` (at minimum) to `coverage.include`.

### IN-05: Order-dependent shared harness in hook integration tests

**File:** `src/hooks/useAppState.autopilot.test.tsx:31-96`
**Issue:** All tests share one mounted root and mutate its state sequentially (test 2 depends on the pattern selected in setup; test 4 depends on test 2's `%RAND:12%` selection; test 5 restores it). Any reordering, insertion, or a future `describe.sequential`/shuffle mode breaks the suite in confusing ways.
**Fix:** Either make each test self-contained (re-select the needed pattern/state in-test via `act`), or add an explicit comment plus a guard assertion at the start of each dependent test documenting the required predecessor state.

---

_Reviewed: 2026-08-25T00:00:00Z_
_Reviewer: OpenCode (gsd-code-reviewer)_
_Depth: standard_
