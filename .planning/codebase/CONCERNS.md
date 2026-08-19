---
type: codebase-doc
doc: concerns
last_updated: 2026-08-19
last_mapped_commit: c37becaef560ef8eea72992c340c4ac27fd8c0f8
---
# Codebase Concerns

**Analysis Date:** 2026-08-19

## Tech Debt

### Monolithic `App.tsx` (1572 lines)

- **Issue:** All application logic and UI live in a single component file. `src/App.tsx` contains the root `App` component, 20+ module-level helper functions (pattern parsing, segment resolution, name generation, validation), and 3 sub-components (`InfoIcon`, `CardTitle`, `renderSegmentEditor`, `renderEditableSuggestions`) with no separate components, hooks, or utils modules.
- **Files:** `src/App.tsx`
- **Impact:** Hard to test, review, or modify in isolation. Every change risks unrelated regressions. The `useState`/`useEffect` cluster (lines 541-698) is tightly coupled to render logic.
- **Fix approach:** Extract pure logic (pattern parsing, validation, segment generation) into `src/lib/` modules with unit tests; extract UI sections (builder row, reference card, score card) into `src/components/`. The data-layer functions (`getSegmentFile`, `getGeneratorFile`, `valuesForField`) are already pure and ready to move.

### `as any` type bypass for validation rules

- **Issue:** `const validationRules = validationRulesData as any;` defeats TypeScript checking for the entire validation config; `normalizeName` and `validateName` then consume untyped `rule` objects with optional property access.
- **Files:** `src/App.tsx:62`, `src/App.tsx:448-460`, `src/App.tsx:462-484`
- **Impact:** A typo in `src/data/validation-rules.json` (e.g. `allowedPatern`) silently disables validation instead of failing at build time.
- **Fix approach:** Define a `ValidationRule` interface in `src/types/Rule.ts` and cast `validationRulesData` to a typed structure; add a dev-time JSON schema check.

### Dead configuration in the data layer

- **Issue:** Several declared config fields are never consumed by the app:
  - `requireLockedSegments` / `requireRecommendedSegments` — declared in `src/types/Rule.ts:42-43`, set in **24 rule files**, never read anywhere in `src/App.tsx`.
  - `policyExamples` — declared in `src/types/Rule.ts:74`, read at `src/App.tsx:702-703`, but **no rule file** sets it; the lookup always falls back to pattern examples.
  - The `"segments"` top-level block in `src/data/validation-rules.json` (Region, Location, Environment, Instance, OS, PolicyId rules) is never applied — `App.tsx` only looks up `validationRules?.[category]?.[name]`, and no rule has category `"segments"`. Segment-level validation (e.g. Instance `^\d{3}$`, PolicyId `^CA\d+$`) is silently unenforced.
- **Files:** `src/data/validation-rules.json:7-39`, `src/types/Rule.ts`, `src/App.tsx:449`, `src/App.tsx:463`
- **Impact:** Misleading config: authors believe validation is enforced when it isn't.
- **Fix approach:** Either wire `requireLockedSegments`/`requireRecommendedSegments` into `validateName`, implement segment-level rule lookup, or delete the dead config.

### Dead "Conditional Access Policy" category branches

- **Issue:** `src/App.tsx:1422` and `src/App.tsx:1441` branch on `selectedConvention.category === "Conditional Access Policy"`, but every CA rule uses category `"Conditional Access"` (see `src/rules/conditional-access/ca-extended-policy.json:3`, `ca-emergency-policy.json:3`). The title switch and inline example block never trigger.
- **Files:** `src/App.tsx:302`, `src/App.tsx:328`, `src/App.tsx:1422`, `src/App.tsx:1441`
- **Impact:** Dead UI branches; category string appears in 4 places (2 of them the `getCategoryIcon`/`getCategoryClass` maps) and can drift from actual rule data.
- **Fix approach:** Remove the unused category branches or align rule categories to it; derive category metadata from the rule files instead of hardcoding.

### Unused dependency and leftover template assets

- **Issue:** `@fluentui/react-icons` is declared in `package.json` dependencies but never imported anywhere in `src/`. `src/assets/vite.svg`, `src/assets/react.svg`, and `src/assets/hero.png` are committed but unreferenced (Vite template leftovers).
- **Files:** `package.json:13`, `src/assets/vite.svg`, `src/assets/react.svg`, `src/assets/hero.png`
- **Impact:** Larger install and repo bloat; confusing for new contributors.
- **Fix approach:** Remove the dependency and delete the unused assets.

### localStorage version-key sprawl

- **Issue:** Storage keys are hardcoded with a manual version suffix `-v11-6` in 8 places (`src/App.tsx:646, 652, 666, 688, 691, 694, 952, 965`). Only one legacy key is cleaned up (`name-codex-recent-objects-v11-5` at `src/App.tsx:697`); other stale keys accumulate in users' browsers across releases.
- **Impact:** Key-version bumps require touching every call site; stale data lingers.
- **Fix approach:** Centralize storage access in a small `src/lib/storage.ts` module with a single versioned namespace.

### Unreleased versioning

- **Issue:** `package.json` version is `0.0.0` and has never been bumped; no tags or release process.
- **Files:** `package.json:4`
- **Impact:** No way to correlate deployed builds to source revisions.
- **Fix approach:** Introduce semantic versioning tied to git tags, and surface the version in the footer (`src/App.tsx:1568`).

## Known Bugs

### Convention Reference lists wrong policy IDs for EM/DEVSEC policies

- **Symptoms:** For `Conditional Access Policy - Emergency` and Intune `Endpoint Security Policy`, the Convention Reference card lists `CA0xx`–`CA10xx` IDs instead of `EMxxx` / `DEVSECxxx`.
- **Cause:** `generateCaPolicyIds` (`src/App.tsx:125-143`) falls back to the global `caNumberingRanges` (CA-prefixed, `src/data/ca-numbering-ranges.json`) whenever the generator has no `ranges` property. `src/data/generators/ca-emergency-policy-id.json` and `src/data/generators/devsec-policy-id.json` define `prefix`/`digits` instead, which are only honored by `caPolicyIdFallbackRange` in the editor path (`src/App.tsx:164-177`), not by `optionsForSegment`/`referenceEntries`.
- **Files:** `src/App.tsx:125-143`, `src/App.tsx:793-808`, `src/data/generators/ca-emergency-policy-id.json`, `src/data/generators/devsec-policy-id.json`, `src/rules/conditional-access/ca-emergency-policy.json:12`, `src/rules/intune/endpoint-security-policy.json:12`
- **Trigger:** Open either rule and expand the Convention Reference card.
- **Workaround:** None for the reference card; the generated name itself is correct.

### App crashes on corrupt localStorage data

- **Symptoms:** Blank app on load if `localStorage` holds malformed JSON for any of the three `-v11-6` keys (e.g. truncated by a previous crash, or an older incompatible shape).
- **Cause:** `JSON.parse` at `src/App.tsx:646-647` and `src/App.tsx:689-695` is unguarded; a `SyntaxError` propagates during the initial render. There is no error boundary (`src/main.tsx` wraps only in `StrictMode`).
- **Files:** `src/App.tsx:646-647`, `src/App.tsx:689-695`, `src/main.tsx`
- **Trigger:** `localStorage.setItem("name-codex-history-v11-6", "{broken")` then reload.
- **Workaround:** Clear site data in the browser.
- **Fix approach:** Wrap reads in try/catch with schema validation; add a React error boundary.

### Clipboard writes can reject unhandled

- **Symptoms:** Unhandled promise rejection (and no copy) when the Clipboard API is unavailable — non-HTTPS deployments, permission denial, or browsers without async clipboard support.
- **Cause:** `await navigator.clipboard.writeText(...)` at `src/App.tsx:949` and `src/App.tsx:957` without try/catch or a `document.execCommand` fallback.
- **Fix approach:** Wrap in try/catch and fall back to a temporary `<textarea>` + `execCommand("copy")`.

### Feedback toast races

- **Symptoms:** Rapid successive actions (e.g. Copy then Reset) cause the first action's 2-second timer to clear the second action's feedback early, or feedback to disappear/reappear out of order.
- **Cause:** `showFeedback` (`src/App.tsx:550-553`) schedules an un-tracked `setTimeout` against the single `actionFeedback` state string; timers are never cleared or sequenced.
- **Files:** `src/App.tsx:550-553`
- **Fix approach:** Store `{ message, id }` and clear the previous timer before scheduling a new one.

### Defender nav items render without icon styling

- **Symptoms:** The "Defender for M365" category icon in the sidebar (`src/App.tsx:1293`) has no background/color treatment compared to other categories.
- **Cause:** `getCategoryIcon` maps "Defender for M365" to `iconDefender` (`src/App.tsx:305`), but `getCategoryClass` has no Defender case (`src/App.tsx:310-334`), and `src/App.css` defines no `.defender-icon` class (only `.azure-icon`, `.entra-icon`, `.exchange-icon`, `.intune-icon`, `.groups-icon`, `.ca-icon` at lines 1207-1227).
- **Fix approach:** Add a `case "Defender for M365": return "defender-icon";` and the corresponding CSS class.

## Security Considerations

### Low overall risk, but no hardening

- **Risk:** The app is fully static (no backend, no network calls, no secrets) — attack surface is minimal. `npm audit` reports 0 vulnerabilities in production dependencies.
- **Mitigations in place:** No `dangerouslySetInnerHTML` usage; generated Markdown is rendered inside a `<pre>` (`src/App.tsx:1497`); CI uses least-privilege GitHub token scopes (`contents: read`, `pages: write`, `id-token: write` in `.github/workflows/deploy.yml`).
- **Recommendations:**
  - `index.html` has no Content-Security-Policy meta tag — add a CSP appropriate for a Vite static build.
  - `localStorage` persistence (`src/App.tsx:646-697`) stores generated names indefinitely with no clear-all control for the user.
  - Rule/segment JSON is bundled client-side; anyone can extract the full naming conventions — acceptable for a public standards tool, but worth being deliberate about.

## Performance Bottlenecks

### Convention Reference builds a ~1100-item list on every render

- **Problem:** `referenceEntries` (`src/App.tsx:793-808`) is recomputed on **every** render, and for any `PolicyId` segment with no persona selected, `optionsForSegment` returns the full generated ID list — 11 ranges × 100 IDs = ~1100 values from `generateCaPolicyIds` (`src/App.tsx:125-143`) — all rendered as `<li>` items in the reference grid.
- **Files:** `src/App.tsx:793-808`, `src/App.tsx:219-245`, `src/App.tsx:125-143`
- **Cause:** No `useMemo` on `referenceEntries`; full-range generation is eager and not limited by the selected persona range.
- **Improvement path:** Memoize `referenceEntries` on `[builderSegments, selectedConvention, activeFields]`; cap the reference list (e.g. first 50 values + note); use the persona-narrowed range when available.

### Linear scans of glob modules in render paths

- **Problem:** `getSegmentFile`/`getGeneratorFile` (`src/App.tsx:79-99`) do `Object.entries(segmentModules).find(...)` string-scanning the module map on every call. These are invoked multiple times per segment per render (`valuesForField`, `optionsForSegment`, `renderSegmentEditor`).
- **Files:** `src/App.tsx:79-99`, `src/App.tsx:350-377`, `src/App.tsx:1040-1042`
- **Cause:** Module map keyed by full path; lookup is a linear find with `toLowerCase()` allocation per entry.
- **Improvement path:** Build a `Map` keyed by normalized module name once at module scope.

### Eager bundling of all JSON data

- **Problem:** `import.meta.glob(..., { eager: true })` at `src/App.tsx:65-73` and `src/App.tsx:248-251` inlines all 21 rule files, 36 segment files, and 3 generators into the initial bundle. Bundle size grows linearly with every convention added.
- **Impact:** Fine today (small JSON), but no code-splitting headroom.
- **Improvement path:** Lazy-load segments/rules by category, or keep eager loading but track bundle size (add `rollup-plugin-visualizer` or a size budget in CI).

### Segment keys force full editor remounts

- **Problem:** `buildSegments` stamps keys with `Date.now()` (`src/App.tsx:416`) and `addCustomSegment` too (`src/App.tsx:915`). Every convention/pattern change or reset regenerates keys, remounting all builder rows — losing input focus and re-running every editor render.
- **Files:** `src/App.tsx:416`, `src/App.tsx:915`
- **Fix approach:** Use stable keys (`sourceName` + index from the convention, or a monotonic counter that only increments, not timestamps).

## Fragile Areas

### Unvalidated JSON data layer

- **Files:** all of `src/rules/**/*.json`, `src/data/segments/**/*.json`, `src/data/generators/*.json`, `src/data/segment-catalog.json`, `src/data/validation-rules.json`
- **Why fragile:** There is no schema validation and no dev-time check that every `library` and `generator` reference resolves. A typo like `"library": "core/regio"` silently produces an empty dropdown (`getSegmentFile` returns `undefined`, `valuesForField` returns `[]`). Fields with `defaultValue` that isn't in `allowedValues` render inconsistent states.
- **Safe modification:** Validate all JSON references with a script or test before shipping; prefer `npm run build` (type-check only covers TS, not JSON) plus manual smoke of each convention.
- **Test coverage:** Zero — see Test Coverage Gaps.

### Case-insensitive module-name matching

- **Why fragile:** `moduleKeyFromName` + `path.toLowerCase().endsWith(...)` (`src/App.tsx:75-99`) couples JSON filenames to `library` string values through lowercase/`endsWith` matching. Two libraries whose names are suffixes of each other (e.g. `membership-type` vs `membership-type-m365`) resolve correctly today only because `endsWith("/segments/...")` anchors the path — any rename of a segment file breaks its rule silently.

### `allowedValuesByField` only honors the first matching dependency

- **Why fragile:** `optionsForSegment` (`src/App.tsx:225-236`) iterates `Object.entries(byField)` and **returns on the first** dependency whose value has a mapping. If a field declares multiple `allowedValuesByField` dependencies, only the first (object order) is ever applied.
- **Files:** `src/App.tsx:225-236`

### Persona-range coupling between JSON files

- **Why fragile:** `ca-policy-id.json` `personaRanges` keys must exactly equal the uppercase values of `ca-persona.json` (`src/App.tsx:215-216`). Adding a new persona value without a corresponding range entry silently falls back to the full 1100-ID list instead of failing loudly.
- **Files:** `src/data/generators/ca-policy-id.json:5-19`, `src/data/segments/conditional-access/ca-persona.json`, `src/App.tsx:202-217`

### Inconsistent CA numbering ranges

- **Why fragile:** The "Global" range in `src/data/ca-numbering-ranges.json:2-9` uses `min: 1` while all other ranges use `min: 0`, so `CA000` is valid everywhere except Global — an off-by-one inconsistency that is undocumented in the UI.
- **Files:** `src/data/ca-numbering-ranges.json`

## Scaling Limits

- **Current capacity:** 21 conventions across 9 categories, ~36 segment libraries — all rendered client-side with no virtualization.
- **Limit:** The Convention Reference card renders every value for every segment of the active convention; generated ranges (up to ~1100 IDs) become unusable above a few hundred items, and eager bundle size grows with each rule file.
- **Scaling path:** Virtualize long lists, cap reference entries, lazy-load rule JSON by category, and add data-validation tooling before the JSON corpus grows further.

## Dependencies at Risk

### oxlint / rolldown / lightningcss platform bindings

- **Risk:** The checked-out `node_modules/` in this workspace contains only `win32-x64-msvc` native bindings (`node_modules/@oxlint/binding-win32-x64-msvc`, `node_modules/rolldown/binding-win32-x64-msvc`, `node_modules/lightningcss-win32-x64-msvc`), installed on Windows. On this Linux machine, both `npm run lint` and `npm run build` fail with `MODULE_NOT_FOUND` for the native binding.
- **Impact:** Local verification on a different OS requires `rm -rf node_modules && npm ci` first. GitHub Actions CI is unaffected (fresh `npm ci` installs linux bindings — the lockfile lists all platform bindings).
- **Files:** `package-lock.json` (contains `@oxlint/binding-linux-x64-gnu`, `@rolldown/binding-linux-x64-gnu`, `lightningcss-linux-x64-gnu`), `package.json:23`
- **Also noted:** `package.json` declares `oxlint ^1.71.0` while the lockfile resolves `1.75.0` — a looser range than intended.

### No lint/test gate in CI

- **Risk:** `.github/workflows/deploy.yml` runs only `npm ci && npm run build && deploy`. `npm run lint` (oxlint) and any future tests are never executed in CI, so lint regressions pass silently.

## Missing Critical Features

- **No tests at all:** `package.json` has no `test` script, and no test framework, config, or test file exists in the repo. All core logic (`parsePattern`, `buildSegments`, `normalizeName`, `validateName`, `generateSequence`, `generateCaPolicyIds`, persona-range mapping) is untested.
- **No error boundary:** any render/parse exception blanks the app (`src/main.tsx`).
- **No data-integrity check:** nothing validates that rule JSON references resolve to real segment files/generators.

## Test Coverage Gaps

- **What's not tested:** Everything. Specifically the highest-risk logic:
  - Pattern parsing and literal handling: `parsePattern`, `patternToSegments`, `dynamicPattern` regeneration (`src/App.tsx:270-292`, `740-752`)
  - Name normalization and validation: `normalizeName`, `validateName`, `governanceScore` (`src/App.tsx:448-489`)
  - Generator logic: `generateSequence`, `generateCaPolicyIds`, `caPolicyIdFallbackRange`, persona-range narrowing (`src/App.tsx:108-217`)
  - Segment resolution: `valuesForField`, `optionsForSegment`, `allowedValuesByField`, multi-select exclusion logic (`src/App.tsx:219-245`, `1115-1137`)
  - Data-layer integrity: every `library`/`generator` reference in all JSON files resolves
- **Files:** `src/App.tsx`, `src/types/Rule.ts`, all JSON under `src/rules/`, `src/data/`
- **Risk:** A one-character JSON typo ships a broken dropdown or silently unenforced validation to all users.
- **Priority:** High — this is the single most valuable investment for the codebase.

---

*Concerns audit: 2026-08-19*