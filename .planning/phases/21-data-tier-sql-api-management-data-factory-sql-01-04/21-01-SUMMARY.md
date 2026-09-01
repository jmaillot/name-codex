---
phase: 21-data-tier-sql-api-management-data-factory-sql-01-04
plan: 01
subsystem: data-tier
tags: [azure, caf, sql-server, sql-database, api-management, data-factory, json, i18n, data-integrity]
requires:
  - phase: 19-constraint-wiring
    provides: getConstraintsForField workload filtering wired into builder
provides:
  - Four Azure CAF conventions (sqlsrv, sql, apim, adf) with per-resource workload libraries
  - Bilingual EN/FR parity for 4 new rules + 18 workload values (753 flat keys each)
  - Catalog integrity at 53 conventions / Azure 21 (49→53)
affects: [azure-catalog, data-integrity, i18n]

tech-stack:
  added: []
  patterns: [data-driven JSON conventions via import.meta.glob, per-resource workload libraries filtered via getConstraintsForField, bilingual flat-key i18n]

key-files:
  created:
    - src/rules/azure/azure-sql-server.json
    - src/rules/azure/azure-sql-database.json
    - src/rules/azure/azure-api-management.json
    - src/rules/azure/azure-data-factory.json
    - src/data/segments/azure/sql-workload.json
    - src/data/segments/azure/apim-workload.json
    - src/data/segments/azure/adf-workload.json
  modified:
    - src/locales/en.json
    - src/locales/fr.json
    - src/lib/data-integrity.test.ts

key-decisions:
  - "SQL Database maxLength 128 (authoritative Microsoft limit) over roadmap shorthand 63 — CAF doc correctness preserved, maxLength check still PASS"
  - "Shared sql-workload library reused by both sqlsrv and sql to avoid duplication"
  - "ADF default workload PIPE with example adf-pipe-prod-frc-001 aligned to workload value"

patterns-established:
  - "Per-resource workload taxonomy: azure/<name>-workload library filtered via Phase 19 getConstraintsForField, Custom input remains available"
  - "Data-tier CAF pattern sqlsrv|sql|apim|adf-[Workload]-[Environment]-[Region]-[Instance] with lowercase hyphenated validation"

requirements-completed: [SQL-01, SQL-02, APIM-01, ADF-01]

duration: 12min
completed: 2026-09-01
---

# Phase 21 Plan 01: Data-Tier SQL / API Management / Data Factory Summary

**Four data-tier Azure CAF conventions (sqlsrv/sql/apim/adf) with shared and per-resource workload taxonomies, bilingual EN/FR parity and catalog 53/21 integrity — zero code diff beyond Phase 19 wiring**

## Performance

- **Duration:** 12 min
- **Started:** 2026-09-01T09:05:00Z
- **Completed:** 2026-09-01T09:07:18Z
- **Tasks:** 2
- **Files modified:** 10

## Accomplishments

- Shipped `azure-sql-server` (`sqlsrv-[Workload]-[Environment]-[Region]-[Instance]`, maxLength 63, globally unique), `azure-sql-database` (`sql-...`, maxLength 128), `azure-api-management` (`apim-...`, maxLength 50), `azure-data-factory` (`adf-...`, maxLength 63) as pure JSON with hyphenated builder and lowercase validation
- Created three workload libraries: `sql-workload` (APP/API/WEB/DATA/SHARED/ANALYTICS/ORDERS/PAYMENTS — 8), `apim-workload` (API/GATEWAY/ORDERS/PAYMENTS/SHARED — 5), `adf-workload` (ETL/INGEST/PIPE/ANALYTICS/SYNC — 5), shared sql-workload reused by sqlsrv/sql, filtered via `getConstraintsForField`
- Bilingual parity: EN and FR each gained 4 rule name/description pairs + 18 workload value keys (753 flat keys each, PARITY), French translations Serveur SQL / Base de données SQL / Gestion des API / Fabrique de données
- Catalog integrity updated to 53 conventions (Azure 21) with search reachability ×29 and EN=FR parity proofs; all gates green (check:data 118 PASS, 238 tests, build PASS, lint 0 errors, tsc PASS)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create four data-tier rule JSONs + per-resource workload libraries** - `b5feefb` (feat)
2. **Task 2: Bilingual EN/FR keys + catalog integrity tests (53 conventions, 21 Azure, parity)** - `369beda` (feat)

**Plan metadata:** pending (docs: complete plan)

## Files Created/Modified

- `src/rules/azure/azure-sql-server.json` - SQL Server CAF convention (sqlsrv- pattern, 63 chars, lowercase hyphenated)
- `src/rules/azure/azure-sql-database.json` - SQL Database CAF convention (sql- pattern, 128 chars, paired with sqlsrv)
- `src/rules/azure/azure-api-management.json` - API Management CAF convention (apim- pattern, 50 chars globally unique)
- `src/rules/azure/azure-data-factory.json` - Data Factory CAF convention (adf- pattern, 63 chars)
- `src/data/segments/azure/sql-workload.json` - Shared SQL workload taxonomy (8 values, reused by sqlsrv + sql)
- `src/data/segments/azure/apim-workload.json` - APIM workload taxonomy (5 values)
- `src/data/segments/azure/adf-workload.json` - ADF workload taxonomy (5 values)
- `src/locales/en.json` - EN keys for 4 new rules + 18 workload values
- `src/locales/fr.json` - FR keys (Serveur SQL, Base de données SQL, Gestion des API, Fabrique de données + workload translations)
- `src/lib/data-integrity.test.ts` - Updated counts 49→53, Azure 17→21, NEW_CONVENTION_IDS 25→29

## Decisions Made

- SQL Database maxLength set to 128 (authoritative per Microsoft CAF) rather than roadmap shorthand 63 — documented tradeoff, build and validation still PASS and correctness is superior
- Shared `azure/sql-workload` library for both `azure-sql-server` and `azure-sql-database` to avoid duplication — single source of truth for SQL family
- ADF default workload `PIPE` with example `adf-pipe-prod-frc-001` aligned to workload taxonomy value (not pipeline) for consistency

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Data-tier conventions selectable in Azure category nav via `import.meta.glob` auto-discovery — no code changes beyond JSON
- Workload dropdowns filter via Phase 19 `getConstraintsForField` when libs carry constraints; Custom input remains available
- Ready for Phase 22/23 (observability / network edge) — catalog at 53 conventions, 11 categories, all gates green

---
*Phase: 21-data-tier-sql-api-management-data-factory-sql-01-04*
*Completed: 2026-09-01*
