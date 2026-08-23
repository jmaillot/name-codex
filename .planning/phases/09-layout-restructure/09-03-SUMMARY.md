---
phase: 09-layout-restructure
plan: 03
subsystem: ui
tags: [react, layout, responsive, configure-card, i18n, command-bar, tokens]
requires:
  - phase: 09-01
    provides: CommandBar shell and railCollapsed persisted state
  - phase: 09-02
    provides: Sticky command bar and collapsed rail grid reflow
provides:
  - ConfigureCard reflowed to 2-col (Object Type + Pattern) with filter removed
  - EN/FR locale parity for toggleNav/expandNav/collapseNav/commandBarLabel
  - Responsive single-row bar at 1100px (title ellipsis, search magnifier→expand, overflow)
  - SAFE-01 proof: 137 tests + build + lint + tokens green, PERF intact
affects: [10-polish-verification, layout-restructure, detail-styling]
tech-stack:
  added: []
  patterns: [2-col ConfigureCard grid without filter cell, locale parity via mirrored ui keys, single-row bar responsive with ellipsis + magnifier focus-expand, token-only chrome]
key-files:
  created: []
  modified: [src/components/ConfigureCard.tsx, src/App.tsx, src/App.css, src/locales/en.json, src/locales/fr.json]
key-decisions:
  - "Remove objectSearch/onObjectSearchChange props entirely from ConfigureCard (clean removal + App.tsx stop passing) rather than keeping unused compat props"
  - "Delete orphaned .selector-filter rule and shift object→col1 pattern→col2, keep selector-meta 1/-1 intact"
  - "Insert toggleNav/expandNav/collapseNav/commandBarLabel alphabetically after ui.categories to keep EN/FR insertion point identical and parity diff-friendly"
  - "Use pure-CSS magnifier pattern at 1100px: input 40px default → 200px on :focus (no JS), keeps T-09-06 single-row no-overlay mitigation"
patterns-established:
  - "ConfigureCard is 2-col has-patterns (minmax 220px 1fr + 180px 240px) and single-col no-patterns (minmax 220px 1fr) gap closed"
  - "LangSwitcher floats neutralized via .command-bar .lang-switcher/.command-bar__right .lang-switcher static transparent override"
  - "1100px responsive: title ellipsis max 18ch, center input collapsed magnifier with focus expand, right gap 4px, bar grid auto 1fr auto no-wrap"
requirements-completed: [LAYOUT-01, LAYOUT-02, SAFE-01]
duration: 4min
completed: 2026-08-23
---

# Phase 09 Plan 03: Layout Reflow and Responsive Gate Summary

**ConfigureCard 2-col reflow with CommandBar-owned search, EN/FR toggle/commandBar parity, single-row 1100px chrome (ellipsis + magnifier expand) and SAFE-01 green gate**

## Performance

- **Duration:** 4 min
- **Started:** 2026-08-23T15:49:00Z
- **Completed:** 2026-08-23T15:53:00Z
- **Tasks:** 3
- **Files modified:** 5

## Accomplishments

- Reflowed `ConfigureCard` from 3-col to 2-col: removed `selector-filter` JSX + `objectSearch`/`onObjectSearchChange` props, kept `selector-object`/`selector-pattern` + `selector-meta` row intact, updated `App.tsx` call site, reflown `App.css` grids to `minmax(220px,1fr) minmax(180px,240px)` (has-patterns) and single-col no-patterns with correct column assignments
- Added EN/FR locale parity: `ui.toggleNav`/`ui.expandNav`/`ui.collapseNav`/`ui.commandBarLabel` mirrored with correct FR translations, verified `diff` identical key sets, neutralized `LangSwitcher` fixed pill via `.command-bar .lang-switcher` static transparent override inside bar
- Delivered responsive single-row bar at `1100px`: title `overflow:hidden text-overflow:ellipsis white-space:nowrap max-width 18ch`, search input `40px → 200px on :focus` magnifier behavior with `32px` left padding and icon, right cluster `gap 4px`, bar stays `grid auto 1fr auto` no wrap, sticky preserved
- Proved SAFE-01: `137/137` Vitest pass, `build` + `lint` green, `check:tokens` 0 literals 9/9 contrast, `PERF-01..03` intact (no `src/lib/data.ts`/`segments.ts` diff), `EN/FR` parity, no hardcoded hex in new chrome

## Task Commits

Each task was committed atomically:

1. **Reflow ConfigureCard to 2-col and remove filter cell** - `c6110f5` (feat)
2. **Add EN/FR locale keys and make LangSwitcher bar-native** - `e0692a6` (feat)
3. **Responsive single-row bar and final SAFE-01 proof gate** - `e0b8ed8` (feat)

**Plan metadata:** `pending` (docs: complete plan — orchestrator merges worktree)

_Note: All commits used --no-verify per worktree parallel execution guidance_

## Files Created/Modified

- `src/components/ConfigureCard.tsx` - Removed filter cell and `objectSearch` props, kept object/pattern selects + meta row, now 2-col grid contract
- `src/App.tsx` - Stopped passing `objectSearch`/`onObjectSearchChange` to `ConfigureCard` after prop removal (single wiring point for search → CommandBar only)
- `src/App.css` - Reflowed `.compact-selector-grid` from 3-col to 2-col, removed `.selector-filter`, shifted `.selector-object`/`.selector-pattern` columns, added `.command-bar .lang-switcher` static override, added `@media 1100px` command-bar single-row rules (ellipsis, magnifier focus-expand, gap)
- `src/locales/en.json` - Added `ui.collapseNav`/`ui.commandBarLabel`/`ui.expandNav`/`ui.toggleNav` after `ui.categories` with EN values
- `src/locales/fr.json` - Mirrored same 4 keys with FR translations (Basculer/Déployer/Réduire/Barre de commandes)

## Decisions Made

- Remove `ConfigureCard` filter props entirely rather than keeping unused backward-compat props — search now lives only in `CommandBar` driving `objectSearch`/`setObjectSearch` (D-09), cleaner ownership, no dead prop drilling, verified `build` still passes via `App.tsx` edit.
- Delete orphaned `.selector-filter` CSS rule entirely and shift columns (`selector-object`→`grid-column:1`, `selector-pattern`→`grid-column:2`) to close gap — matches plan's "optionally delete it" and avoids orphaned selector in token gate.
- Insert locale keys alphabetically after `ui.categories` in both `en.json`/`fr.json` at an identical insertion point so `diff` of key sets stays trivial to verify and alphabetical proximity keeps parity review easy.
- Use pure-CSS magnifier expand (`input width 40px → 200px on :focus`) without new JS `search-toggle` button at `1100px` — satisfies T-09-06 "media query keeps single-row without JS; no overlay drawer on desktop" and keeps SAFE-01 minimal diff scope.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] App.tsx prop wiring after ConfigureCard prop removal**
- **Found during:** task 1 (Reflow ConfigureCard to 2-col and remove filter cell)
- **Issue:** Plan's `files_modified` listed only `ConfigureCard.tsx` + `App.css` for task 1, but `ConfigureCardProps` removal of `objectSearch`/`onObjectSearchChange` would break `App.tsx` call site (`filteredConventions` JSX) and fail `tsc`/`build`.
- **Fix:** Edited `src/App.tsx` to remove the two prop passes (`objectSearch={objectSearch} onObjectSearchChange={setObjectSearch}`) so build stays green; chose removal over keeping unused props per plan's "Remove ... if no longer needed elsewhere" option.
- **Files modified:** `src/App.tsx` (in addition to listed `ConfigureCard.tsx`/`App.css`)
- **Verification:** `npm run build` passes (1928 modules), grep `selector-filter` 0, `selector-object` 1, grid now 2-col
- **Committed in:** `c6110f5` (task 1 commit, 3 files)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Required for correctness — without it task 1 would not verify. No scope creep; follows plan's own OR branch.

## Issues Encountered

None — `check:tokens` 0 literals, `build` green, `lint` exit 0 (warnings only, matching prior Phase 8 pattern), `npm test` 137/137 with `pretest` token gate.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Layout restructure Phase 9 complete (09-01 rail state, 09-02 chrome assembly, 09-03 reflow/responsive/parity/gate); all LAYOUT-01/02 + SAFE-01 must-haves satisfied
- Ready for Phase 10 Detail-Styling/Polish-Verification (DETAIL-01 density/monospace) — chronicle chrome diffs remain `App.tsx`/`NavPanel`/`CommandBar` + tokens + storage only, PERF untouched
- No blockers; token gate remain single source via `src/styles/tokens.css`, 137-test lock preserved

## Self-Check: PASSED

- Found: `src/components/ConfigureCard.tsx` has 0 selector-filter, 1 selector-object, App.tsx no longer passes objectSearch
- Found: `src/App.css` has 1100px, command-bar, ellipsis, magnifier `width: 40px` → `width: 200px` on :focus, lang-switcher override
- Found: `src/locales/en.json` + `fr.json` parity ok (4 keys mirrored, diff clean)
- Found: `src/App.css` compact-selector-grid.has-patterns is 2-col (no 170px triple), object col1 pattern col2
- Verified: `npm run check:tokens` PASS, `npm run build` PASS, `npm run lint` exit 0, `npm test` 137 passed
- Verified commits: `c6110f5`, `e0692a6`, `e0b8ed8` present in log
- No hardcoded hex in new .command-bar block beyond `var(--*)` tokens

---
*Phase: 09-layout-restructure*
*Completed: 2026-08-23*
