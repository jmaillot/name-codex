---
phase: 14-category-expansions-azure-caf-resources-intune
plan: 05
subsystem: intune-naming-tips
tags: [update-ring, tooltips, i18n, locale-namespacing, uat-gap-closure]
requires:
  - phase: 14-04 (Autopilot budget-aware RAND macros)
    provides: "reworded data.field.Macro.tip content that was migrated verbatim into the scoped namespace"
provides:
  - "fieldTip(field, fallback, conventionId?) rule-scoped lookup precedence"
  - "data.rule.<conventionId>.field.<Name>.tip locale namespace convention"
  - "UpdateRing four-ring-taxonomy tip in EN + FR"
  - "Autopilot Prefix/Macro/Template tips migrated out of the global namespace (IN-01 closed)"
affects:
  - future rules adding field-specific tips (must use scoped namespace for rule-specific content)
tech-stack:
  added: []
  patterns:
    - "rule-scoped tip lookup precedence: scoped key → legacy global key → inline fallback"
key-files:
  created: []
  modified:
    - src/lib/segments.ts
    - src/components/SegmentEditor.tsx
    - src/rules/intune/intune-update-ring.json
    - src/locales/en.json
    - src/locales/fr.json
key-decisions:
  - "Lookup precedence scoped → global → inline preserves all pre-existing shared global tips (Region, Environment, GroupName, ...) while giving rule-specific content first claim"
  - "Autopilot tips migrated verbatim (including 14-04 rewording) rather than rewritten — migration is namespacing-only, no content change"
patterns-established:
  - "Rule-specific tip keys live under data.rule.<conventionId>.field.<Name>.tip; global data.field.<Name>.tip is reserved for genuinely cross-rule tips"
requirements-completed: [INTUNE-03]
metrics:
  duration: "~2 sessions across continuation checkpoint (implementation + bilingual human verification)"
  completed: 2026-08-25
---

# Phase 14 Plan 05: Rule-scoped tip namespace + Update Ring taxonomy tip Summary

Rule-scoped `fieldTip` lookup (`data.rule.<id>.field.<Name>.tip` before legacy global) closing IN-01's cross-rule override risk, plus a bilingual four-ring-taxonomy tip on Update Ring's locked dropdown.

## Performance

- **Duration:** 2 sessions (implementation ~40m; continuation after user approval for bookkeeping)
- **Tasks:** 3 of 3 complete (task 3 = blocking human-verify gate, approved)
- **Files modified:** 5

## Accomplishments

- `fieldTip(field, fallback, conventionId?)` now prefers `data.rule.<conventionId>.field.<field.name>.tip`, falling back to the legacy global key, then the inline fallback — no existing tip changed behavior.
- SegmentEditor passes `convention.id` at its sole `fieldTip` call site.
- UpdateRing field gained an inline English tip documenting Microsoft's fixed Pilot / Dev / Broad / Production Windows Update taxonomy (custom values not allowed), mirrored as scoped keys in en.json and fr.json.
- Autopilot's three rule-specific tips (`Prefix`, `Macro`, `Template`) migrated from the global `data.field.*.tip` namespace to `data.rule.intune-autopilot-device-name.field.*.tip` in both languages — another rule gaining a same-named field can no longer silently override them (IN-01 closed).

## task Commits

1. **Task 1: Rule-scoped fieldTip lookup + SegmentEditor wiring** — `66a3192` (feat)
2. **Task 2: Update Ring tip content (EN/FR) + Autopilot tip migration to scoped keys** — `b017f8b` (feat)
3. **Task 3: Verify Update Ring tip renders bilingually** — human-verify gate; **user approved** with no code changes requested. Tips confirmed rendering with the four-ring taxonomy in EN and FR, Autopilot scoped tips unchanged, legacy global tips intact.

## Files Created/Modified

- `src/lib/segments.ts` — `fieldTip` gained optional `conventionId` param with scoped-key-first lookup
- `src/components/SegmentEditor.tsx` — sole `fieldTip` call site now passes `convention.id`
- `src/rules/intune/intune-update-ring.json` — inline `tip` on the UpdateRing field
- `src/locales/en.json` — +4 scoped keys (UpdateRing tip + 3 migrated Autopilot tips), −3 global Autopilot tip keys
- `src/locales/fr.json` — FR mirror of the same additions/removals

## Decisions Made

- **Scoped → global → inline precedence** keeps every pre-existing genuinely-shared tip (Region, Environment, GroupName, SiteName, ...) working unchanged while letting rule-specific content win.
- **Verbatim migration:** Autopilot tip text moved as-is (including plan 14-04's Macro tip rewording); this change was namespacing-only.
- Other global tips untouched — they are legitimately shared across rules.

## Deviations from Plan

None — plan executed exactly as written. Key-count parity landed at net +1 per language (3 removed + 4 added), exactly as the plan predicted.

## Issues Encountered

- **Environmental (pre-existing, out of scope):** full-suite `npx vitest run` intermittently fails to fork a worker for `src/lib/parse.test.ts` on WSL `/mnt/c` ("timeout waiting for worker"). The test **passes in isolation every time**, and the flake reproduces on code untouched by this plan. Logged here for the record; no fix attempted per scope boundary.

## Verification (at checkpoint)

- Node checks: UpdateRing field has a tip; all 4 scoped keys present in EN + FR; all 3 old global Autopilot tip keys removed from both languages; **EN = FR parity at 398 data keys**
- `npx vitest run`: **174 tests passed** (parse.test.ts counted via isolated run due to the WSL worker fork flake above)
- `npm run build`: exit 0
- `npm run lint`: exit 0 (5 warnings, all pre-existing and unchanged)
- Human verification (task 3): approved — Update Ring tooltip renders the Pilot / Dev / Broad / Production taxonomy bilingually; Autopilot Prefix/Macro/Template tips unchanged; legacy global tip path intact

## Threat Model Dispositions

- T-14-05-01 (Tampering): mitigated by design — lookup-key components come only from trusted repo-authored rule JSON ids and field names, never user input.
- T-14-05-02 (Information disclosure): accepted — static authored guidance strings, no PII or dynamic interpolation.

No new threat surface introduced beyond the plan's threat model.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Gap truth closed: Update Ring exposes a helpful bilingual tip explaining the four-ring taxonomy, namespaced per IN-01.
- Future plans adding rule-specific tips should use `data.rule.<conventionId>.field.<Name>.tip`; the global namespace remains available only for genuinely shared fields.
- No blockers outstanding for this plan.

## Self-Check: PASSED

- FOUND files: src/lib/segments.ts, src/components/SegmentEditor.tsx, src/rules/intune/intune-update-ring.json, src/locales/en.json, src/locales/fr.json, 14-05-SUMMARY.md
- FOUND commits: 66a3192 (task 1), b017f8b (task 2); task 3 closed via human approval

---
*Phase: 14-category-expansions-azure-caf-resources-intune*
*Completed: 2026-08-25*
