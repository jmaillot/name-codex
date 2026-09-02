# Requirements: Name Codex — Milestone v1.12 CAF Expansion III

**Defined:** 2026-09-02
**Goal:** Expand the Azure CAF catalog with six additional high-demand conventions as pure data-driven JSON — EN/FR parity, Region-based lowercase patterns, all gates green — continuing the Region + lowercase convention.
**Core Value:** The generated name must always reflect the selected convention — correct segments, correct ordering, correct validation — so a user can copy a compliant, governance-scored name with confidence.

## v1.12 Requirements

### Azure CAF — Additional Resources (CAF-13..18)

- [x] **CAF-13**: User can generate Backup Vault names per CAF (`bvault-[Workload]-[Region]-[Environment]` lowercase, per-resource Workload library)
- [x] **CAF-14**: User can generate Databricks Workspace names per CAF (`adb-[Workload]-[Region]-[Environment]` lowercase, per-resource Workload library)
- [x] **CAF-15**: User can generate third new CAF convention per backlog (e.g., next high-demand from `docs/CATALOG-POSSIBILITIES.md`) as lowercase `prefix-[Workload]-[Region]-[Environment]`
- [ ] **CAF-16**: User can generate fourth new CAF convention per backlog as lowercase `prefix-[Workload]-[Region]-[Environment]`
- [ ] **CAF-17**: User can generate fifth new CAF convention per backlog as lowercase `prefix-[Workload]-[Region]-[Environment]`
- [ ] **CAF-18**: User can generate sixth new CAF convention per backlog as lowercase `prefix-[Workload]-[Region]-[Environment]`

> All six are pure data-driven JSON: one `src/rules/azure/<id>.json` per convention with `pattern`/`fields[]`/`validation`/`builder`/`examples`, optional per-resource workload/purpose library `src/data/segments/azure/<id>-workload.json` (filtered via `getConstraintsForField`), and `data.rule.*` + `data.lib.*` EN/FR locale keys. No code changes beyond Phase 19 wiring; catalog 65→71 (Azure 33→39) auto-discovered via `import.meta.glob`. Patterns use `core/region` (FRC/WE etc.) + `core/environment` + lowercase `forceLowercase` where applicable.

## Future Requirements

- **GOV-04**: Compliance checklist view — checklist of governance rules with pass/fail for audit (deferred, requires GOV-01)
- **NAV-02**: Category insights — per-category stats (convention count, compliance overview) for discovery
- **LOCL-01**: Additional languages beyond EN/FR
- **CAF-19+**: Remaining CAF resources backlog per `docs/CATALOG-POSSIBILITIES.md`
- **DATA-REF**: Reference-integrity checks in `check:data` (segment-library refs, generator types, pattern tokens resolve)
- **DATA-LOCL**: Locale-key parity enforcement for data keys in `check:data` (now covered by data-integrity test, but could move to check:data gate)
- **PERF**: Perf follow-ups if scale demands (virtualization, bundle-size budget, lazy JSON loading)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Backend or network layer | App is static SPA by design |
| Formal JSON Schema + ajv tooling | Hand-rolled validator suffices (v1.6 decision) |
| Full CAF sweep in one milestone | Scoped to 6 high-demand resources; remaining CAF resources stay in backlog |
| Executing patterns in `check:data` gate | Gate stays compile-only; runtime enforcement in builder |
| Location catalog alignment to region geography | Deferred per v1.7 scoping (REG-02 partial); Location stays 2 values (AAD/AZ) |

## Traceability

<!-- Filled by roadmap: REQ-ID → Phase mapping -->

| Requirement | Phase | Status |
|-------------|-------|--------|
| CAF-13 | Phase 28 | Planned |
| CAF-14 | Phase 28 | Planned |
| CAF-15 | Phase 28 | Planned |
| CAF-16 | Phase 29 | Planned |
| CAF-17 | Phase 29 | Planned |
| CAF-18 | Phase 29 | Planned |

**Coverage:**
- v1.12 requirements: 6 total
- Mapped to phases: 6
- Unmapped: 0 ✅

---
*Requirements defined: 2026-09-02*
*Last updated: 2026-09-02 after initial definition*
