---
phase: 22-observability-log-analytics-app-insights-event-hub-obs-01-03
plan: 01
subsystem: observability
tags: [azure, caf, log-analytics, app-insights, event-hub, json, i18n, data-integrity]
requires:
  - phase: 19-constraint-wiring
    provides: getConstraintsForField workload filtering wired into builder
provides:
  - Three observability Azure CAF conventions (log, appi, evh Namespace+Hub) with per-resource workload libraries
  - Bilingual EN/FR parity for 3 new rules (+ 4 hub pattern sub-keys) + 42 workload/purpose values (805 flat keys each)
  - Catalog integrity at 56 conventions / Azure 24 (53->56)
affects: [azure-catalog, data-integrity, i18n]

tech-stack:
  added: []
  patterns: [data-driven JSON conventions via import.meta.glob, per-resource workload libraries filtered via getConstraintsForField, multi-pattern file for Event Hub Namespace+Hub like Service Bus]

key-files:
  created:
    - src/rules/azure/azure-log-analytics.json
    - src/rules/azure/azure-app-insights.json
    - src/rules/azure/azure-event-hub.json
    - src/data/segments/azure/log-workload.json
    - src/data/segments/azure/appi-workload.json
    - src/data/segments/azure/evh-workload.json
    - src/data/segments/azure/evh-hub-purpose.json
  modified:
    - src/locales/en.json
    - src/locales/fr.json
    - src/lib/data-integrity.test.ts

key-decisions:
  - "Log Analytics 63 strict lowercase ^(?!.*--)[a-z][a-z0-9-]{2,61}[a-z0-9]$ — fixes WR-01..05, CAF 4-63 authoritative"
  - "Application Insights 63 strict (not 260 classic) — workspace-based 63 per CAF is authoritative; 260 is legacy classic noted in description tradeoff"
  - "Event Hub Namespace+Hub multi-pattern like Service Bus: namespace evh-[Workload]-[Env]-[Region]-[Instance] + hub evh-[Purpose]; top-level validation 50 strict ^(?!.*--)[a-z][a-z0-9-]{4,48}[a-z0-9]$ (CAF namespace 6-50, hub 1-50 both fit; 260 is Service Bus not Event Hub)"
  - "Per-resource workload libs all carry constraints ^[A-Z]+$ 2-14 filtered via getConstraintsForField; D365 filtered from dropdown but Custom remains via allowCustomValue guard; appi default APP via allowCustomValue (14-value list CUSTOMAPP sentinel kept, APP not in list intentional WR-03 guard)"
  - "Roadmap says 57->60 but actual 53->56 (Phase 21 landed 53); evh 50 vs roadmap 63 is CAF authoritative — documented tradeoff"

patterns-established:
  - "Per-resource workload taxonomy: azure/<name>-workload library with constraints filtered via Phase 19 getConstraintsForField, Custom input remains available (filtered.length>0 guard)"
  - "Multi-pattern file for sub-objects: azure-event-hub.json patterns[] namespace/hub with availableSegments union including Purpose like Service Bus precedent"
  - "Observability CAF pattern log/appi/evh-[Workload]-[Environment]-[Region]-[Instance] (hub evh-[Purpose]) with strict lowercase hyphenated validation"

requirements-completed: [OBS-01, OBS-02, OBS-03]

duration: 15min
completed: 2026-09-01
---

# Phase 22 Plan 01: Observability Log Analytics / App Insights / Event Hub Summary

**Three observability Azure CAF conventions (log/appi/evh Namespace+Hub) with per-resource workload taxonomies, bilingual EN/FR parity and catalog 56/24 integrity — zero code diff beyond Phase 19 wiring**

## Performance

- **Duration:** 15 min
- **Started:** 2026-09-01T09:38:00Z
- **Completed:** 2026-09-01T11:42:00Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Shipped `azure-log-analytics` (`log-[Workload]-[Environment]-[Region]-[Instance]`, maxLength 63 strict lowercase `^(?!.*--)[a-z][a-z0-9-]{2,61}[a-z0-9]$`, example log-monitoring-prod-frc-001) with 15-value `log-workload` library (ERP..BACKUP, MONITORING default, constraints ^[A-Z]+$ 2-14)
- Shipped `azure-app-insights` (`appi-[Workload]-[Environment]-[Region]-[Instance]`, same 63 strict, example appi-app-prod-frc-001, default APP via allowCustomValue against 14-value `appi-workload` ERP..CUSTOMAPP)
- Shipped `azure-event-hub` multi-pattern (`evh-[Workload]-[Environment]-[Region]-[Instance]` namespace + `evh-[Purpose]` hub, maxLength 50 strict `^(?!.*--)[a-z][a-z0-9-]{4,48}[a-z0-9]$`, examples evh-ingest-prod-frc-001 / evh-orders) with `evh-workload` (7 messaging: INGEST..IOT) and `evh-hub-purpose` (6: ORDERS..ANALYTICS) libs
- Bilingual parity: EN and FR each gained 10 rule/pattern name/description pairs + 42 lib value keys (805 flat keys each, PARITY), French translations Espace Log Analytics / Application Insights / Event Hub (Espace de noms)
- Catalog integrity updated to 56 conventions (Azure 24) with search reachability x32 and EN=FR parity proofs; all gates green (check:data 125 PASS, 238 tests, build PASS, lint 0 errors, tsc PASS)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create three observability rule JSONs + four per-resource workload libraries** - `ca41031` (feat)
2. **Task 2: Bilingual EN/FR keys + catalog integrity tests (53->56 conventions, 21->24 Azure, parity)** - `51acf01` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified

- `src/rules/azure/azure-log-analytics.json` - Log Analytics Workspace CAF convention (log- pattern, 63 strict lowercase)
- `src/rules/azure/azure-app-insights.json` - Application Insights CAF convention (appi- pattern, 63 strict, 260 classic noted as legacy)
- `src/rules/azure/azure-event-hub.json` - Event Hub CAF convention (evh- namespace + hub multi-pattern, 50 strict)
- `src/data/segments/azure/log-workload.json` - Log workload taxonomy (15 values, MONITORING default)
- `src/data/segments/azure/appi-workload.json` - App Insights workload taxonomy (14 values, CUSTOMAPP sentinel, APP default via Custom)
- `src/data/segments/azure/evh-workload.json` - Event Hub workload taxonomy (7 messaging values, INGEST default)
- `src/data/segments/azure/evh-hub-purpose.json` - Event Hub hub Purpose taxonomy (6 values, ORDERS default)
- `src/locales/en.json` - EN keys for 3 new rules (+4 hub pattern sub-keys) + 42 lib values
- `src/locales/fr.json` - FR keys (Espace Log Analytics, Application Insights, Event Hub + workload translations)
- `src/lib/data-integrity.test.ts` - Updated counts 53->56, Azure 21->24, NEW_CONVENTION_IDS 29->32

## Decisions Made

- Log Analytics validation strict 63 with negative lookahead no --, start letter end alnum — directly fixes Phase 21 WR-01..05
- App Insights enforces 63 per CAF (workspace-based) not 260 classic legacy — tradeoff documented in description and commit message; if CAF confirms 260 later, bump to 260 with pattern {2,258}
- Event Hub top-level maxLength 50 (CAF namespace 6-50, hub 1-50) not roadmap shorthand 63 — CAF authoritative, hub 260 is Service Bus not Event Hub
- Per-resource workload libs all seeded with constraints ^[A-Z]+$ 2-14 to exercise Phase 19 filtering; D365 value violates ^[A-Z]+$ but remains reachable via Custom input (guard filtered.length>0)
- Event Hub multi-pattern shape mirrors Service Bus precedent: top-level fields for namespace, patterns[] hub with own Purpose field, builder availableSegments union includes Purpose

## Deviations from Plan

- Added 4 extra bilingual pattern sub-keys for Event Hub hub/namespace (data.rule.azure-event-hub.pattern.namespace/hub name+description) beyond plan's minimal 6 rule keys — needed for parity with Service Bus/AKS precedent and to fully translate multi-pattern UI; parity still holds (805=805) and plan allowed discretion on hub field names
- check:data reports 125 files PASS vs plan estimate ~122 — additional files from Phase 21 delta, still 0 errors, gates green

## Issues Encountered

- None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Observability conventions selectable in Azure category nav via `import.meta.glob` auto-discovery — no code changes beyond JSON
- Workload dropdowns filter via Phase 19 `getConstraintsForField` when libs carry constraints; Custom input remains available
- Ready for Phase 23 (network edge + department taxonomy) — catalog at 56 conventions, 11 categories, all gates green

## Self-Check: PASSED

- All 7 created files found (3 rules + 4 workload/purpose libs)
- Task commits verified: ca41031, 51acf01
- Summary commit verified: pending
- Gates: check:data 125 PASS, 238 tests PASS, build PASS, lint PASS

---
*Phase: 22-observability-log-analytics-app-insights-event-hub-obs-01-03*
*Completed: 2026-09-01*
