# Phase 12 / v1.4 — Full Milestone Verification Record

**Plan:** 12-03 · **Requirement:** THEME-L-04 · **Executed:** 2026-08-24
**Method:** mechanical gates + PERF criterion re-proofs by executor; dual-theme smoke matrix user-run per D-10.

---

## Mechanical Gates

Environment: Linux worktree checkout — `npm ci` run first per STATE.md environment note (node_modules held Windows-only native bindings). Node v22.23.2.

### Gate 1: `npm run check:tokens`

Exit code **0**. Full output:

```
  [dark] --text-primary on --surface-canvas: 18.54:1 (min 7:1) PASS
  [dark] --text-primary on --surface-raised: 17.74:1 (min 7:1) PASS
  [dark] --text-primary on --surface-panel: 16.43:1 (min 7:1) PASS
  [dark] --text-primary on --surface-overlay: 14.27:1 (min 7:1) PASS
  [dark] --text-secondary on --surface-canvas: 8.05:1 (min 4.5:1) PASS
  [dark] --text-secondary on --surface-raised: 7.70:1 (min 4.5:1) PASS
  [dark] --text-secondary on --surface-panel: 7.13:1 (min 4.5:1) PASS
  [dark] --text-secondary on --surface-overlay: 6.19:1 (min 4.5:1) PASS
  [dark] --text-on-accent on --accent-strong: 4.67:1 (min 4.5:1) PASS
  [light] --text-primary on --surface-canvas: 13.22:1 (min 7:1) PASS
  [light] --text-primary on --surface-raised: 14.89:1 (min 7:1) PASS
  [light] --text-primary on --surface-panel: 16.10:1 (min 7:1) PASS
  [light] --text-primary on --surface-overlay: 15.40:1 (min 7:1) PASS
  [light] --text-secondary on --surface-canvas: 4.92:1 (min 4.5:1) PASS
  [light] --text-secondary on --surface-raised: 5.55:1 (min 4.5:1) PASS
  [light] --text-secondary on --surface-panel: 6.00:1 (min 4.5:1) PASS
  [light] --text-secondary on --surface-overlay: 5.74:1 (min 4.5:1) PASS
  [light] --text-on-accent on --accent-strong: 6.67:1 (min 4.5:1) PASS
TOKEN GATE PASS (literals: 0 violations)
WCAG: 18/18 pairs pass (dark 9/9, light 9/9)
```

Result: ✅ **PASS** — 18/18 contrast pairs (dark 9/9, light 9/9), 0 literal violations. No regressions from toggle CSS (`html.theme-anim *` fade targets token-driven properties only).

### Gate 2: Locale parity one-liner

```
$ node -e "...flat-key count en.json vs fr.json..."
PARITY OK 374=374
```

Result: ✅ **PASS** — 374 = 374 flat keys, no orphans either direction (372 pre-Phase-12 + 2 theme keys from Plan 12-02).

### Gate 3: `npx vitest run`

```
 Test Files  6 passed (6)
      Tests  137 passed (137)
   Start at  13:27:34
   Duration  21.39s
```

Result: ✅ **PASS** — exactly **137 passed**, matching the D-11 lock. No tests added, removed, or adjusted to hit this number (T-12-09).

### Gate 4: `npm run build`

```
✓ built in 6.49s
```

Exit code **0**. Result: ✅ **PASS**

### Gate 5: `npm run lint`

Exit code **0**:

```
vite.config.ts:1:1: warning typescript(triple-slash-reference): ...
scripts/check-tokens.mjs:160:7: warning eslint(no-unused-vars): Variable 'textTokens' ...
scripts/check-tokens.mjs:167:7: warning eslint(no-unused-vars): Variable 'thresholds' ...
src/hooks/useAppState.ts:100:6: warning react-hooks(exhaustive-deps): ...
src/hooks/useAppState.ts:333:49: warning react-hooks(exhaustive-deps): ...
```

Result: ✅ **PASS** — exit 0. All warnings are pre-existing in files untouched by Phase 12 (out of scope; logged to deferred items, not fixed here).

---

## PERF Re-proofs

Method per D-11: criterion-check + grep (same as Phase 7). Evidence pasted verbatim below.

### PERF-01 — Map-indexed module lookups — ✅ PASS

Criterion: the Map-index structure in the reference/module-loading path is still the lookup mechanism (no array find/filter reintroduced in hot paths).

Grep evidence (`grep -n "Map\b" src/lib/data.ts`):

```ts
src/lib/data.ts:26: const segmentModuleMap = new Map<string, SegmentFile>(
src/lib/data.ts:36: const generatorModuleMap = new Map<string, SegmentGenerator>(
src/lib/data.ts:47:   return segmentModuleMap.get(moduleKeyFromName(libraryName));
src/lib/data.ts:51:   return generatorModuleMap.get(moduleKeyFromName(generatorName));
```

Both accessors (`getSegmentFile`, `getGeneratorFile`) resolve via `Map.get()` on module-keyed indexes built once; zero `.find()`/`.filter()` over glob entries remain in these hot paths.

### PERF-02 — memoized / capped / persona-narrowed reference list — ✅ PASS

Criterion: the memoization wrapper and cap constant still wrap the reference-list construction.

Grep evidence (`useAppState.ts`):

```ts
src/hooks/useAppState.ts:314:       const referenceEntries = useMemo(() => builderSegments
src/hooks/useAppState.ts:319:       if (entriesToShow.length > 100 && field?.generator) {
src/hooks/useAppState.ts:320:         entriesToShow = entriesToShow.slice(0, 100);
src/hooks/useAppState.ts:333:     .filter((item) => item.entries.length > 0), [builderSegments, activeFields, i18n.language]);
```

Plus truncation notice intact in `ReferenceCard.tsx:37`:

```tsx
<span>{tl("ui.referenceTruncated", "Showing 100 — select a persona to narrow")}</span>
```

`useMemo` still wraps the whole construction; cap at 100 with persona/generator-narrowing condition unchanged.

### PERF-03 — stable segment keys — ✅ PASS

Criterion: segment rendering keys off stable identifiers; no index-based keys introduced.

Grep evidence (`grep -n "key=" src/components/SegmentEditor.tsx`) — both key sites in the component:

```tsx
src/components/SegmentEditor.tsx:140:                       key={code}
src/components/SegmentEditor.tsx:205:               <option key={optionValue(v)} value={optionValue(v)}>
```

Both keys derive from option value/code identifiers, not array indices. No `key={i}` / `key={index}` anywhere in the file.

---

## Dual-Theme Smoke Matrix

**Executed:** user-run per D-10 (manual interaction with dev server in both OS-appearance modes).
**User verdict:** **approved** (resume-signal received 2026-08-24) — the user ran the full
9-workflow × dark/light dual-theme smoke matrix themselves; **ALL 18 cells PASS**, explicitly
user-approved per D-10/D-12. No FAIL cells reported.

### Results (user-reported)

| # | Workflow | Dark | Light |
|---|----------|------|-------|
| 1 | First visit follows OS preference — no flash of wrong theme | ✅ PASS | ✅ PASS |
| 2 | Toggle click: instant switch, ~175ms fade, target-theme icon swap | ✅ PASS | ✅ PASS |
| 3 | Choice persists across reload and full session restart | ✅ PASS | ✅ PASS |
| 4 | Generate end-to-end; result card/score/copy identical in both themes | ✅ PASS | ✅ PASS |
| 5 | History card: render, copy, clear readable in both themes | ✅ PASS | ✅ PASS |
| 6 | Favorites card: add/view/remove readable in both themes | ✅ PASS | ✅ PASS |
| 7 | NavPanel navigation + ReferenceCard legible, AA colors hold | ✅ PASS | ✅ PASS |
| 8 | Builder/configure cards + segment editing inputs/focus rings visible | ✅ PASS | ✅ PASS |
| 9 | EN↔FR switch with theme toggling: labels swap correctly, layout intact | ✅ PASS | ✅ PASS |

**Cell count:** 18/18 PASS (9 workflows × dark/light) · **FAIL cells:** none

Spot-checks from the verify checklist (keyboard reachability of the toggle via Tab,
Enter/Space activation, accent focus ring, `name-codex-theme-v14-0` localStorage-clear
falling back to OS preference) were covered by the user's blanket approval — no issues reported.

**SMOKE MATRIX: APPROVED** *(user-approved 2026-08-24)*
