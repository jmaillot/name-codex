---
phase: 14-category-expansions-azure-caf-resources-intune
plan: 04
subsystem: intune-autopilot-naming
tags: [autopilot, macros, rand-budget, validation, uat-gap-closure]
requires:
  - 14-03 (segment-driven name assembly)
provides:
  - "%RAND:n% expansion-length helpers (expandedLength / randWidth)"
  - "maxLengthBudget-driven macro dropdown filtering"
  - "prefix-reactive RAND clamp in updateSegmentValue"
  - "expansion-aware validation row for RAND macros"
affects:
  - src/lib/segments.ts optionsForSegment signature (convention param)
tech-stack:
  added: []
  patterns:
    - "budget-dependent option filtering (field.maxLengthBudget.dependsOn)"
    - "reactive clamp mirroring caPolicyId precedent"
key-files:
  created:
    - src/lib/macros.ts
    - src/lib/macros.test.ts
    - src/lib/autopilot-budget.test.ts
    - src/hooks/useAppState.autopilot.test.tsx
  modified:
    - src/types/Rule.ts
    - src/lib/segments.ts
    - src/lib/validation.ts
    - src/components/SegmentEditor.tsx
    - src/hooks/useAppState.ts
    - src/rules/intune/intune-autopilot-device-name.json
    - src/locales/en.json
    - src/locales/fr.json
    - vite.config.ts
decisions:
  - "Budget applies to %RAND:n% only; %SERIAL% stays un-budgeted (unknowable length, D-05 retained) — validation flags over-budget RAND templates instead of hard-filtering"
  - "UAT verification failure root-caused to stale Vite bundle on WSL /mnt/c, not application code; fixed with polling watcher"
metrics:
  duration: "2 sessions (implementation ~45m + diagnosis/fix ~20m)"
  completed: 2026-08-25
---

# Phase 14 Plan 04: Autopilot budget-aware RAND macros Summary

Per-variant %RAND:12% default with prefix-budget-filtered macro dropdown, live prefix-reactive clamping, expansion-aware length validation, and EN/FR wording parity — plus root-cause fix for a stale-bundle UAT environment.

## Completed Tasks

| task | Name | Commit | Files |
| ---- | ---- | ------ | ----- |
| 1 | Macro helpers + budget-aware filtering and validation (TDD) | fb57573 (RED), f2e9e1d (GREEN) | src/lib/macros.ts, src/lib/macros.test.ts, src/types/Rule.ts, src/lib/segments.ts, src/lib/validation.ts, src/components/SegmentEditor.tsx, src/hooks/useAppState.ts |
| — | Test-spec correction (deviation) | a0ca1c9 | src/lib/macros.test.ts |
| 2 | Rule JSON defaults, prefix-reactive clamp, EN/FR wording | 717aec7 | src/rules/intune/intune-autopilot-device-name.json, src/hooks/useAppState.ts, src/locales/en.json, src/locales/fr.json |
| — | UAT issue regression tests (deviation, post-checkpoint) | 975874a | src/lib/autopilot-budget.test.ts, src/hooks/useAppState.autopilot.test.tsx |
| — | Stale-HMR environment fix (deviation, post-checkpoint) | f7058fa | vite.config.ts |

## Deviations from Plan

### User-reported checkpoint failures (Task 3 human-verify)

The user reported during manual browser verification:

1. **PREFIX+RANDOM variant selection did not stick** — Segment Builder always showed PREFIX+SERIAL.
2. **%RAND:15% remained selectable** with Prefix `DT-` — dropdown was not filtered by the prefix budget.

### Root cause analysis

**Neither issue was an application bug.** Diagnosis performed in three steps:

1. **Data-layer probe (real JSON):** loaded the real `intune-autopilot-device-name.json` + real `intune/autopilot-macros` library through `buildSegments` / `optionsForSegment` — `fixedValues.Macro = "%RAND:12%"` applied correctly; `maxLengthBudget` flowed through `fieldByName`; options correctly capped at `%RAND:12%` (13 options).
2. **Hook-level probe:** rendered a harness component driving the real `useAppState` through the exact user flow (Intune category → Autopilot convention → pattern switch → prefix edit → back-switch). Every step behaved correctly: `%RAND:12%` default on PREFIX+RANDOM, dropdown excluding 13–15, live clamp to `%RAND:5%` on `WKSHPREFX-`, `%SERIAL%` restored on PREFIX+SERIAL.
3. **Environment inspection:** no dev server running at diagnosis time; the server the user had verified against predated the Task 1–2 edits. This project lives under WSL `/mnt/c` (drvfs/9p), which **does not deliver inotify events** — Vite's file watcher never observed the edits made after server start, so its transform cache went stale and HMR silently died. The browser therefore rendered the pre-fix module graph. Both reported symptoms are exactly the pre-fix behavior.

**Fixes applied:**

- `[Rule 3 - Blocking]` **vite.config.ts**: added `server.watch.usePolling: true` (interval 500ms) so Vite detects file changes on drvfs. Verified: fresh dev server now logs `page reload` events on edit. Commit f7058fa.
- `[Deviation - test hardening]` Converted the diagnostic probes into permanent regression tests using real rule JSON and the real hook wiring (no synthetic fixtures): `src/lib/autopilot-budget.test.ts` (6 tests), `src/hooks/useAppState.autopilot.test.tsx` (5 tests covering both reported issues verbatim). These guard against future JSON/wiring regressions that literal-based tests cannot catch. Commit 975874a.

No changes to application source were required for either reported issue.

## Verification

- `npx vitest run`: **9 files, 174 tests passed** (includes 11 new regression tests)
- `npm run build` (tsc -b && vite build): exit 0
- `npm run lint`: exit 0 (5 warnings pre-existing, unchanged before/after)
- Fresh dev server serves updated modules (`%RAND:12%` + `maxLengthBudget` present in served transforms); watcher reacts to edits

## Re-verification steps for the user (Task 3 retry)

A fresh dev server is already running at **http://localhost:5175/** (hard-refresh the browser tab with Ctrl+Shift+R to drop any cached old bundle):

1. Select Intune → Autopilot Device Name (defaults to Prefix + Serial, Macro `%SERIAL%`).
2. Switch Pattern to **Prefix + Random** → Macro shows **%RAND:12%** (not `%SERIAL%`).
3. Open the Macro dropdown with Prefix `DT-` → options end at **%RAND:12%**; %RAND:13/14/15% absent; %SERIAL% still offered.
4. Change Prefix to `WKSHPREFX-` → Macro auto-clamps to **%RAND:5%**; dropdown ends at %RAND:5%.
5. Type `%RAND:13%` manually (Custom...) with Prefix `DT-` → validation shows an expanded-length warning (>15 chars after expansion).
6. Switch back to Prefix + Serial → Macro returns to `%SERIAL%`.
7. Switch language to French → updated description/tips render in French.

If behavior still looks wrong after a hard refresh, confirm the browser URL port matches the current server (check terminal output — Vite skips occupied ports).

## Changelog

- Added `expandedLength` / `randWidth` helpers (src/lib/macros.ts) with anchored digit-only regexes (T-14-04-01).
- `NamingField.maxLengthBudget?: { dependsOn: string }` type (src/types/Rule.ts).
- `optionsForSegment(field, segments, convention?)` gained a maxLengthBudget filter keyed on sibling segment value × `convention.validation.maxLength`; `%SERIAL%` kept (unknowable). Both call sites pass convention (SegmentEditor, referenceEntries).
- `validateName` emits an extra result row when the name contains `%RAND:n%`, comparing expansion length against maxLength (T-14-04-02 gate behind allowCustomValue).
- `useAppState.updateSegmentValue` reactively clamps oversized dependent RAND macros on dependency edits (mirrors caPolicyId precedent).
- Rule JSON: prefix-random `fixedValues.Macro = %RAND:12%`; Macro field `maxLengthBudget.dependsOn = Prefix`. Global `%SERIAL%` default retained for prefix-serial.
- en.json/fr.json description + Macro tip updated in parity (expansion-aware checking, DT- caps at %RAND:12%).

## Threat Model Dispositions

- T-14-04-01 (DoS): mitigated — anchored linear regexes.
- T-14-04-02 (Tampering): mitigated — custom over-budget RAND values allowed by design but flagged by validateName expansion row.
- T-14-04-03 (Repudiation): accepted — %SERIAL% un-budgeted by decision D-05, bilingual tip warns on static text budget.

No new threat surface introduced beyond the plan's threat model.

## Self-Check: PASSED

- FOUND: src/lib/macros.ts, src/lib/macros.test.ts, src/lib/autopilot-budget.test.ts, src/hooks/useAppState.autopilot.test.tsx
- FOUND commits: fb57573, f2e9e1d, a0ca1c9, 717aec7, 975874a, f7058fa
