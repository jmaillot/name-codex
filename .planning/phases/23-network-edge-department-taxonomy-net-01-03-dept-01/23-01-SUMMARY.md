---
phase: 23-network-edge-department-taxonomy-net-01-03-dept-01
plan: 01
subsystem: network
tags: [azure, caf, load-balancer, application-gateway, firewall, department, taxonomy, json, i18n, data-integrity]
requires:
  - phase: 19-constraint-wiring
    provides: getConstraintsForField workload filtering and validation wiring (allowCustomValue guard)
provides:
  - Three network-edge Azure CAF conventions (lb, agw, afw) workload-first with strict 80-char lowercase validation
  - Department taxonomy expanded 5→9 values (Marketing, IT, HR, FIN, OPS, LEGAL, SALES, SECURITY, RESEARCH)
  - Bilingual EN/FR parity for 3 new rules + 5 department keys (816 flat keys each)
  - Catalog integrity at 59 conventions / Azure 27 (56→59)
affects: [azure-catalog, data-integrity, i18n, department]

tech-stack:
  added: []
  patterns: [data-driven JSON conventions via import.meta.glob, inline Workload values with allowCustomValue, strict 80-char CAF validation ^(?!.*--)[a-z][a-z0-9-]{2,78}[a-z0-9]$ + forceLowercase]

key-files:
  created:
    - src/rules/azure/azure-load-balancer.json
    - src/rules/azure/azure-application-gateway.json
    - src/rules/azure/azure-firewall.json
  modified:
    - src/data/segments/core/department.json
    - src/locales/en.json
    - src/locales/fr.json
    - src/lib/data-integrity.test.ts

key-decisions:
  - "Network CAF 80 strict lowercase ^(?!.*--)[a-z][a-z0-9-]{2,78}[a-z0-9]$ — min 4 max 80, start letter end alnum, no --, forceLowercase true — matches lb/agw/afw CAF authoritative"
  - "Workload-first pattern lb/agw/afw-[Workload]-[Environment]-[Region]-[Instance] with inline values WEB/APP/API/SHARED (default APP) — self-contained like nsg precedent, no external workload library needed"
  - "Department expanded 5→9 preserving existing order Marketing,IT,HR,FIN,OPS then LEGAL,SALES,SECURITY,RESEARCH — 2-space indent, no trailing comma"
  - "Bilingual EN/FR: lb Load Balancer / Équilibreur de charge, agw Application Gateway / Passerelle applicative, afw Azure Firewall / Pare-feu Azure; department LEGAL Juridique, SALES Ventes, SECURITY Sécurité, RESEARCH Recherche (+Marketing Marketing) — parity 816=816"
  - "Catalog 56→59 (Azure 24→27) not roadmap shorthand 60→63 — roadmap double-counted, actual delta 3 network, department is not a convention; documented tradeoff"

patterns-established:
  - "Network-edge CAF convention shape: prefix-[Workload]-[Environment]-[Region]-[Instance] with strict 80 lowercase validation and inline Workload taxonomy WEB/APP/API/SHARED"
  - "Department taxonomy expansion via src/data/segments/core/department.json values + data.lib.core/department.* flat keys with EN=FR parity"
  - "Zero code diff expansion: new conventions auto-discovered via import.meta.glob, builder availableSegments [Custom] with recommended Workload"

requirements-completed: [NET-01, NET-02, NET-03, DEPT-01]

duration: 15min
completed: 2026-09-01
---

# Phase 23 Plan 01: Network Edge + Department Taxonomy Summary

**Three network-edge Azure CAF conventions (lb/agw/afw) with strict 80-char lowercase validation and workload-first builder, plus department taxonomy 5→9 with bilingual EN/FR parity — catalog 56→59 (Azure 24→27) via pure JSON, zero code diff**

## Performance

- **Duration:** 15 min
- **Started:** 2026-09-01T09:50:28Z
- **Completed:** 2026-09-01T11:55:00Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- Shipped `azure-load-balancer` (`lb-[Workload]-[Environment]-[Region]-[Instance]`, maxLength 80 strict lowercase `^(?!.*--)[a-z][a-z0-9-]{2,78}[a-z0-9]$`, forceLowercase, example lb-app-prod-frc-001) with inline Workload WEB/APP/API/SHARED (APP default, allowCustomValue)
- Shipped `azure-application-gateway` (`agw-[Workload]-[Environment]-[Region]-[Instance]`, same 80 strict, example agw-app-prod-frc-001, inline Workload 4 values)
- Shipped `azure-firewall` (`afw-[Workload]-[Environment]-[Region]-[Instance]`, same 80 strict, example afw-app-prod-frc-001, inline Workload 4 values)
- Expanded `core/department` 5→9 values: Marketing, IT, HR, FIN, OPS, LEGAL, SALES, SECURITY, RESEARCH (2-space indent, descriptions Legal/Sales/Security/Research)
- Bilingual parity: EN and FR each gained 6 rule name/description pairs + 5 department keys (Marketing plus 4 new) — 816 flat keys each, PARITY; FR translations Équilibreur de charge / Passerelle applicative / Pare-feu Azure + Juridique/Ventes/Sécurité/Recherche
- Catalog integrity updated to 59 conventions (Azure 27) with search reachability x35 and EN=FR parity proofs; all gates green (check:data 128 PASS, 238 tests, build PASS, lint 0 errors, tsc PASS)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create three network rule JSONs + expand department taxonomy** - `73150a9` (feat)
2. **Task 2: Bilingual EN/FR keys + catalog integrity tests (56→59 conventions, 24→27 Azure, parity)** - `a023322` (feat)

**Plan metadata:** `pending` (docs: complete plan)

_Note: TDD tasks may have multiple commits (test → feat → refactor)_

## Files Created/Modified

- `src/rules/azure/azure-load-balancer.json` - Load Balancer CAF convention (lb- workload-first, 80 strict lowercase, WEB/APP/API/SHARED)
- `src/rules/azure/azure-application-gateway.json` - Application Gateway CAF convention (agw- workload-first, 80 strict)
- `src/rules/azure/azure-firewall.json` - Azure Firewall CAF convention (afw- workload-first, 80 strict)
- `src/data/segments/core/department.json` - Department taxonomy expanded 5→9 (LEGAL,SALES,SECURITY,RESEARCH added)
- `src/locales/en.json` - EN keys for 3 new rules + 5 department values (Marketing + 4 new)
- `src/locales/fr.json` - FR keys (Équilibreur de charge, Passerelle applicative, Pare-feu Azure + Juridique/Ventes/Sécurité/Recherche)
- `src/lib/data-integrity.test.ts` - Updated counts 56→59, Azure 24→27, NEW_CONVENTION_IDS 32→35

## Decisions Made

- Strict 80 validation `^(?!.*--)[a-z][a-z0-9-]{2,78}[a-z0-9]$` enforces CAF 4-80 no -- start letter end alnum with forceLowercase — same shape as 63 variants but {2,61}→{2,78} for 80
- Workload-first pattern with inline values (not library) keeps file self-contained like nsg precedent; Environment/Region/Instance still via core/* libraries with PROD/FRC/001 defaults
- French translations keep proper nouns (Azure Load Balancer etc.) but translate surrounding CAF boilerplate per log-analytics precedent
- Catalog 56→59 not 60→63 — roadmap double-counted prior milestone; actual delta is 3 network conventions, department taxonomy is library not convention
- Added Marketing locale key to reach 9 values — pre-existing locales lacked Marketing despite department.json containing it; adding it restores must_have 9-key parity without breaking existing tests

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Missing] Added missing Marketing locale keys to reach 9 department values**
- **Found during:** Task 2 (bilingual EN/FR keys)
- **Issue:** Plan assumed `data.lib.core/department.Marketing` already existed (5 existing keys IT/HR/FIN/OPS/Marketing) but en.json/fr.json only contained IT/HR/FIN/OPS (4 keys) — grep showed no Marketing key; without it parity would be 8 values not 9 as required by must_have
- **Fix:** Added `data.lib.core/department.Marketing` "Marketing" in EN and "Marketing" in FR alongside the 4 new LEGAL/SALES/SECURITY/RESEARCH keys; result EN 816 FR 816 PARITY with 9 department keys
- **Files modified:** src/locales/en.json, src/locales/fr.json
- **Verification:** `node -e flat()` parity PASS 816=816, data-integrity EN=FR test PASS, check:data 128 PASS
- **Committed in:** a023322 (Task 2 commit)

**2. [Rule 3 - Blocking] Roadmap count note**
- **Found during:** Task 2 verification
- **Issue:** ROADMAP Phase 23 says 60→63 but actual landed 56→59 — Phase 23 only adds 3 network conventions, department expansion is not a convention (library) so 56+3=59 not 63
- **Fix:** Documented tradeoff in summary and commit message; no code change required, gates still green (238 tests, 128 files PASS)
- **Files modified:** none (documentation only)
- **Verification:** Catalog integrity test expects 59, Azure 27 verified via npm test
- **Committed in:** a023322 notes

---

**Total deviations:** 1 auto-fixed (1 missing) + 1 documentation note
**Impact on plan:** Marketing key addition necessary for correctness (9-value taxonomy parity). No scope creep beyond filling gap to meet must_have.

## Issues Encountered

- None

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Network conventions selectable in Azure category nav via `import.meta.glob` auto-discovery — lb/agw/afw patterns generate lowercase hyphenated names, Workload dropdown shows WEB/APP/API/SHARED with Custom available
- Department dropdown now shows 9 values including LEGAL, SALES, SECURITY, RESEARCH for any groups/m365 convention using core/department
- Ready for milestone v1.8 close — catalog at 59 conventions, 11 categories, all gates green (check:data 128 PASS, build/lint/tsc/test PASS, parity 816=816)
- Remaining v1.8 phases: none (Phase 23 was final) — proceed to verify-work / complete-milestone

## Self-Check: PASSED

- All 3 rule files found (lb/agw/afw) + department expanded 9 values
- Task commits verified: 73150a9, a023322
- Summary commit verified: pending
- Gates: check:data 128 PASS, 238 tests PASS, build PASS, lint PASS (1 warning allowed), tsc PASS, parity 816=816, strict regex rejects a--b + 1abc and accepts lb-app-prod-frc-001

---
*Phase: 23-network-edge-department-taxonomy-net-01-03-dept-01*
*Completed: 2026-09-01*
