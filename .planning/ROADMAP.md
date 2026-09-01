# Roadmap: Name Codex

## Milestones

- ✅ **v1.0 Baseline Release** — Phase 1 (shipped 2026-08-19)
- ✅ **v1.1 Quality & Refactor** — Phases 2-6 (shipped 2026-08-21)
- ✅ **v1.2 Performance** — Phase 7 (shipped 2026-08-21)
- ✅ **v1.3 Developer Portal UI** — Phases 8-10 (shipped 2026-08-24)
- ✅ **v1.4 Light Mode** — Phases 11-12 (shipped 2026-08-24)
- ✅ **v1.5 Naming Convention Expansion** — Phases 13-15 (shipped 2026-08-25)
- ✅ **v1.6 Data Integrity** — Phases 16-18 (shipped 2026-08-28)
- ✅ **v1.7 Constraint Wiring & CAF Expansion** — Phases 19-20 (shipped 2026-08-31)
- 🚧 **v1.8 Data Tier + Observability + Network Edge** — Phases 21-23 (planned, validated 1-3 + dept)

## Phases

<details>
<summary>✅ v1.0 Baseline Release (Phase 1) — SHIPPED 2026-08-19</summary>

- [x] Phase 1: Baseline Release v1.0 (3/3 plans) — completed 2026-08-19

Full details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>✅ v1.1 Quality & Refactor (Phases 2-6) — SHIPPED 2026-08-21</summary>

- [x] Phase 2: Backup & Safety Net (3/3 plans) — completed 2026-08-20
- [x] Phase 3: Refactor App.tsx (2/2 plans) — completed 2026-08-20
- [x] Phase 4: Bug Fixes (5/5 plans) — completed 2026-08-20
- [x] Phase 5: Tests (2/2 plans) — completed 2026-08-21
- [x] Phase 6: Cleanup (2/2 plans) — completed 2026-08-21

Full details: `.planning/milestones/v1.1-ROADMAP.md`

</details>

<details>
<summary>✅ v1.2 Performance (Phase 7) — SHIPPED 2026-08-21</summary>

- [x] Phase 7: Performance Optimizations (3/3 plans) — completed 2026-08-21

Full details: `.planning/milestones/v1.2-ROADMAP.md`

</details>

<details>
<summary>✅ v1.3 Developer Portal UI (Phases 8-10) — SHIPPED 2026-08-24</summary>

- [x] Phase 8: Design Token Foundation (3/3 plans) — completed 2026-08-23
- [x] Phase 9: Layout Restructure (3/3 plans) — completed 2026-08-23
- [x] Phase 10: Developer-Portal Polish & Verification (4/4 plans incl. 2 gap-closure) — completed 2026-08-24

Full details: `.planning/milestones/v1.3-ROADMAP.md`

</details>

<details>
<summary>✅ v1.4 Light Mode (Phases 11-12) — SHIPPED 2026-08-24</summary>

- [x] Phase 11: Light Token Palette (2/2 plans) — completed 2026-08-24
- [x] Phase 12: Theme Switching & Verification (3/3 plans) — completed 2026-08-24

Full details: `.planning/milestones/v1.4-ROADMAP.md`

</details>

<details>
<summary>✅ v1.5 Naming Convention Expansion (Phases 13-15) — SHIPPED 2026-08-25</summary>

- [x] Phase 13: New Microsoft 365 Categories — Teams, SharePoint, Power Platform, Purview (4/4 plans) — completed 2026-08-25
- [x] Phase 14: Category Expansions — Azure CAF Resources + Intune (5/5 plans) — completed 2026-08-25
- [x] Phase 15: Milestone Verification — Full Catalog Integrity (4/4 plans) — completed 2026-08-25

Catalog grew 25→45 conventions across 7→11 categories, data-driven JSON only; builder correctness sweep; 183 tests incl. catalog-integrity proofs; verdict COMPLETE-WITH-WAIVER. Phases archived to `.planning/milestones/v1.5-phases/`.

Full details: `.planning/milestones/v1.5-ROADMAP.md`

</details>

<details>
<summary>✅ v1.6 Data Integrity (Phases 16-18) — SHIPPED 2026-08-28</summary>

- [x] Phase 16: Data Validation Gate — check:data + CI (3/3 plans) — completed 2026-08-27
- [x] Phase 17: Generic Segment Constraint Vocabulary (2/2 plans) — completed 2026-08-28
- [x] Phase 18: Region Catalog Expansion (0/0 plans, direct impl + UAT 7/7) — completed 2026-08-28 — 40 short codes AUE..WUS3 + 40 Country ISO codes AE..ZA, check:data 96 PASS, vitest 226 PASS, threats_open 0

Shipped: zero-dep check:data gate (validateRule/Segment/Generator + CI data job), generic constraints vocabulary (allowedPattern/minLength/maxLength) with bilingual DATA-FORMAT docs, and Region+Country 4→40 expansion proving the gate (short-code per user approval, UAT verified). Full details: `.planning/milestones/v1.6-ROADMAP.md`

</details>

### ✅ v1.7 Constraint Wiring & CAF Expansion (Phases 19-20) — SHIPPED 2026-08-31

**Goal:** Wire the generic segment constraint vocabulary into builder enforcement and expand the Azure CAF catalog with six high-demand conventions — making constraints visible to users and conventions data-driven.

Shipped: 50 conventions (111 files, EN 628 FR 628), Service Bus/AKS/VNet GW grouped with sub-objects, Container Registry hyphen-free, validation real limits for 9 lenient objects, all gates green.

#### Phase 19: Constraint Wiring (WIRE-01)

- [x] **Status:** Shipped 2026-08-31 (commit de44964)
- **Requirements:** WIRE-01
- **Goal:** Make declared `SegmentConstraints` live — type extension, dropdown option filtering via `optionsForSegment`, length/pattern validation rows via `validateName`, reactive clamp and `maxLength` UI via `useAppState`/`SegmentEditor`, and docs flip from future-scope to live.

| # | Deliverable | Success Criteria |
|---|-------------|------------------|
| 19a | Type extension + option filtering | 1. User opens a convention using Region, Environment, or Instance — dropdown lists only show values matching the segment's `allowedPattern` (violating options hidden, yet Custom input remains available) — `optionsForSegment` reads `SegmentConstraints` via `fieldByName`/`getSegmentFile` with try/catch and `filtered.length>0 ? filtered : original` guard. |
| 19b | Validation rows + governance score | 2. User types a custom value violating `allowedPattern`, `minLength`, or `maxLength` — a distinct validation row appears (pattern/min/max) with inline hint/error styling and the governance score drops accordingly (separate from existing `field.allowedPattern`/`rule.maxLength` rows, `""` sentinel bypassed). |
| 19c | Reactive clamp + UI | 3. User pastes or types beyond `maxLength` in a text/custom field — the input is clamped via `maxLength` attribute + `slice(0, maxLength)` on commit, the clamped value is what renders/copies, while validation still flags the raw over-length value before clamp. |
| 19d | Docs + seed | 4. User (contributor) reads `docs/DATA-FORMAT.md` / `_FR.md` and sees constraints documented as live since v1.7 (future-scope note removed) with example `constraints` seeded on at least one core library (e.g. `core/region` or `core/instance`) and `check:data` + `build` + `vitest` remain green. |

**Depends on:** v1.6 gate and vocabulary (inert `SegmentConstraints` type + `check:data` declaration validation).

**Plans:** TBD by plan-phase (coarse granularity — type extension → filtering → validation rows → clamp/UI → docs flip batched).

#### Phase 20: CAF Catalog Expansion (CAF-01..06)

- [x] **Status:** Shipped 2026-08-31 (50 conventions, 18 Azure, 107 files, 490 EN/FR)
- **Requirements:** CAF-01, CAF-02, CAF-03, CAF-04, CAF-05, CAF-06
- **Goal:** Expand the Azure CAF catalog with six high-demand conventions as pure data-driven JSON — each with pattern/fields/builder/validation/examples, optional per-resource workload library, and EN/FR parity — growing the catalog 44→50 with all gates green.

| # | Deliverable | Success Criteria |
|---|-------------|------------------|
| 20a | Six CAF conventions as JSON | 1. User can select each new Azure convention in category navigation — Container Registry `acr` (`acr-[Environment]-[Region]-[Instance]`), AKS `aks` (`aks-[Environment]-[Region]-[Workload]-[Instance]`), Cosmos DB `cosmos` (`cosmos-[Workload]-[Environment]-[Region]-[Instance]` workload-first), Service Bus `sb`, Function App `func`, App Service `app` — and generate a name matching its CAF pattern and `validation` (globally-unique lowercase `^[a-z0-9…]$` for `acr`/`func`/`app` where applicable). |
| 20b | Workload libraries + constraints | 2. User picking `aks`/`cosmos`/other Workload-bearing conventions sees a constrained Workload dropdown (where a per-resource `azure/*-workload.json` library exists, filtered by any `constraints.allowedPattern` via Phase 19 wiring) with meaningful taxonomy values. |
| 20c | Bilingual + catalog integrity | 3. User toggles EN↔FR — every new `data.rule.*` and `data.lib.*` key renders translated (EN/FR parity holds, e.g. ~380=380), catalog counts read 51 conventions across 11 categories (45→51) auto-discovered via `import.meta.glob` with no code diff beyond Phase 19 wiring. |
| 20d | Gates green | 4. `npm run check:data` passes on ~102 files, `npm run build` + `npm run lint` + `npm test` (vitest ~232 tests incl. updated 51-count/11-category/search-reachability/EN=FR parity proofs) all green, and CI `needs [build,lint,test,data]` remains intact. |

**Depends on:** Phase 19 type extension (W-01) so new workload libs can carry `constraints`; otherwise parallelizable after Phase 19 types land.

**Plans:** TBD by plan-phase (coarse granularity — six rule files + workload libs + locale keys batched, sequential for review or parallel after W-01).

### 🚧 v1.8 Data Tier + Observability + Network Edge (Phases 21-23) — PLANNED 2026-09-01 (validated 1-3 + dept)

**Goal:** Expand Azure CAF catalog with 10 high-demand data/network conventions + department taxonomy — all data-driven JSON, no code.

#### Phase 21: Data Tier — SQL + API Management + Data Factory (SQL-01..04)

- [ ] **Status:** Planned — validated #1 (you approved 1-3 + dept)
- **Requirements:** SQL-01 (sql-server), SQL-02 (sql-db), APIM-01 (api-mgmt), ADF-01 (data-factory)
- **Goal:** Ship `sqlsrv`/`sql` pair + `apim` + `adf` as CAF `sqlsrv/sql-[Workload]-[Env]-[Region]-[Instance]`, `apim-...`, `adf-...` with workload libs.

| # | Deliverable | Success Criteria |
|---|-------------|------------------|
| 21a | Four data-tier conventions | SQL Server `sqlsrv-...` + SQL DB `sql-...` + API Management `apim-...` + Data Factory `adf-...` selectable in Azure nav, generate `^[a-z0-9-]` lowercase, `maxLength` 63/50. |
| 21b | Workload libs | Per-resource `azure/sql-workload.json` etc. filtered via `getConstraintsForField`. |
| 21c | Bilingual + gates | EN/FR parity, `check:data` ~115 PASS, `build/lint/test` green (53→57). |

#### Phase 22: Observability — Log Analytics + App Insights + Event Hub (OBS-01..03)

- [ ] **Status:** Planned
- **Requirements:** OBS-01 (log-analytics `log`), OBS-02 (app-insights `appi`), OBS-03 (event-hub `evh`)
- **Goal:** Ship `log`/`appi`/`evh` as `log/appi/evh-[Workload]-[Env]-[Region]-[Instance]`.

| # | Deliverable | Success Criteria |
|---|-------------|------------------|
| 22a | Three observability conventions | `log`, `appi`, `evh` selectable, `maxLength` 63, lowercase. |
| 22b | Gates | 57→60 conventions, parity, gates green. |

#### Phase 23: Network Edge + Department Taxonomy (NET-01..03 + DEPT-01)

- [ ] **Status:** Planned
- **Requirements:** NET-01 (lb), NET-02 (agw), NET-03 (afw/bas), DEPT-01 (department 4→9)
- **Goal:** Ship `lb`/`agw`/`afw` + expand `src/data/segments/core/department.json:3` with `LEGAL`/`MARKETING`/`SALES`/`SECURITY`/`RESEARCH` (dept 4→9).

| # | Deliverable | Success Criteria |
|---|-------------|------------------|
| 23a | Three network conventions | `lb`/`agw`/`afw` selectable. |
| 23b | Department | `core/department` 4→9, `data.lib.core/department.*` EN/FR. |
| 23c | Gates | 60→63 conventions, parity, gates green — milestone v1.8 shipped. |

---

_Requirements coverage: 7/7 REQ-IDs mapped — Phase 19 (WIRE-01), Phase 20 (CAF-01..06). See traceability table in `.planning/REQUIREMENTS.md`._

_Milestone v1.7: 2 phases (19-20) | 7 requirements mapped | All covered._
_Milestone v1.8: 3 phases (21-23) | 11 requirements mapped | Planned (validated 1-3 + dept)._

_Previous milestones archived under .planning/milestones/ (v1.0–v1.6). v1.7 to be archived on next close._
