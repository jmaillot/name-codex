---
phase: 09-layout-restructure
plan: 02
subsystem: ui
tags: [react, layout, command-bar, collapsible-rail, css-grid, tokens, lucide-react]
requires:
  - phase: 09-01
    provides: CommandBar shell component and railCollapsed persisted state
provides:
  - Sticky full-width command bar above app-shell with token-only chrome
  - Collapsible nav rail (280px ↔ 64px icon-only strip) with toggle and brand compact
  - Grid reflow with 200ms ease respecting prefers-reduced-motion
affects: [09-03-mobile-drawer, 10-polish-verification, layout-restructure]
tech-stack:
  added: []
  patterns: [single-source railCollapsed drilled from App.tsx, token-only chrome, css grid column reflow, prefers-reduced-motion guard]
key-files:
  created: []
  modified: [src/App.tsx, src/components/NavPanel.tsx, src/App.css]
key-decisions:
  - "Use lucide-react ChevronLeft/ChevronRight for rail toggle (matches CommandBar icon set, no new dep)"
  - "Override .lang-switcher to position:static inside command-bar rather than deleting global fixed block — preserves gate while eliminating overlay"
  - "Include nav-section-title in collapsed hiding to fully clean 64px strip"
patterns-established:
  - "App.tsx is single wiring point for railCollapsed → CommandBar + NavPanel, never duplicated"
  - "Collapsed rail uses grid reflow (64px column) not overlay on desktop; transition on app-shell only"
  - "All chrome consumes Phase 8 tokens only (surface-panel, border-subtle, shadow-card, accent)"
requirements-completed: [LAYOUT-01, LAYOUT-02]
duration: 5min
completed: 2026-08-23
---

# Phase 09 Plan 02: Azure Portal Chrome Assembly Summary

**Sticky CommandBar above grid plus 280↔64px collapsible rail with brand compact, token-only grid reflow and reduced-motion guard**

## Performance

- **Duration:** 5 min
- **Started:** 2026-08-23T13:44:00Z
- **Completed:** 2026-08-23T13:46:32Z
- **Tasks:** 3
- **Files modified:** 3

## Accomplishments

- Wired `CommandBar` into `App.tsx` above `app-shell`, drilling identical `railCollapsed`/`toggleRailCollapse` to both bar and `NavPanel`, removing standalone `LangSwitcher` from main-panel
- Made `NavPanel` collapsible: `nav-panel--collapsed` toggles 64px icon-only strip, hides labels/counts→dot badge, shrinks brand logo to 32px, toggle button carries `aria-expanded` and `ui.expandNav`/`ui.collapseNav` i18n labels
- Delivered CSS chrome: sticky `command-bar` (surface-panel + border-subtle + shadow-card, 50px grid `auto 1fr auto`), `app-shell--rail-collapsed` 64px column with `200ms ease` transition plus `prefers-reduced-motion` guard, and all collapsed overrides token-only

## Task Commits

Each task was committed atomically:

1. **Wire CommandBar + rail state in App.tsx** - `9ca2261` (feat)
2. **Make NavPanel collapsible (icon-only rail + brand compact)** - `bd9860e` (feat)
3. **Add command-bar, grid reflow, collapsed overrides and animation CSS** - `818bcbc` (feat)

**Plan metadata:** pending final docs commit (orchestrator will merge worktree; SUMMARY committed below)

## Files Created/Modified

- `src/App.tsx` - Wiring point: imports `CommandBar`, reads `railCollapsed`/`toggleRailCollapse` from `useAppState`, renders `<CommandBar>` sticky above `.app-shell`, toggles `app-shell--rail-collapsed` class, passes `collapsed`/`onToggle` to `NavPanel`, removes `LangSwitcher` from main-panel
- `src/components/NavPanel.tsx` - Collapsible variant: extends props with `collapsed`/`onToggle`, conditional `nav-panel--collapsed` class, `rail-toggle` button with `aria-expanded` and `tl("ui.expandNav"/"ui.collapseNav")`, `brand-logo--collapsed` support, `lucide-react` chevrons
- `src/App.css` - Chrome CSS: `.command-bar` block (sticky, grid, tokens), `.app-shell` transition + `app-shell--rail-collapsed` 64px, collapsed overrides for nav-label/nav-count/brand, `rail-toggle` styling, `.command-bar__right .lang-switcher {position:static}` override

## Decisions Made

- Use `lucide-react` `ChevronLeft`/`ChevronRight` for NavPanel rail toggle — same library as CommandBar's `Menu`/`Search`, no new dependency, accessible with `aria-hidden` on icons.
- Keep global `.lang-switcher {position:fixed}` block but override specifically via `.command-bar__right .lang-switcher {position:static}` — more specific selector wins inside bar, preserves original rule for any out-of-bar case without deletion.
- Hide `.nav-section-title` alongside `.brand-title`/`.brand-subtitle`/`.brand-divider` when collapsed — cleans 64px strip fully; `.brand-logo` shrink applied via `.brand-logo--collapsed` class for token-consistent sizing.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Chrome assembly complete; Wave 2 layout foundation ready for `09-03` mobile overlay/drawer and responsive refinements.
- Token gate clean (0 literals, 9/9 contrast), build/lint/test green (137 tests), no blockers.

## Self-Check: PASSED

- Found: src/App.tsx contains CommandBar and app-shell--rail-collapsed
- Found: src/components/NavPanel.tsx contains collapsed and aria-expanded
- Found: src/App.css contains command-bar and collapsed overrides with token vars and 200ms ease
- Commits verified: 9ca2261, bd9860e, 818bcbc present in log

---
*Phase: 09-layout-restructure*
*Completed: 2026-08-23*
