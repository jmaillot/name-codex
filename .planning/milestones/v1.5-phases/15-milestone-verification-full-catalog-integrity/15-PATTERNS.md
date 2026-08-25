# Phase 15: Milestone Verification — Full Catalog Integrity - Pattern Map

**Mapped:** 2026-08-25
**Files analyzed:** 7 new/modified files (+ smoke script artifact)
**Analogs found:** 7 / 7

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/lib/data-integrity.test.ts` | test | transform (assertions over loaded catalog) | *itself* (extend in-place per D-11/D-12); `src/lib/data.ts` for `allConventions` source | exact |
| `src/rules/azure/azure-storage-account.json` | model (data JSON) | CRUD (declarative rule data) | `src/rules/azure/azure-key-vault.json` validation block (encodes min length via regex) | exact |
| `src/rules/intune/intune-autopilot-device-name.json` | model (data JSON) | CRUD (declarative rule data) | its own locale overrides at `src/locales/en.json:454` / `fr.json:454` (corrected wording to mirror) | exact |
| `src/lib/validation.ts` | service | transform (name → ValidationResult[]) | *itself* (`validateName` signature extension per WR-04); field-source precedent in `useAppState.ts` `activeFields` | exact |
| `src/hooks/useAppState.ts` | hook/store | event-driven (state updates + reactive resets) | *itself* — `updateSegmentValue` reactive-reset patterns (lines 341–392); WR-04 call site line 281 | exact |
| `src/components/SegmentEditor.tsx` | component | event-driven (controlled inputs) | *itself* — policy-id numeric input (162–185) and `<select>` block (199–209) | exact |
| `15-VERIFICATION.md` (new) | planning doc | request-response (evidence record) | `.planning/milestones/v1.4-phases/12-theme-switching-verification/12-SMOKE-MATRIX.md` (gates + matrix + verdict format); v1.3 SAFE-01 "VERIFICATION passed 10/10" style | role-match |

> **Whitelist tension flag for planner (D-06 vs D-09):** WR-02 and WR-03 are pure data fixes
> (`src/rules/**` — whitelist-clean). WR-04, WR-05, WR-06 touch `src/lib/validation.ts`,
> `src/hooks/useAppState.ts`, `src/components/SegmentEditor.tsx` — these are **code diffs**
> outside the D-06 whitelist and MUST be explicitly justified in `15-VERIFICATION.md`
> ("zero **or justified**" clause of D-06). The plan should pre-declare these as sanctioned
> sweep diffs so the diff-proof step does not treat them as failures.

## Pattern Assignments

### `src/lib/data-integrity.test.ts` (test, transform) — EXTEND IN-PLACE

**Analog:** the file itself (D-12: no new spec files). New `it(...)` blocks go inside the existing top-level `describe("data integrity", ...)` wrapper.

**Suite structure pattern** (lines 1–8):
```typescript
import { allConventions, caNumberingRanges, getGeneratorFile, getSegmentFile, segmentCatalog } from './data'
import { parsePattern } from './parse'
import { fieldByName } from "./segments"

describe("data integrity", () => {
  it("allConventions is non-empty", () => {
    expect(allConventions.length).toBeGreaterThan(0)
  })
```

**Per-convention iteration with message-context assertion pattern** (lines 71–79) — copy this shape for count/category assertions:
```typescript
it("every convention has required shape", () => {
  for (const conv of allConventions) {
    expect(conv.category, `${conv.id} should have category`).toBeTruthy()
    expect(conv.id, `${conv.id} should have id`).toBeTruthy()
    ...
  }
})
```

**New assertions to add (D-07), modeled on the above shapes:**

1. **Count:** replace-in-spirit of line 6–8 — assert `allConventions.length === 45`.
2. **Category coverage:** derive categories from `conv.category`; assert the 11-category set `{ azure: 12, intune: 9, conditional-access: 2, defender: 3, entra-id: 1, exchange: 2, groups: 4, power-platform: 1, purview: 4, sharepoint: 3, teams: 4 }`. NOTE: `allConventions[i].category` is display-cased (e.g. `"Intune"` per autopilot JSON line 3) while directory names are kebab-case — assert against the actual runtime values (check one convention's category value before hardcoding the set).
3. **Global-search reachability:** replicate the search predicate from `useAppState.ts:91–102` (below) as a pure function over `allConventions`: for each of the 20 new convention ids, a query equal to the id must match via `item.id.toLowerCase().includes(query)`.
4. **EN/FR key parity:** import both locales directly (precedent: `src/i18n.ts:3–4`):
   ```typescript
   import en from "../locales/en.json";
   import fr from "../locales/fr.json";
   ```
   Flatten both objects recursively into sorted key arrays and assert deep equality both directions (baseline after WR-01 fix: 492 = 492 keys).

### Global-search reachability — mechanical predicate

**Source:** `src/hooks/useAppState.ts` lines 91–102 (this IS the app's global search — asserting hits through an identical predicate is the D-07 "mechanical, not manual nav walk" proof):
```typescript
const filteredConventions = useMemo(() => {
  const query = objectSearch.trim().toLowerCase();
  if (!query) return conventionsForCategory;
  return conventionsForCategory.filter(
    (item) =>
      conventionName(item).toLowerCase().includes(query) ||
      conventionDescription(item).toLowerCase().includes(query) ||
      item.id.toLowerCase().includes(query) ||
      (item.pattern ?? "").toLowerCase().includes(query)
  );
}, [conventionsForCategory, objectSearch, i18n.language]);
```

### `src/rules/azure/azure-storage-account.json` (model, CRUD) — WR-02 fix

**Analog:** `src/rules/azure/azure-key-vault.json` lines 41–44 — sibling rule that correctly encodes a 3-char minimum purely via regex, keeping `maxLength` as upper bound:

```json
"validation": {
  "maxLength": 24,
  "allowedPattern": "^(?!.*--)[A-Za-z][A-Za-z0-9-]{1,22}[A-Za-z0-9]$"
}
```

**Current storage-account block being fixed** (lines 39–45):
```json
"validation": {
  "maxLength": 24,
  "forceLowercase": true,
  "removeCharacters": ["-", "_", "."],
  "allowedPattern": "^[a-z0-9]+$"
}
```
This accepts 1–2 character names (the defect). Copy the key-vault technique: encode the minimum inside `allowedPattern`, e.g. `"^[a-z0-9][a-z0-9]{1,22}[a-z0-9]$"`, leaving `maxLength: 24` untouched. No schema change, no code change — stays whitelist-clean.

### `src/rules/intune/intune-autopilot-device-name.json` (model, CRUD) — WR-03 fix

**Analog:** the corrected locale override already shipped at `src/locales/en.json:454` (and FR twin at `fr.json:454`). Update the JSON `description` (line 5) to match this wording so the source-of-truth and locale copies stop contradicting each other:

```
"...this app checks allowed characters and typed length, and also flags templates whose %RAND:n% expansion would exceed the 15-character limit — you must still ensure the final name is not all numbers."
```

Current contradictory JSON text ends: `"...checks allowed characters and typed length only — you must ensure..."`. Keep FR wording untouched (already correct). Data-only change — whitelist-clean.

### `src/lib/validation.ts` (service, transform) — WR-04 fix

**Analog:** the function itself; the fix extends the signature with a defaulted parameter (backward-compatible — existing tests in `src/lib/validation.test.ts` keep passing unchanged).

**Current per-field loop reading only `convention.fields`** (lines 45, 71–80):
```typescript
export function validateName(name: string, convention: NamingConvention, segments: BuilderSegment[]): ValidationResult[] {
  ...
  (convention.fields ?? []).forEach((field) => {
    if (!field.allowedPattern) return;
    segments.forEach((segment) => {
      if (segment.sourceName !== field.name) return;
      results.push({
        label: tl("ui.valFieldPattern", `Segment ${field.name} respects its allowed characters`, { name: field.name }),
        valid: new RegExp(field.allowedPattern as string).test(segment.value) || segment.value.length === 0,
      });
    });
  });
```

**Fix pattern (per review):** `validateName(name, convention, segments, fields = convention.fields)` and iterate `fields` instead of `convention.fields`.

**tl() fallback pattern** — if any new validation row ever needs a label, follow this exact convention (line 76): `tl("ui.valFieldPattern", "<English fallback>", { name })` plus matching keys in BOTH `src/locales/en.json` and `fr.json` (WR-01 fix precedent, 14-REVIEW-FIX.md: EN + FR added adjacent to `valRecommendedPresent`, parity re-verified 492 = 492).

### `src/hooks/useAppState.ts` (hook, event-driven) — WR-04 call site + WR-05 reset

**WR-04 call site to update** (line 281) — pass `activeFields` (memoized at lines 121+, already in scope):
```typescript
const validationResults = validateName(generatedName, selectedConvention, builderSegments);
```

**WR-05 analog — the established dependent-reset pattern to generalize** (lines 341–392, inside `setBuilderSegments` in `updateSegmentValue`). Two existing precedents to mirror:

caPolicyId persona-range reset (lines 348–363):
```typescript
if (policy && changed?.sourceName === caPolicyIdPersonaSource(policyField)) {
  const rangeKey = personaRangeKeyForField(policyField, next);
  ...
  if (range && !policy.value.startsWith(range.prefix)) {
    return next.map((s) =>
      s.key === policy.key
        ? { ...s, value: `${range.prefix}${range.defaultNumber ?? ""}` }
        : s
    );
  }
}
```

maxLengthBudget clamp (lines 366–389) — note the structural template: compute filtered dependents from `activeFields`, then `return next.map(...)` replacing out-of-band values:
```typescript
// maxLengthBudget clamp (mirrors the caPolicyId reactive reset above):
const maxLen = selectedConvention.validation?.maxLength;
if (maxLen !== undefined) {
  const dependentFields = activeFields.filter(
    (f) => f.maxLengthBudget?.dependsOn === changed?.sourceName
  );
  if (dependentFields.length > 0) {
    ...
    return next.map((s) => {
      if (!dependentFields.some((f) => f.name === s.sourceName)) return s;
      ...
      return { ...s, value: `%RAND:${remaining}%` };
    });
  }
}
return next;
```

A WR-05 generic reset slots in alongside these: after computing `optionsForSegment(...)` per segment, reset any segment whose stored value is no longer among its options (reset target precedent: `defaultValueForField(field)`).

### `src/components/SegmentEditor.tsx` (component, event-driven) — WR-05 sentinel / WR-06 input

**WR-06 — current phantom-default numeric input** (lines 162–184). The `|| caDefaultNumber` in `value` is the defect; the fix keeps `value` raw and moves defaulting solely into `onBlur` (which already exists, lines 173–181):
```tsx
<input
  inputMode="numeric"
  value={
    (segment.value.startsWith(caPrefix)
      ? segment.value.slice(caPrefix.length)
      : segment.value) || caDefaultNumber
  }
  onChange={(e) => {
    const digits = e.target.value.replace(/\D/g, "").slice(0, caDigits);
    onUpdate(segment.key, caPrefix + digits);
  }}
  onBlur={() => {
    const suffix = segment.value.startsWith(caPrefix)
      ? segment.value.slice(caPrefix.length)
      : segment.value;
    const normalized = suffix
      ? suffix.padStart(caDigits, "0")
      : caDefaultNumber;
    onUpdate(segment.key, caPrefix + normalized);
  }}
  placeholder={caDefaultNumber}
```
Fix: drop `|| caDefaultNumber` from `value` — `placeholder={caDefaultNumber}` (already present, line 182) carries the visual hint.

**WR-05 — dropdown block where the stale-value mismatch lives** (lines 199–209):
```tsx
<select
  value={segment.value}
  onChange={(e) => onUpdate(segment.key, e.target.value)}
>
  {options.map((v) => (
    <option key={optionValue(v)} value={optionValue(v)}>
      {optionLabel(v, field)}
    </option>
  ))}
</select>
```
Fix options per review: render a disabled sentinel `<option>` when `!options.some(o => optionValue(o) === segment.value)` (minimal, component-local), or handle generically in the `updateSegmentValue` reset pattern above. Component follows existing conventions: `tl()` labels, `optionValue`/`optionLabel` helpers, stable non-index keys.

---

### `15-VERIFICATION.md` (planning doc, new)

**Analog:** `.planning/milestones/v1.4-phases/12-theme-switching-verification/12-SMOKE-MATRIX.md` — copy its structure section-for-section:

| Section | Excerpt to emulate |
|---------|--------------------|
| Header | `# Phase 12 / v1.4 — Full Milestone Verification Record` + bolded Plan/Requirement/Executed/Method lines (lines 1–4) |
| Mechanical gates | One subsection per gate with **exit code stated**, full verbatim output in fenced blocks, and a ✅ PASS verdict line (lines 8–82). Gate order there: `check:tokens` → locale-parity one-liner → `vitest run` → `build` → `lint` |
| Environment preamble | "Environment: Linux worktree checkout — `npm ci` run first per STATE.md environment note (node_modules held Windows-only native bindings)" (line 10) — mandatory for this phase too |
| Evidence-by-grep | Criterion statement + verbatim grep/read excerpts proving each claim (PERF-01..03 format, lines 85–137) — reuse for the diff-proof output and count/search assertion output |
| Smoke matrix | Numbered workflow table `| # | Workflow | Dark | Light |` with honest per-cell PASS/FAIL, cell-count footer "**Cell count:** N/N PASS · **FAIL cells:** …", and explicit user-approval stamp (lines 140–167). Phase 15 variant: columns `EN/Dark`, `EN/Light`, `FR/Dark`, `FR/Light` (6 workflows × 4 axes ≈ 24 cells) |
| Verdict | Evidence-stream summary table + milestone-proven closing statement (lines 171–188); v1.3 phrasing "VERIFICATION passed 10/10" |

**Locale-parity gate one-liner precedent** (12-SMOKE-MATRIX.md lines 42–47) — reuse verbatim approach for the diff-proof-era parity evidence:
```
$ node -e "...flat-key count en.json vs fr.json..."
PARITY OK 374=374
```

**Zero-code-diff proof (D-05/D-06)** — no prior analog exists (first use). Build from git plumbing:
```bash
git diff v1.4..HEAD --name-only \
  | grep -Ev '^(src/rules/|src/data/|src/locales/en\.json$|src/locales/fr\.json$)'
# empty output (or only pre-justified sweep diffs) ⇒ PROOF HOLDS
```

**Smoke-script delivery (D-03)** — fixed convention + fixed segment values per workflow, step-by-step, reproducible across language/theme axes. Special cases to script explicitly (CONTEXT specifics): storage account lowercase/no-separator behavior (Phase 14 D-01) and Autopilot 15-char budget behavior. No codebase analog — see RESEARCH substitute below.

## Shared Patterns

### Gate execution order (Linux)
**Source:** `package.json` scripts + 12-SMOKE-MATRIX.md lines 8–82
**Apply to:** All gate evidence in `15-VERIFICATION.md`
```json
"build": "tsc -b && vite build",
"lint": "oxlint",
"check:tokens": "node scripts/check-tokens.mjs",
"pretest": "npm run check:tokens",
"test": "vitest run"
```
Sequence: `npm ci` FIRST (Windows-native node_modules constraint) → `npm run check:tokens` (auto-runs via pretest anyway) → `npx vitest run` → `npm run build` → `npm run lint`. Record exit codes + verbatim output. Known flake to annotate honestly: WSL worker-startup timeouts occasionally hit files before they run (14-REVIEW-FIX.md §Verification) — rerun affected file in isolation rather than hiding it. Current baseline: 143 tests green (D-13 allows growth from new assertions).

### Honest-FAIL recording
**Source:** 12-SMOKE-MATRIX.md lines 142–167; PROJECT.md D-10/D-12 precedents
**Apply to:** smoke matrix section of `15-VERIFICATION.md`
Agent scripts the steps; user executes and judges; agent records results verbatim including FAILs (D-08: subjective smoke FAILs are triaged with user, never silently deferred or unauthorized-fixed; mechanical FAILs are fixed in-phase).

### Locale key addition (only if sweep fixes require new strings)
**Source:** 14-REVIEW-FIX.md WR-01 fix; `src/i18n.ts:3–4`
**Apply to:** any fix touching user-visible text
Add key to BOTH `en.json` and `fr.json` under the same block, keep hardcoded English fallback in the `tl()` call consistent, then re-run the flat-key parity one-liner (must stay equal both directions; post-WR-01 baseline 492 = 492, `data.*` block 398 keys).

## No Analog Found

| Item | Role | Reason | Planner guidance |
|------|------|--------|------------------|
| Dual smoke-matrix script (6 workflows × EN/FR × dark/light) | process artifact | First bilingual×theme matrix; Phase 12 ran theme-only (9 workflows × dark/light). Table FORMAT analog exists (above), but workflow scripting has no prior example | Use CONTEXT D-01..D-04 + roadmap deliverable 15b; pick one representative convention per workflow from the on-disk catalog (45 rules verified present); specify literal segment values so every run is identical across axes |
| Zero-code-diff proof procedure | verification step | No prior milestone closed with a tag-diff proof | Implement directly from D-05/D-06; pre-declare WR-04..WR-06 sweep diffs as justified exceptions in the report |

## Metadata

**Analog search scope:** `src/lib/`, `src/hooks/`, `src/components/`, `src/rules/{azure,intune}/`, `src/locales/`, `src/i18n.ts`, `.planning/milestones/v1.4-phases/12-theme-switching-verification/`, `.planning/phases/14-*/14-REVIEW{,-FIX}.md`
**Files scanned:** ~30 (7 read in full/targeted, rest via glob/grep)
**Pattern extraction date:** 2026-08-25
