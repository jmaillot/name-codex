---
phase: 12-theme-switching-verification
plan: 02
subsystem: theme-ui
tags: [theme-toggle, i18n, css-transition, accessibility, command-bar]
requires:
  - "src/lib/theme.ts helpers (Plan 12-01)"
  - ":root[data-theme=\"light\"] token block (Phase 11)"
provides:
  - "ThemeToggle sun/moon pill component wired in CommandBar ([theme] [EN/FR] cluster)"
  - "ui.themeSwitchToDark / ui.themeSwitchToLight locale keys (EN/FR parity 374=374)"
  - "Global html.theme-anim 175ms color-only fade with reduced-motion guard"
affects:
  - "Plan 12-03 verification (dual-theme smoke matrix exercises this toggle)"
  - "THEME-L-03 acceptance"
tech-stack:
  added: []
  patterns:
    - "Document-attribute-as-source-of-truth React state (useState initializer reads <html data-theme>)"
    - "Transient class + transitionend/timeout fade mechanism with pending-timer clearing"
    - "Sibling-pill chrome mirroring .lang-switcher via shared tokens"
key-files:
  created:
    - src/components/ThemeToggle.tsx
  modified:
    - src/locales/en.json
    - src/locales/fr.json
    - src/App.css
    - src/components/CommandBar.tsx
decisions:
  - "Fade class removal uses setTimeout(250) fallback only (plan allowed transitionend OR timeout) — simpler, immune to missed events, timer cleared per click per T-12-07"
metrics:
  duration: ~6 min
  completed: 2026-08-24
---

# Phase 12 Plan 02: Theme Toggle Pill Summary

**One-liner:** Sun/moon toggle pill (lucide-react) beside the EN/FR switcher with target-theme icon semantics, dynamic bilingual tooltip/aria-label, D-08 explicit-only persistence, and a locked 175ms color-only fade guarded by prefers-reduced-motion.

## What Was Built

### Task 1: Locale keys (commit 81ec65c)
- Added exactly two flat keys under `"ui"` in BOTH en.json and fr.json: `themeSwitchToDark` / `themeSwitchToLight` with the exact locked copy ("Switch to dark mode"/"Switch to light mode" / "Passer en mode sombre"/"Passer en mode clair").
- Parity gate verified mechanically: flat-key count 372 → **374 = 374**, no other keys touched.

### Task 2: ThemeToggle component + CSS (commit ce17660)
- `src/components/ThemeToggle.tsx`: state initialized from `currentDocumentTheme()` (`data-theme` on `<html>` lives outside React); `<Moon/>` while light, `<Sun/>` while dark (D-01 target-theme semantics); lucide-react glyphs at size 14, strokeWidth 2, aria-hidden (D-03); title AND aria-label from the same tl() key per state (D-02).
- `handleToggle`: adds `theme-anim` to `<html>` BEFORE flipping attribute → `applyThemeToDocument(next)` + `storeTheme(next)` (explicit-only, D-08) → `setTheme(next)`; fallback timer (250ms) clears any pending timer first so rapid clicks never orphan the class (T-12-07 mitigation). No matchMedia listener (D-05), no reset control (D-08).
- App.css additions (token-only, zero literals): `.command-bar .theme-toggle` mirrors `.lang-switcher` chrome (panel background, subtle border, radius 14, padding 4px); `.theme-btn` 30×30 radius 10 matching `.lang-btn`; hover via `--surface-hover`/`--text-primary`. Global fade rule `html.theme-anim *` transitions ONLY background-color/border-color/color/fill/stroke/box-shadow at 175ms ease-out, plus `prefers-reduced-motion: reduce` override to 0s.
- `npm run check:tokens` still passes: 0 literal violations, WCAG 18/18 pairs both themes.

### Task 3: CommandBar wiring (commit 76a32e9)
- `<ThemeToggle />` rendered BEFORE `<LangSwitcher/>` inside the header so the cluster reads `[theme] [EN/FR]` (UI-SPEC prescribed order).
- `.command-bar--lang-only` extended minimally: `display: flex; align-items: center; gap: var(--space-sm)` (8px between pills); positioning untouched. `.theme-toggle` given `pointer-events: auto` mirroring the lang-switcher sibling under the pointer-events:none overlay header.

## Verification Results

| Check | Result |
|-------|--------|
| Locale parity script | ✅ PARITY OK 374=374 |
| Task 2 automated verify (icons, keys, no matchMedia, theme-anim, reduced-motion) | ✅ OK |
| `grep -c matchMedia src/components/ThemeToggle.tsx` | ✅ 0 |
| `npx tsc --noEmit` | ✅ exit 0 |
| `npx vite build` | ✅ built in 6.43s |
| `npx vitest run` | ✅ 137 passed (137), 6 files — suite unchanged per D-11 |
| `npm run lint` | ✅ exit 0 (pre-existing warnings in unrelated files only) |
| `npm run check:tokens` | ✅ PASS (literals: 0 violations) |
| CommandBar order check | ✅ ORDER OK [theme][EN/FR] |

## Commits

| Task | Commit | Files |
|------|--------|-------|
| 1 | 81ec65c | src/locales/en.json, src/locales/fr.json |
| 2 | ce17660 | src/components/ThemeToggle.tsx (new), src/App.css |
| 3 | 76a32e9 | src/components/CommandBar.tsx, src/App.css |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] vitest `--reporter=basic` removed in vitest v4**
- **Found during:** task 3
- **Issue:** Plan's verify command `npx vitest run --reporter=basic` fails with "Failed to load custom Reporter from basic" (the basic reporter was removed in vitest 4.x).
- **Fix:** Ran `npx vitest run` with the default reporter — same suite, same assertions.
- **Files modified:** none

**2. [Rule 1 - Bug] Verify-grep false positive on doc comment**
- **Found during:** task 2
- **Issue:** The acceptance criterion `grep -c "matchMedia" → 0` matched the phrase "No matchMedia listener" in ThemeToggle's doc comment, failing the automated gate despite no listener code existing.
- **Fix:** Rephrased the comment to "No OS-preference change listener (D-05)".
- **Files modified:** src/components/ThemeToggle.tsx
- **Commit:** ce17660

## Threat Model Compliance

- **T-12-05 (Tampering, stored value):** mitigated — only values produced by pure `toggleTheme` reach `storeTheme`; type system enforces "light"\|"dark".
- **T-12-06 (attribute injection via locale strings):** accepted — static committed JSON; React escapes attribute values.
- **T-12-07 (rapid-click DoS orphans theme-anim):** mitigated — pending timeout cleared before each toggle; 250ms fallback removes the class even if a transition event is missed.
- No new threat surface beyond the plan's register.

## Known Stubs

None. The toggle is fully wired end-to-end (click → attribute flip → persistence → fade).

## Self-Check: PASSED

- FOUND: src/components/ThemeToggle.tsx
- FOUND: src/locales/en.json + fr.json theme keys (parity 374=374)
- FOUND: App.css theme-anim rules + CommandBar wiring
- FOUND: commits 81ec65c, ce17660, 76a32e9 in git log
