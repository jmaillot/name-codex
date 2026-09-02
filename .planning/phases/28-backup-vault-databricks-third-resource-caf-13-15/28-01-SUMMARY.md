---
phase: 28-backup-vault-databricks-third-resource-caf-13-15
plan: 01
subsystem: azure
tags: [azure, caf, backup-vault, databricks, machine-learning, naming-convention, workload-library, i18n]

# Dependency graph
requires:
  - phase: 19-constraint-wiring
    provides: SegmentConstraints filtering via getConstraintsForField / optionsForSegment for Workload dropdowns
  - phase: 27-data-platform-synapse-cognitive-services
    provides: Canonical 3-segment Region-based lowercase CAF precedent (synw/cog) to copy verbatim
provides:
  - Backup Vault (bvault), Databricks Workspace (adb), Machine Learning Workspace (mlw) CAF conventions as bvault/adb/mlw-[Workload]-[Region]-[Environment] lowercase with per-resource Workload libraries
  - Catalog 65→68 (Azure 33→36) auto-discovered via import.meta.glob with EN/FR parity 30 keys
affects: [phase-29-caf-16-18, catalog-integrity, naming-validation]

# Tech tracking
tech-stack:
  added: []
  patterns: [Region-based lowercase CAF pattern prefix-[Workload]-[Region]-[Environment] with forceLowercase and no-double-hyphen validation, per-resource workload library via azure/*-workload]

key-files:
  created:
    - src/rules/azure/azure-backup-vault.json
    - src/rules/azure/azure-databricks-workspace.json
    - src/rules/azure/azure-machine-learning-workspace.json
    - src/data/segments/azure/bvault-workload.json
    - src/data/segments/azure/adb-workload.json
    - src/data/segments/azure/mlw-workload.json
  modified:
    - src/locales/en.json
    - src/locales/fr.json
    - src/lib/data-integrity.test.ts

key-decisions:
  - "CAF-15 third pick is azure-machine-learning-workspace (mlw) as highest-demand remaining distinct CAF resource with clear abbreviation and ML-training taxonomy distinct from synw/adb"
  - "Validation maxLength 50 with allowedPattern ^(?!.*--)[a-z][a-z0-9-]{0,48}[a-z0-9]$ copied verbatim from azure-recovery-vault precedent per D-08 fallback"
  - "Builder copied verbatim from azure-recovery-vault lines 28-36 (separator -, defaultSegments Workload/Region/Environment, availableSegments adds Custom, recommendedSegments Workload)"
  - "No Location segment, no constraints block per D-07, allowCustomValue true on every field"

patterns-established:
  - "Third CAF backlog pick is mlw (Machine Learning Workspace) - future CAF picks should follow distinct-prefix / distinct-taxonomy rule per D-02"
  - "3-segment Region-based lowercase pattern bvault/adb/mlw-[Workload]-[Region]-[Environment] with 8-value Workload libraries is canonical for data-protection + data/AI domain"

requirements-completed:
  - CAF-13
  - CAF-14
  - CAF-15

# Metrics
duration: 4min
completed: 2026-09-02T11:08:23Z
---

# Phase 28: Backup Vault + Databricks + Machine Learning Workspace (CAF-13..15) Summary

**Three Azure CAF conventions as bvault/adb/mlw-[Workload]-[Region]-[Environment] lowercase with 3 eight-value Workload libraries, 30 EN/FR keys, catalog 65→68 (Azure 33→36) auto-discovered, all gates green**

## Performance

- **Duration:** 4 min
- **Started:** 2026-09-02T11:04:37Z
- **Completed:** 2026-09-02T11:08:23Z
- **Tasks:** 2
- **Files modified:** 9

## Accomplishments

- Shipped `azure-backup-vault` (bvault), `azure-databricks-workspace` (adb), `azure-machine-learning-workspace` (mlw) as `prefix-[Workload]-[Region]-[Environment]` lowercase with `maxLength 50`, `forceLowercase true`, `^(?!.*--)[a-z][a-z0-9-]{0,48}[a-z0-9]$` validation
- Created 3 per-resource Workload libraries (bvault: SHARED/BACKUP/ARCHIVE/DR/SERVER/DATA/SAP/VAULT; adb: DATA/ANALYTICS/AI/ML/DATALAKE/ETL/STREAMING/BI; mlw: SHARED/TRAIN/INFER/ML/AI/DATA/RESEARCH/ANALYTICS) resolving via `azure/*-workload` library
- Added 30 bilingual keys (6 rule name/description + 24 lib values) with FR translations (Coffre de sauvegarde / Espace de travail Databricks / Espace de travail Machine Learning) maintaining EN=FR parity
- Updated vitest catalog proofs to 68 conventions (Azure 36) and 44 search-reachability entries; all gates green: `check:data` 153 files PASS, `npm test` 240 pass (11 files), `npm run build` Vite success, `check:tokens` 18/18 WCAG

## Task Commits

Each task was committed atomically:

1. **Task 1: Create 3 rule JSON + 3 workload JSON (bvault/adb/mlw)** - `3e95118` (feat)
2. **Task 2: Add EN/FR locale keys and update catalog-integrity proofs (65→68, Azure 33→36)** - `6bf5bae` (feat)

**Plan metadata:** `6bf5bae` (docs: complete plan)

## Files Created/Modified

- `src/rules/azure/azure-backup-vault.json` - Backup Vault CAF rule bvault-[Workload]-[Region]-[Environment] maxLength 50 lowercase no-double-hyphen
- `src/rules/azure/azure-databricks-workspace.json` - Databricks Workspace CAF rule adb-[Workload]-[Region]-[Environment]
- `src/rules/azure/azure-machine-learning-workspace.json` - Machine Learning Workspace CAF rule mlw-[Workload]-[Region]-[Environment]
- `src/data/segments/azure/bvault-workload.json` - Backup Vault workload library 8 values (SHARED/BACKUP/ARCHIVE/DR/SERVER/DATA/SAP/VAULT)
- `src/data/segments/azure/adb-workload.json` - Databricks workload library 8 values (DATA/ANALYTICS/AI/ML/DATALAKE/ETL/STREAMING/BI)
- `src/data/segments/azure/mlw-workload.json` - ML Workspace workload library 8 values (SHARED/TRAIN/INFER/ML/AI/DATA/RESEARCH/ANALYTICS)
- `src/locales/en.json` - EN keys for 3 rules + 24 lib values (30 keys)
- `src/locales/fr.json` - FR mirror with French translations (Coffre de sauvegarde, Espace de travail Databricks/Machine Learning)
- `src/lib/data-integrity.test.ts` - Updated proofs 65→68, Azure 33→36, NEW_CONVENTION_IDS 41→44 with bvault/adb/mlw

## Decisions Made

- CAF-15 third pick is `azure-machine-learning-workspace` (mlw) per CONTEXT.md D-01/D-02 as highest-demand remaining distinct CAF resource (clear CAF abbreviation, distinct prefix, ML-training taxonomy vs existing synw/adb DATA/AI libs) - approved pattern in PLAN.md
- Validation `maxLength 50` with `allowedPattern ^(?!.*--)[a-z][a-z0-9-]{0,48}[a-z0-9]$` copied verbatim from `azure-recovery-vault.json` per D-08 fallback (Azure Backup Vault limit 2-50 precedent)
- Builder config copied verbatim from `azure-recovery-vault.json` lines 28-36 per PATTERNS.md (no Location, no Instance, no constraints block per D-07)
- Followed plan exactly — no additional decisions required

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Phase 28 complete (CAF-13..15 shipped, catalog 68 Azure 36, gates green); Phase 29 (CAF-16..18) ready to ship remaining 3 CAF conventions to close v1.12 at 71 conventions (Azure 39)
- Remaining CAF backlog after bvault/adb/mlw per CATALOG-POSSIBILITIES.md belongs in Phase 29
- No blockers

---
*Phase: 28-backup-vault-databricks-third-resource-caf-13-15*
*Completed: 2026-09-02*
