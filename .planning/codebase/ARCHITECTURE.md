---
type: codebase-doc
doc: architecture
last_updated: 2026-08-19
last_mapped_commit: c37becaef560ef8eea72992c340c4ac27fd8c0f8
---
<!-- refreshed: 2026-08-19 -->
# Architecture

**Analysis Date:** 2026-08-19

## System Overview

Name Codex is a **zero-backend, data-driven single-page application**. React renders a naming-convention builder; every convention, segment value list, and numbering generator lives in plain JSON that is **eagerly bundled at build time** via Vite's `import.meta.glob`. There is no network layer, no router, no state library, and no server — the production build in `dist/` is a fully static site deployed to GitHub Pages.

```text
┌──────────────────────────────────────────────────────────────┐
│                    Presentation Layer (JSX)                    │
│        src/App.tsx — App (single root component),             │
│        InfoIcon, CardTitle, renderSegmentEditor,              │
│        renderEditableSuggestions                              │
├───────────────────┬──────────────────────┬────────────────────┤
│  Configure card   │  Segment Builder      │  Live Preview      │
│  (category nav +  │  (pattern tokens +    │  (name, actions,   │
│  object/pattern   │  builder rows,        │  score, markdown,  │
│  selectors)       │  add/remove/reorder)  │  reference,        │
│                   │                       │  favorites/history)│
└─────────┬─────────┴───────────┬───────────┴─────────┬──────────┘
          │                     │                     │
          ▼                     ▼                     ▼
┌──────────────────────────────────────────────────────────────┐
│              Application Logic (pure functions)                │
│  src/App.tsx — pattern parsing (parsePattern), segment         │
│  resolution (valuesForField / optionsForSegment), name         │
│  generation (normalizeName), validation (validateName,         │
│  governanceScore), markdown/reference builders                 │
└────────────────────────────┬─────────────────────────────────┘
                             │
                             ▼
┌──────────────────────────────────────────────────────────────┐
│                     Data Layer (JSON, bundled)                 │
│  src/rules/**/*.json              src/data/segment-catalog.json│
│  src/data/segments/**/*.json      src/data/validation-rules.json│
│  src/data/generators/*.json       src/data/ca-numbering-ranges │
└──────────────────────────────────────────────────────────────┘
```

## Component Responsibilities

| Component | Responsibility | File |
|-----------|----------------|------|
| App (root component) | All UI state, effects, event handlers, JSX layout | `src/App.tsx` |
| Convention rule JSON | One naming standard: pattern, fields, builder config, validation | `src/rules/**/*.json` (25 files) |
| Segment libraries | Value lists (+ descriptions) referenced by `library` field | `src/data/segments/**/*.json` (38 files) |
| Segment catalog | Shared field definitions (label, type, tip) merged into rule fields | `src/data/segment-catalog.json` |
| Generators | Programmatic value sequences (`sequence`, `caPolicyId`) | `src/data/generators/*.json` (3 files) |
| Validation rules | Global/per-category/per-name validation overrides | `src/data/validation-rules.json` |
| CA numbering ranges | Persona → prefix/digit-range map for policy IDs | `src/data/ca-numbering-ranges.json` |
| Type definitions | `NamingConvention`, `NamingField`, builder/validation configs | `src/types/Rule.ts` |
| Bootstrap | React 19 `createRoot` + StrictMode mount | `src/main.tsx` |

## Pattern Overview

**Overall:** Single-module data-driven SPA — one monolithic React component whose entire behavior is driven by JSON configuration. The code is a *generic engine*; all domain knowledge (Azure, Intune, Conditional Access naming) lives in data files.

**Key Characteristics:**
- **Data-driven engine**: adding a JSON rule under `src/rules/` is enough to render a new convention — no TypeScript changes required (see `src/rules/azure/azure-virtual-machine.json`).
- **Single-file application**: `src/App.tsx` (1572 lines) holds module-level data loading, ~25 pure helper functions, and the entire component tree. No other `.tsx` files exist.
- **Eager bundling**: `import.meta.glob(..., { eager: true })` embeds all JSON at build time — there is no runtime data fetching.
- **Hybrid validation**: three sources combine — per-rule `validation` block, global `validation-rules.json`, and hard-coded runtime checks in `validateName()`.
- **Local-only persistence**: favorites, history, and per-category last selection live in `localStorage` under versioned keys (`name-codex-history-v11-6`, etc.).

## Layers

**Presentation Layer:**
- Purpose: Render the category navigation, configure selectors, segment builder rows, live preview, governance score, markdown docs, and reference dictionary
- Location: `src/App.tsx` (all JSX, lines ~1269–1572 for the shell; editor renderers at ~979–1259)
- Contains: `App`, `InfoIcon` (`src/App.tsx:491`), `CardTitle` (`src/App.tsx:532`), `renderSegmentEditor` (`src/App.tsx:1040`), `renderEditableSuggestions` (`src/App.tsx:979`)
- Depends on: Application logic functions in the same file; icons from `lucide-react` (`src/App.tsx:2`) and local SVGs in `src/assets/icons/`
- Used by: `src/main.tsx` (the only consumer)

**Application Logic Layer:**
- Purpose: Pure, testable functions that transform convention data + builder state into names, options, and validation results
- Location: `src/App.tsx` (module-scope functions, lines ~75–489)
- Contains: pattern parsing (`parsePattern` at `src/App.tsx:276`), segment resolution (`valuesForField` at `src/App.tsx:350`, `optionsForSegment` at `src/App.tsx:219`), generator expansion (`generateValues` at `src/App.tsx:145`), name normalization (`normalizeName` at `src/App.tsx:448`), validation (`validateName` at `src/App.tsx:462`, `governanceScore` at `src/App.tsx:486`), builder state creation (`buildSegments` at `src/App.tsx:400`)
- Depends on: Data layer (JSON modules loaded via `import.meta.glob` at `src/App.tsx:65-73` and `248-251`) and types from `src/types/Rule.ts`
- Used by: Presentation Layer (same file)

**Data Layer:**
- Purpose: The source of truth for every naming convention, segment value, generator, and validation rule
- Location: `src/rules/` and `src/data/`
- Contains: Rule JSONs (7 categories), segment library JSONs (5 categories + `core`), 3 generator JSONs, and 3 global config JSONs
- Depends on: Nothing (static data; schemas loosely implied by `src/types/Rule.ts`)
- Used by: Application Logic Layer via eager `import.meta.glob`

## Data Flow

### Primary Request Path (user selects convention → name generated)

1. **Module load** — `import.meta.glob` eagerly bundles all rule/segment/generator JSON into `segmentModules`, `generatorModules`, `ruleModules`; `allConventions` is derived and sorted (`src/App.tsx:65-73`, `248-255`)
2. **Category selection** — clicking a nav item calls `setSelectedCategory`; an effect restores the last-selected object for that category from `localStorage` (`src/App.tsx:645-654`)
3. **Convention derivation** — `selectedConvention` is computed by `find` over `conventionsForCategory`, with fallbacks to first filtered / first category / first global item (`src/App.tsx:578-582`); a pattern variant is selected if present (`src/App.tsx:586-588`, effect at `630-643`)
4. **Builder rebuild** — an effect calls `buildSegments()` which resolves each pattern segment to a field (rule field merged over catalog field via `fieldByName`, `src/App.tsx:336`), computes a default value, and produces `BuilderSegment[]` (`src/App.tsx:670-685`, `400-423`)
5. **Option resolution** — each builder row calls `optionsForSegment()` → `valuesForField()` which resolves values in priority order: inline `field.values` → `field.library` JSON → `field.generator` expansion; then applies `allowedValues`, `allowedValuesByField` (conditional values), and CA persona-based ranges (`src/App.tsx:219-245`, `350-377`)
6. **Name generation** — `activePattern` is tokenized by `parsePattern()`; each segment token is replaced with the segment value (uppercased), literals stay verbatim, separator runs are collapsed, then `normalizeName()` applies lowercase/char-removal/maxLength from validation rules (`src/App.tsx:708-738`, `448-460`)
7. **Validation & score** — `validateName()` builds a checklist (non-empty, all segments filled, length, allowed characters, locked/recommended segment presence); `governanceScore()` computes the percentage (`src/App.tsx:462-489`)
8. **Output actions** — Copy Name / Copy Markdown / Add Favorite / Reset write to the clipboard and versioned `localStorage` keys (`src/App.tsx:947-977`)

### Segment Value Resolution Flow

1. Field has inline `values` → used directly
2. Field has `library` → `getSegmentFile()` finds `src/data/segments/<category>/<name>.json` by case-insensitive name match (`src/App.tsx:79-88`, `357-362`)
3. Field has `generator` → `getGeneratorFile()` finds `src/data/generators/<name>.json`; `type: "sequence"` expands a numbered range, `type: "caPolicyId"` expands persona ranges into prefixed IDs (`src/App.tsx:90-99`, `108-155`)
4. Field has `allowedValuesByField` → options filtered by the current value of a dependent segment (e.g. `IntProfileType` filtered by `OS`, `src/rules/intune/endpoint-security-policy.json:34-39`)
5. Field has `allowedValues` → options filtered to the allowed set (`src/App.tsx:371-374`)

**State Management:**
- All state lives in the `App` component via `useState` (8 state variables, `src/App.tsx:542-548`); derived values use `useMemo`
- Persistence is manual and versioned: `name-codex-history-v11-6`, `name-codex-favorites-v11-6`, `name-codex-last-object-by-category-v11-6` (`src/App.tsx:646, 666, 688-697, 952, 965, 971, 976`)
- Legacy key `name-codex-recent-objects-v11-5` is explicitly removed on mount (`src/App.tsx:697`)
- No external state library, no context, no reducers

## Key Abstractions

**NamingConvention (rule file):**
- Purpose: A single naming standard — category, pattern, fields, builder config, validation
- Examples: `src/rules/azure/azure-virtual-machine.json`, `src/rules/conditional-access/ca-extended-policy.json`, `src/rules/groups/group-m365.json`
- Pattern: JSON object typed by `NamingConvention` in `src/types/Rule.ts:61-79`; supports optional `patterns[]` variants (`src/rules/entra-id/entra-app-registration.json:9-191`)

**NamingField (segment definition):**
- Purpose: Describes one segment of a pattern — where its values come from and how it may be edited
- Examples: inline values, `library`, `generator`, `multiSelect` with `multiExclusions`, `customOnly`, `allowedValuesByField` — see `src/rules/conditional-access/ca-emergency-policy.json:7-66`
- Pattern: Interface in `src/types/Rule.ts:8-27`; shared definitions merged from `src/data/segment-catalog.json` via `fieldByName()` (`src/App.tsx:336-348`)

**BuilderSegment (runtime builder state):**
- Purpose: A concrete segment instance in the builder with a value, UI label, and custom flag
- Example: produced by `buildSegments()` (`src/App.tsx:400-423`), consumed by `renderSegmentEditor()` (`src/App.tsx:1040`)
- Pattern: `{ key, sourceName, label, value, custom }` (`src/App.tsx:58`)

**PatternToken (parsed pattern):**
- Purpose: Splits a pattern string into `literal` and `segment` tokens so literals (e.g. `ENABLEINEMERGENCY`) stay fixed while segments are substituted
- Example: `parsePattern()` at `src/App.tsx:276-292`, consumed for name generation and the dynamic pattern display (`src/App.tsx:708-752`)

**SegmentGenerator (value generator):**
- Purpose: Produces option lists programmatically instead of from a static value list
- Examples: `src/data/generators/ca-policy-id.json` (persona-based `caPolicyId`), `src/data/generators/devsec-policy-id.json` (fixed-prefix `caPolicyId`), sequence-style used via `generateSequence()` (`src/App.tsx:108-123`)
- Pattern: discriminated on `type: "sequence" | "caPolicyId"` (`src/App.tsx:27-56`, `145-155`)

## Entry Points

**HTML shell:**
- Location: `index.html`
- Triggers: Browser load of the deployed site
- Responsibilities: Declares favicons, sets the viewport, mounts `#root`, loads `/src/main.tsx` (`index.html:13-14`)

**React bootstrap:**
- Location: `src/main.tsx`
- Triggers: Module load from `index.html`
- Responsibilities: `createRoot(...).render(<StrictMode><App /></StrictMode>)` (`src/main.tsx:6-9`)

**App component:**
- Location: `src/App.tsx` (`export default function App()`, line 541)
- Triggers: Rendered by `src/main.tsx`
- Responsibilities: Entire application — data loading, state, logic, and UI

## Architectural Constraints

- **Threading:** Single-threaded browser main thread; no web workers, no async server calls
- **Global state:** Module-level singletons created once at load in `src/App.tsx`: `segmentCatalog` (line 61), `validationRules` (line 62), `caNumberingRanges` (line 63), `segmentModules` (line 65), `generatorModules` (line 70), `ruleModules` (line 248), `allConventions` (line 253)
- **Data location constraint:** Only JSON under `src/rules/` and `src/data/` is picked up by `import.meta.glob` — new conventions/segments/generators must be placed there to be bundled
- **Build-time data:** No runtime fetch — data changes require a rebuild (deploy via `npm run build` + GitHub Pages workflow `.github/workflows/deploy.yml`)
- **Static hosting:** `base: './'` in `vite.config.ts` makes the build deployable at any subpath (GitHub Pages)
- **TypeScript strictness:** `tsconfig.app.json` enforces `noUnusedLocals`, `noUnusedParameters`, `erasableSyntaxOnly`, `verbatimModuleSyntax`, `noFallthroughCasesInSwitch` — no enums/namespaces/parameter properties allowed in new code
- **Circular imports:** None — `src/main.tsx` → `src/App.tsx` → `src/types/Rule.ts` is a one-way chain
- **Linting:** `oxlint` via `.oxlintrc.json` (react + typescript + oxc plugins; `react/rules-of-hooks` is an error)

## Anti-Patterns

### Monolithic App.tsx

**What happens:** The entire application — data loading, business logic, UI state, and all JSX — lives in one 1572-line file (`src/App.tsx`). Only two small presentational helpers (`InfoIcon`, `CardTitle`) are extracted.
**Why it's wrong:** Any change — UI, logic, or data plumbing — touches the same file; there is no testability isolation, and hooks/derivations are hard to follow.
**Do this instead:** Split into `src/components/` (renderers), `src/lib/` or `src/engine/` (pure functions like `parsePattern`, `valuesForField`, `validateName`), and `src/hooks/` (localStorage persistence).

### `as any` casts on JSON imports

**What happens:** `const validationRules = validationRulesData as any;` (`src/App.tsx:62`) and `segmentCatalogData as NamingField[]` (line 61) bypass type checking at the data boundary.
**Why it's wrong:** Schema drift in `src/data/validation-rules.json` or the catalog silently compiles; `normalizeName()`/`validateName()` index into it with string keys (`src/App.tsx:449, 463`) with zero compile-time safety.
**Do this instead:** Define interfaces in `src/types/Rule.ts` for the validation/config JSON and cast to those, or validate JSON at load.

### Unstable React keys from `Date.now()`

**What happens:** `buildSegments()` generates keys as `` `${name}-${index}-${Date.now()}` `` (`src/App.tsx:416`), and custom segments use `` `${name}-${Date.now()}-${prev.length}` `` (`src/App.tsx:915`).
**Why it's wrong:** Keys change on every rebuild, forcing full remounts of the builder rows and losing DOM/input state identity.
**Do this instead:** Use a stable counter or the sourceName where uniqueness is guaranteed.

### Unguarded `JSON.parse` of localStorage

**What happens:** `JSON.parse` is called directly on stored values with no try/catch (`src/App.tsx:647, 689-695`).
**Why it's wrong:** A corrupted or hand-edited localStorage value throws during render/effects and crashes the app on startup.
**Do this instead:** Wrap in a `safeParse` helper returning defaults on failure.

## Error Handling

**Strategy:** Defensive fallbacks over explicit errors. The app avoids throwing by falling back to first-available data.

**Patterns:**
- `selectedConvention` falls back through `filteredConventions[0]` → `conventionsForCategory[0]` → `allConventions[0]` (`src/App.tsx:578-582`)
- Empty data renders a dedicated empty state: `"No naming rules found."` (`src/App.tsx:1267`)
- Missing segment files / generators return `undefined` from `getSegmentFile()`/`getGeneratorFile()` and degrade to empty option lists (`src/App.tsx:79-99`)
- Validation results are surfaced as UI checklist items (valid/invalid) rather than exceptions (`src/App.tsx:1483-1489`)
- User action feedback is transient state (`actionFeedback`) auto-cleared after 2s (`src/App.tsx:550-553`)

**Gaps:**
- No error boundaries; no try/catch around clipboard calls (`src/App.tsx:947-959`) or localStorage parsing (see Anti-Patterns)

## Cross-Cutting Concerns

**Logging:** None — no `console` usage anywhere in `src/`
**Validation:** Three-layer hybrid — rule-level `validation` blocks, global `src/data/validation-rules.json`, and runtime checks in `validateName()` (`src/App.tsx:462-484`)
**Authentication:** None — static public site
**Persistence:** Versioned `localStorage` keys; legacy key migration on mount (`src/App.tsx:697`)

---

*Architecture analysis: 2026-08-19*
