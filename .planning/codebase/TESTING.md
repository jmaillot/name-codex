---
type: testing
last_updated: 2026-08-19
last_mapped_commit: c37becaef560ef8eea72992c340c4ac27fd8c0f8
---

# Testing Patterns

**Analysis Date:** 2026-08-19

## Current State: No Tests

**There is no test infrastructure in this repository.** Verified findings:

- `package.json` declares **no test framework** — no vitest, jest, mocha, or testing-library in `dependencies` or `devDependencies` (`package.json:12-26`)
- **No test script** in `package.json` — scripts are only `dev`, `build`, `lint`, `preview` (`package.json:6-11`)
- **No test files** — zero matches for `*.test.*` or `*.spec.*` anywhere in the repo
- **No test config** — no `vitest.config.*`, `jest.config.*`, or coverage config files
- **CI runs no tests** — `.github/workflows/deploy.yml` executes only `npm ci && npm run build` before deploying to GitHub Pages

The only verification gates that exist today:
- `npm run build` — `tsc -b` type-check + `vite build` (`package.json:8`)
- `npm run lint` — oxlint (`package.json:9`)

## Run Commands

Available today:

```bash
npm run build     # Type-check (tsc -b) + production build — the only "verification" gate
npm run lint      # oxlint static analysis
```

## Recommended Test Stack (for when tests are introduced)

This codebase is a Vite + React 19 SPA, so the standard toolchain is:

```bash
# devDependencies to add
npm install -D vitest @testing-library/react @testing-library/user-event @testing-library/jest-dom jsdom
```

```jsonc
// package.json scripts — add:
"test": "vitest run",
"test:watch": "vitest",
"test:coverage": "vitest run --coverage"
```

**Vitest config** — reuse the existing Vite config (no separate `vitest.config.ts` needed; vitest reads `vite.config.ts`). Add a `test` block:

```typescript
// vite.config.ts
export default defineConfig({
  base: './',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test/setup.ts'],
  },
})
```

**Setup file** `src/test/setup.ts`:

```typescript
import '@testing-library/jest-dom/vitest'
```

## Recommended Test File Organization

Follow Vite's convention of **co-located tests** next to the source files:

```
src/
├── App.tsx
├── App.test.tsx            # co-located component tests
├── types/Rule.ts
└── utils/
    ├── naming.ts           # (if logic is extracted from App.tsx)
    └── naming.test.ts
```

- Component tests: `src/App.test.tsx` (co-located with `src/App.tsx`)
- Data/schema tests: `src/data/__tests__/rules.test.ts` or co-located `src/rules/*.test.ts`

## What to Test First (highest-value targets)

The entire domain logic is currently trapped inside `src/App.tsx` as module-private functions. The pure, deterministic functions are the best test targets — they take plain inputs and return plain outputs with no DOM or storage access:

| Function | Location | Behavior worth covering |
|----------|----------|------------------------|
| `patternToSegments` | `src/App.tsx:270-272` | Extracts `[Segment]` tokens; no match → `[]` |
| `parsePattern` | `src/App.tsx:276-292` | Literal/segment token splitting, trailing literals |
| `generateSequence` | `src/App.tsx:108-123` | Range generation, zero-padding, description prefix |
| `generateCaPolicyIds` | `src/App.tsx:125-143` | Per-range expansion, prefix + padded suffix |
| `normalizeName` | `src/App.tsx:448-460` | forceLowercase, removeCharacters, maxLength truncation, fallback chain |
| `validateName` | `src/App.tsx:462-484` | All rules pass/fail, locked/recommended segment checks |
| `governanceScore` | `src/App.tsx:486-489` | 0 when empty, rounding of valid/total ratio |
| `buildSegments` | `src/App.tsx:400-423` | Default segment resolution, fixed values, custom flag, unique keys |
| `optionValue` / `optionLabel` | `src/App.tsx:261-268` | String vs `DropdownValue` handling |

**Refactor prerequisite:** to unit-test these without rendering React, extract them into a separate module (e.g. `src/lib/naming.ts`) and import them into `src/App.tsx`. Currently they are module-private in `src/App.tsx`, so tests would need to render the component (jsdom) and reach them indirectly — or use the JSON fixtures directly.

**JSON data integrity tests** (high value, trivial to write):
- Every `src/rules/**/*.json` file parses and conforms to `NamingConvention` (`src/types/Rule.ts`)
- Every `field.library` reference resolves to a file under `src/data/segments/**/*.json`
- Every `field.generator` reference resolves to a file under `src/data/generators/*.json`
- Every `pattern` token maps to a known segment name
- These catch broken references that currently surface only as empty dropdowns at runtime.

## Mocking

**Framework:** None installed (recommendation: use Vitest's built-in `vi.fn()` / `vi.mock()`)

**What to Mock:**
- `navigator.clipboard.writeText` — used by `copyName` / `copyMarkdown` (`src/App.tsx:947-959`)
- `localStorage` get/set/remove — used by history/favorites persistence (`src/App.tsx:646-697, 952-977`)

**What NOT to Mock:**
- The JSON data files — they are static imports resolved by Vite; test against real fixtures (`src/data/segments/...`, `src/rules/...`)
- `import.meta.glob` module loading — Vite/Vitest handle it natively; assert against the resulting `allConventions` array instead

## Fixtures and Factories

**Existing fixtures:** the entire `src/data/` and `src/rules/` tree IS the fixture set — 20+ rule JSON files and 40+ segment library JSON files:

- Rule fixture example: `src/rules/conditional-access/ca-extended-policy.json`
- Segment library example: `src/data/segments/conditional-access/ca-persona.json`
- Generator example: `src/data/generators/ca-policy-id.json`
- Catalog: `src/data/segment-catalog.json`
- Validation rules: `src/data/validation-rules.json`

**Location for new fixtures:** create `src/test/fixtures/` only for synthetic data (e.g. a minimal fake `NamingConvention` for testing `buildSegments` edge cases without depending on real rule files).

## Coverage

**Requirements:** None enforced — no coverage tooling configured.

**View Coverage (after adding vitest):**

```bash
npm run test:coverage
```

**Suggested starting threshold:** 80% lines for any new `src/lib/` logic modules; do not gate the whole app until `src/App.tsx` is decomposed.

## Test Types

**Unit Tests:**
- Recommended for the pure functions listed above after extraction to `src/lib/naming.ts`
- JSON schema/reference-integrity tests for `src/rules/**` and `src/data/**`

**Component/Integration Tests:**
- `src/App.test.tsx` with `@testing-library/react`: render `<App />`, assert initial convention loads, category switching updates the builder, segment reorder/remove/add interactions, governance score updates
- Note: `src/App.tsx` reads `localStorage` on mount (`src/App.tsx:687-698`) — tests must provide a clean `localStorage` (or clear it in `beforeEach`)

**E2E Tests:**
- Not used, not configured. Out of scope for this client-only SPA (manual verification against the GitHub Pages demo at https://name-codex.jeremymaillot.fr/ is the current practice)

## Common Patterns (when tests are added)

**Async Testing** — clipboard interactions:

```typescript
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'

// stub clipboard before rendering
Object.assign(navigator, { clipboard: { writeText: vi.fn().mockResolvedValue(undefined) } })

it('copies the generated name to the clipboard', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.click(screen.getByRole('button', { name: /copy name/i }))
  await waitFor(() => expect(navigator.clipboard.writeText).toHaveBeenCalled())
})
```

**Error Testing** — empty states:

```typescript
it('shows the empty-state message when no rules match the filter', async () => {
  const user = userEvent.setup()
  render(<App />)
  await user.type(screen.getByPlaceholderText(/filter/i), 'zzzz-no-match')
  expect(screen.getByText(/no naming rules found/i)).toBeInTheDocument()
})
```

## Integration with CI

When tests are introduced, add them to `.github/workflows/deploy.yml` between `npm ci` and the build:

```yaml
- run: npm ci
- run: npm run lint
- run: npm test
- run: npm run build
```

---

*Testing analysis: 2026-08-19*