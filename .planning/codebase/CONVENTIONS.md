---
type: conventions
last_updated: 2026-08-19
last_mapped_commit: c37becaef560ef8eea72992c340c4ac27fd8c0f8
---

# Coding Conventions

**Analysis Date:** 2026-08-19

## Overview

This is a small React 19 + TypeScript + Vite SPA with no backend. The entire application lives in three TypeScript files: `src/main.tsx` (entry), `src/App.tsx` (all UI + domain logic, 1572 lines), and `src/types/Rule.ts` (data schema types). Domain data is plain JSON loaded via `import.meta.glob` (`src/App.tsx:65-73, 248-251`).

## Naming Patterns

**Files:**
- kebab-case for JSON data: `src/rules/conditional-access/ca-extended-policy.json`, `src/data/segments/core/region.json`, `src/data/generators/ca-policy-id.json`
- PascalCase for component files: `src/App.tsx`
- lowercase for entry point: `src/main.tsx`
- Type definitions in a single file named after the domain: `src/types/Rule.ts`
- CSS files mirror component names: `src/App.css`, `src/index.css`

**Functions:**
- camelCase for all functions: `buildSegments`, `normalizeName`, `validateName`, `governanceScore`, `optionsForSegment`, `valuesForField`, `moduleKeyFromName` (`src/App.tsx`)
- Module-scope logic uses `function` declarations: `function getSegmentFile(libraryName: string): SegmentFile | undefined` (`src/App.tsx:79`)
- Event handlers and closures inside the `App` component use arrow functions assigned to `const`: `const updateSegmentValue = (key: string, value: string) => setBuilderSegments(...)` (`src/App.tsx:810`), `const copyName = async () => {...}` (`src/App.tsx:947`)
- Single-purpose predicate helpers prefixed `is*`: `isLocked`, `isRecommended`, `isFixedFirst`, `isFixedLast`, `isDropdownValue` (`src/App.tsx:426-446, 257`)
- Lookup helpers prefixed `get*`: `getSegmentFile`, `getGeneratorFile`, `getCategoryIcon`, `getCategoryClass` (`src/App.tsx:79-98, 294-334`)

**Variables:**
- camelCase for all local state and variables: `builderSegments`, `selectedCategory`, `generatedName`, `validationResults`
- React state setters follow the `set<Name>` convention: `setBuilderSegments`, `setSelectedCategory`, `setObjectSearch` (`src/App.tsx:542-548`)
- Module-level data constants use camelCase (not UPPER_SNAKE): `segmentCatalog`, `validationRules`, `caNumberingRanges`, `segmentModules`, `generatorModules`, `allConventions` (`src/App.tsx:61-73, 253`)
- Handlers for copy/reset actions use `copy<Thing>` / `resetBuilder` naming: `copyName`, `copyMarkdown`, `addFavorite`, `clearHistory`, `clearFavorites` (`src/App.tsx:947-977`)

**Types:**
- PascalCase for all types and interfaces
- Exportable schema types live in `src/types/Rule.ts`: `DropdownValue`, `NamingField`, `NamingBuilderConfig`, `NamingValidationConfig`, `NamingPatternOption`, `NamingConvention` — each field is declared with an optional `?` or union type and inline string literals for enums (e.g. `type?: "text" | "dropdown"` at `src/types/Rule.ts:11`)
- Types used only inside `src/App.tsx` are declared locally with the `type` keyword, never exported: `SegmentValue`, `SegmentFile`, `SequenceGenerator`, `CaPolicyRange`, `CaPolicyIdGenerator`, `SegmentGenerator`, `BuilderSegment`, `ValidationResult`, `PatternToken`, `BuildSegmentOptions` (`src/App.tsx:17-58, 274, 393-398`)
- Type aliases for unions: `type NamingFieldOption = string | DropdownValue` (`src/types/Rule.ts:6`), `type SegmentGenerator = SequenceGenerator | CaPolicyIdGenerator` (`src/App.tsx:56`)

## Code Style

**Formatting:**
- No Prettier config, no `.editorconfig`, no format script — formatting is manual and by convention
- 2-space indentation throughout all files
- Line width is not enforced; several lines exceed 100 characters (e.g. `src/App.tsx:467`, `src/App.tsx:1544`)
- Semicolons: **used** in `src/App.tsx` and `src/types/Rule.ts`; **not used** in `src/main.tsx` and `vite.config.ts` (inconsistent, not enforced by oxlint)
- Quotes: double quotes in `src/App.tsx` and `src/types/Rule.ts`; single quotes in `src/main.tsx` and `vite.config.ts` (inconsistent, not enforced)

**Linting:**
- oxlint via `.oxlintrc.json` — enables `react`, `typescript`, `oxc` plugins
- Enforced rules: `react/rules-of-hooks: "error"`, `react/only-export-components: ["warn", { "allowConstantExport": true }]`
- Run with `npm run lint` (`package.json:9`); **no lint step in CI** (`.github/workflows/deploy.yml` only builds)

**TypeScript strictness** (`tsconfig.app.json`):
- `verbatimModuleSyntax: true` — requires `import type` for type-only imports (see `src/App.tsx:11`)
- `noUnusedLocals` and `noUnusedParameters` — unused code fails `npm run build` (`tsc -b`)
- `erasableSyntaxOnly: true` — no enums or namespaces; use union types
- `noFallthroughCasesInSwitch: true`
- `moduleResolution: "bundler"`, `allowImportingTsExtensions: true` — imports use explicit `.tsx`/`.ts` extensions: `import App from './App.tsx'` (`src/main.tsx:4`)
- `resolveJsonModule: true` — JSON files are imported as modules (`src/App.tsx:12-14`)

## Import Organization

**Order observed in `src/App.tsx`:**
1. React hooks: `import { useEffect, useMemo, useRef, useState } from "react"` (`src/App.tsx:1`)
2. Icon library: `import { ArrowUp, ArrowDown, X, Pin, Lock, Star } from "lucide-react"` (`src/App.tsx:2`)
3. Static assets (SVGs): `import logo from "./assets/name-codex.svg"` — one import per icon (`src/App.tsx:3-10`)
4. Type-only imports with `import type`: `import type { DropdownValue, NamingConvention, NamingField, NamingFieldOption } from "./types/Rule"` (`src/App.tsx:11`)
5. JSON data: `import segmentCatalogData from "./data/segment-catalog.json"` (`src/App.tsx:12-14`)
6. Global CSS last: `import "./App.css"` (`src/App.tsx:15`)

**Path Aliases:**
- None. All imports are relative paths (`./`, `../`); no `paths` in `tsconfig.app.json`

## Error Handling

**Patterns:**
- **No try/catch anywhere** — zero error boundaries, no `throw` statements in application code
- Guard-clause early returns are the dominant pattern: `if (!field) return "";` (`src/App.tsx:381`), `if (!range) return [];` (`src/App.tsx:184`), `if (!generatedName) return;` (`src/App.tsx:948`), `if (!name) return;` (`src/App.tsx:905`)
- Null-safety via optional chaining `?.` and nullish coalescing `??` throughout: `field?.tip && <InfoIcon ...>` (`src/App.tsx:1111`), `selectedConvention.builder?.separator ?? "-"` (`src/App.tsx:706`)
- Fallback chains with `??` for derived values: `selectedPattern?.fields ?? selectedConvention.fields ?? []` (`src/App.tsx:594-600`)
- Empty-array guards before `.map`/`.filter` in JSX: `{referenceEntries.length === 0 ? <p>...</p> : (...)}` (`src/App.tsx:1505`)
- User feedback for invalid actions uses a string-typed `actionFeedback` state instead of exceptions: `showFeedback("fixed-first")` (`src/App.tsx:843`)
- Async clipboard calls are awaited without error handling: `await navigator.clipboard.writeText(generatedName)` (`src/App.tsx:949`)

## Logging

**Framework:** None — no `console.*` calls anywhere in `src/`, no logging library

**Patterns:**
- Do not add logging; user-visible feedback is the only diagnostics channel (`actionFeedback` state in `src/App.tsx:548-553`)

## Comments

**When to Comment:**
- Never — the codebase contains zero comments, zero TODO/FIXME markers. Intent is expressed via descriptive function and variable names
- The single exception is `vite.config.ts:4`: `// https://vite.dev/config/` (auto-generated template comment)

**JSDoc/TSDoc:**
- Not used anywhere

## Function Design

**Size:**
- Helpers are small and single-purpose (typically 5-30 lines): `generateSequence` (`src/App.tsx:108-123`), `normalizeSegmentValues` (`src/App.tsx:101-106`)
- The `App` component itself is very large (~1000 lines of JSX and handlers, `src/App.tsx:541-1572`); render helpers are extracted as inner functions: `renderEditableSuggestions` (`src/App.tsx:979`), `renderSegmentEditor` (`src/App.tsx:1040`)

**Parameters:**
- Plain positional parameters, no options objects except where options are genuinely additive: `buildSegments(convention, options?: BuildSegmentOptions)` (`src/App.tsx:400-403`)
- Convention object is always passed explicitly (no module-level mutable singleton access inside helpers): `validateName(name, convention, segments)` (`src/App.tsx:462`)

**Return Values:**
- Helpers return `undefined` for "not found" rather than throwing: `getSegmentFile(libraryName: string): SegmentFile | undefined` (`src/App.tsx:79`)
- Empty collection results return `[]`: `return [];` (`src/App.tsx:154, 368`)
- Boolean predicates return plain `boolean`: `isLocked(...) { return convention.builder?.lockedSegments?.includes(name) ?? false; }` (`src/App.tsx:426-428`)

## Module Design

**Exports:**
- Only one default export in the entire codebase: `export default function App()` (`src/App.tsx:541`)
- `src/types/Rule.ts` exports all its interfaces (no default): `export interface NamingField {...}` (`src/types/Rule.ts:8`)
- `src/main.tsx` exports nothing
- Everything else in `src/App.tsx` is module-private (types and functions are deliberately not exported)

**Barrel Files:**
- None; no `index.ts` re-export files exist

## Data-Driven JSON Conventions

The domain is entirely JSON-driven. Adding a naming standard means adding/editing JSON, not code (`README.md:44`):

**Rule files** (`src/rules/<category>/*.json`) — schema defined by `NamingConvention` in `src/types/Rule.ts`:
- `id`: kebab-case slug (`"ca-extended-policy"`)
- `category`: one of Azure / Entra ID / Exchange / Groups / Intune / Conditional Access / Conditional Access Policy / Defender / Defender for M365 (drives icons via `getCategoryIcon`, `src/App.tsx:294-308`)
- `pattern`: template with `[SegmentName]` tokens, e.g. `"[PolicyId]-[CA-Persona]-[CA-Applications]-[CA-Platforms]-[CA-Conditions]-[CA-Controls]"`
- `fields[]`: segment descriptors referencing shared libraries (`"library": "conditional-access/ca-persona"`), generators (`"generator": "ca-policy-id"`), or inline `values`/`defaultValue`/`allowedValues`/`examples`
- `builder`: `separator`, `defaultSegments`, `lockedSegments`, `recommendedSegments`, `fixedFirstSegments`, `fixedLastSegments`
- `validation`: `maxLength`, `allowedPattern`, `requireLockedSegments`, `requireRecommendedSegments`

**Segment libraries** (`src/data/segments/**/*.json`): `{ "name": string, "values": [{ "value": string, "description": string }] }` — loaded via `import.meta.glob("./data/segments/**/*.json")` (`src/App.tsx:65-68`)

**Generators** (`src/data/generators/*.json`): discriminated on `"type"` — `"sequence"` (`start`/`end`/`padding`) or `"caPolicyId"` (`prefix`/`digits`/`defaultNumber`/`personaRanges`) — dispatched by `generateValues` (`src/App.tsx:145-155`)

**Shared catalog** (`src/data/segment-catalog.json`): array of reusable `NamingField` definitions; `fieldByName` merges catalog field with convention override: `{ ...(catalogField ?? {}), ...(conventionField ?? {}) }` (`src/App.tsx:336-348`)

**Validation rules** (`src/data/validation-rules.json`): keyed by `category → convention name`, with a `default` fallback; `normalizeName`/`validateName` look up `validationRules?.[category]?.[name] ?? convention.validation ?? validationRules.default` (`src/App.tsx:449, 463`)

## JSX & Component Conventions

- Components are plain functions, no class components: `function InfoIcon({ text }: { text: string })` (`src/App.tsx:491`), `function CardTitle({ title, info }: {...})` (`src/App.tsx:532`)
- Props typed inline with destructuring + inline object type
- Hooks: `useState`, `useMemo`, `useEffect`, `useRef` — **`useCallback` is never used** (all handlers are recreated each render)
- `useEffect` cleanup functions used for event listeners: scroll listener (`src/App.tsx:618-628`), pointer/keyboard listeners (`src/App.tsx:495-511`)
- All `<button>` elements include `type="button"` (prevents form submission)
- Accessibility attributes used on interactive elements: `aria-label`, `aria-expanded`, `aria-pressed`, `role="tooltip"` (`src/App.tsx:520-527, 1147-1155`)
- Conditional rendering uses `&&` and ternary expressions, including nested ternaries for status classing (`src/App.tsx:1061-1071`)

## CSS Conventions

- Plain CSS files (`src/App.css` 1327 lines, `src/index.css` 5 lines), no preprocessor, no CSS modules, no Tailwind
- Class names: kebab-case, block-`element` style (BEM-flavored): `app-shell`, `nav-panel`, `brand-card`, `builder-row`, `builder-handle`, `builder-editor`, `builder-actions` (`src/App.tsx:1270-1256`)
- State variants as modifier classes appended via template strings: `` className={`builder-row ${statusClass}`} `` (`src/App.tsx:1077`), `` className={`custom-dropdown-editor ${isCustomValue ? "custom-mode" : "preset-mode"}`} `` (`src/App.tsx:992-994`)
- Design tokens as CSS custom properties in `:root` (`src/App.css:1-21`): `--bg`, `--panel`, `--border`, `--text`, `--muted`, `--accent`, `--success`, `--warning`, `--shadow` — always reference tokens, never hardcode colors
- Dark theme only, via `color-scheme: dark` and `--bg: #090d18`

## Persistence Conventions

- Browser state persisted to `localStorage` with versioned keys: `name-codex-history-v11-6`, `name-codex-favorites-v11-6`, `name-codex-last-object-by-category-v11-6` (`src/App.tsx:646-697`)
- Old keys are cleaned up explicitly: `localStorage.removeItem("name-codex-recent-objects-v11-5")` (`src/App.tsx:697`)
- Version bump the key suffix (e.g. `v11-6` → `v12-0`) when the stored shape changes

---

*Convention analysis: 2026-08-19*