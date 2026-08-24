---
phase: 12-theme-switching-verification
plan: 01
subsystem: theme
tags: [theme, boot-resolution, localStorage, pre-paint, i18n-adjacent]
requires:
  - ":root[data-theme=\"light\"] token block (Phase 11, tokens.css)"
provides:
  - "src/lib/theme.ts helpers consumed by Plan 12-02 (toggle pill)"
  - "Pre-paint <html data-theme> resolution in index.html"
affects:
  - "Plan 12-02 (CommandBar toggle consumes theme.ts)"
  - "THEME-L-02 boot mechanics"
tech-stack:
  added: []
  patterns:
    - "Inline pre-paint boot script with duplicated key string + D-09 sync note"
    - "Allowlist validation at storage boundary (T-12-01 mitigation)"
    - "try/catch choke-point storage guards matching Phase 4 pattern"
key-files:
  created:
    - src/lib/theme.ts
  modified:
    - index.html
decisions:
  - "Theme key stays out of STORAGE_KEYS legacy -v11-6 family — current-version derivation name-codex-theme-v14-0 per D-07"
  - "readStoredTheme returns null for absent AND non-allowlisted values — absence = follow OS (D-08), no third 'system' value"
metrics:
  duration: ~2 min
  completed: 2026-08-24
---

# Phase 12 Plan 01: Boot-Time Theme Resolution Summary

**One-liner:** Pre-paint inline script in index.html resolves `data-theme` from allowlisted localStorage override → prefers-color-scheme fallback before React mounts (zero flash), plus the dedicated `src/lib/theme.ts` helper module for all Plan 12-02 React-side theme logic.

## What Was Built

### Task 1: src/lib/theme.ts helper module (commit f56790a)
- `THEME_STORAGE_KEY = "name-codex-theme-v14-0"` — single source of truth (D-07/D-09), deliberately outside the legacy `-v11-6` STORAGE_KEYS family.
- `export type ThemePreference = "light" | "dark"` — exactly two values; type-enforced explicit-only persistence (D-08).
- Six exports: `readStoredTheme` (allowlist validation, null on absent/invalid/throw), `storeTheme`, `clearStoredTheme` (OS-follow reset path per D-08), `currentDocumentTheme` (attribute read, anything ≠ exactly "light" → dark), `applyThemeToDocument`, pure `toggleTheme`.
- Every localStorage call site inside try/catch (privacy-mode safe, T-12-04); zero `matchMedia` references (D-05).

### Task 2: Inline pre-paint script in index.html (commit 3163502)
- Dependency-free vanilla IIFE inside `<head>`, placed after meta/link tags and before `/src/main.tsx` module parse.
- Logic: `localStorage.getItem("name-codex-theme-v14-0")` → allowlist (`=== "light" || === "dark"`) → else `matchMedia("(prefers-color-scheme: dark)")` → set `<html data-theme>` before first paint.
- Fail-silent catch sets nothing → `:root` dark default (tokens.css). No listener registration (D-05). D-09 single-source-of-truth sync comment present in both files.

## Verification Results

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` | ✅ exit 0 |
| Task 1 automated verify (key string present, no matchMedia) | ✅ pass |
| `grep -c matchMedia src/lib/theme.ts` | ✅ 0 |
| Task 2 automated verify (script in head, before main.tsx, prefers-color-scheme) | ✅ OK |
| `npx vite build` | ✅ green in 12.22s |
| Built `dist/index.html` retains inline pre-paint script | ✅ confirmed |

Manual devtools spot-check (clear storage + OS emulation; garbage stored value) deferred to Plan 12-03 verification phase — mechanical checks above prove the wiring.

## Commits

| Task | Commit | Files |
|------|--------|-------|
| 1 | f56790a | src/lib/theme.ts (new) |
| 2 | 3163502 | index.html |

## Deviations from Plan

None — plan executed exactly as written.

## Threat Model Compliance

- **T-12-01 (Tampering, stored value):** mitigated — allowlist validation in BOTH theme.ts and the inline script; arbitrary strings never reach setAttribute.
- **T-12-02 (injected attribute value):** mitigated structurally — unknown values match no selector → :root dark default; no CSS interpolation.
- **T-12-04 (localStorage DoS):** mitigated — try/catch at every access site in both files; boot never throws.
- No new threat surface introduced beyond the plan's register.

## Known Stubs

None. Both artifacts are fully wired end-to-end.

## Self-Check: PASSED

- FOUND: src/lib/theme.ts
- FOUND: index.html modification (inline script)
- FOUND: commits f56790a, 3163502 in git log
