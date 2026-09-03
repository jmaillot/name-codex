---
phase: 29-fourth-fifth-sixth-resources-caf-16-18
plan: 01
subsystem: azure-caf-rules
tags: [azure, caf, naming-conventions, json, i18n, vitest]
requires:
  - "Phase 19 constraint wiring (getConstraintsForField / allowedPattern filtering)"
  - "core/region + core/environment libraries (FRC/PROD defaults)"
provides:
  - "azure-front-door convention (afd-[Workload]-[Region]-[Environment])"
  - "azure-private-endpoint convention (pe-[Workload]-[Region]-[Environment])"
  - "azure-dns-zone convention (dnsz-[Workload]-[Region]-[Environment])"
  - "afd-workload / pe-workload / dnsz-workload libraries (8 values each)"
  - "EN/FR locale keys for 3 rules + 24 lib values"
affects:
  - src/locales/en.json
  - src/locales/fr.json
  - src/lib/data-integrity.test.ts
tech-stack:
  added: []
  patterns:
    - "Pure-JSON CAF rule: prefix-[Workload]-[Region]-[Environment], core libs for Region/Environment, per-resource Workload lib, auto-discovered via import.meta.glob"
key-files:
  created:
    - src/rules/azure/azure-front-door.json
    - src/rules/azure/azure-private-endpoint.json
    - src/rules/azure/azure-dns-zone.json
    - src/data/segments/azure/afd-workload.json
    - src/data/segments/azure/pe-workload.json
    - src/data/segments/azure/dnsz-workload.json
  modified:
    - src/locales/en.json
    - src/locales/fr.json
    - src/lib/data-integrity.test.ts
decisions:
  - "afd/pe/dnsz prefixes follow CAF abbreviations — no collision with existing 36 Azure rules"
  - "Workload libs kept distinct per resource: edge (WEB/CDN/EDGE/GLOBAL/FRONTEND) vs private-link (DATA/NETWORK/SECURE/PRIVLINK/ENDPOINT) vs DNS (DNS/CORP/PUBLIC/PRIVATE/ZONE)"
  - "Descriptions embed resource name prefix per plan spec (e.g., 'Front Door Azure Front Door naming per CAF…') — check:data ≥50-char gate passes"
metrics:
  duration: 8 min
  completed: 2026-09-02
---

# Phase 29 Plan 01: Fourth/Fifth/Sixth CAF Resources (CAF-16..18) Summary

One-liner: Shipped azure-front-door (afd), azure-private-endpoint (pe) and azure-dns-zone (dnsz) as pure-JSON CAF conventions `prefix-[Workload]-[Region]-[Environment]` lowercase with 8-value per-resource workload libraries, EN/FR parity (1048 keys each), and vitest catalog proofs bumped 68→71 / Azure 36→39 / search-reachability 44→47 — closing milestone v1.12 at 71 conventions.

## What Was Built

### Task 1 — 3 rule JSON + 3 workload JSON (commit 8b0ea0a)

- `src/rules/azure/azure-front-door.json` — id `azure-front-door`, pattern `afd-[Workload]-[Region]-[Environment]`, Workload lib `azure/afd-workload` (default SHARED), Region `core/region` (FRC), Environment `core/environment` (PROD), examples `afd-shared-frc-prod` / `afd-web-we-dev`, builder verbatim from azure-recovery-vault.json (separator `-`, default/available/recommended segments, no locked/fixed), validation `maxLength 50`, `forceLowercase true`, `^(?!.*--)[a-z][a-z0-9-]{0,48}[a-z0-9]$`.
- `src/rules/azure/azure-private-endpoint.json` — id `azure-private-endpoint`, pattern `pe-[Workload]-[Region]-[Environment]`, Workload lib `azure/pe-workload`, examples `pe-shared-frc-prod` / `pe-data-we-dev`, identical builder/validation shape.
- `src/rules/azure/azure-dns-zone.json` — id `azure-dns-zone`, pattern `dnsz-[Workload]-[Region]-[Environment]`, Workload lib `azure/dnsz-workload`, examples `dnsz-shared-frc-prod` / `dnsz-dns-we-dev`, identical builder/validation shape.
- `src/data/segments/azure/afd-workload.json` — 8 values: SHARED Shared platform, WEB Web workload, APP Application workload, API API workload, CDN Content delivery, EDGE Edge workload, GLOBAL Global workload, FRONTEND Frontend workload.
- `src/data/segments/azure/pe-workload.json` — 8 values: SHARED Shared platform, DATA Data workload, APP Application workload, API API workload, NETWORK Network workload, SECURE Secure workload, PRIVLINK Private Link workload, ENDPOINT Endpoint workload.
- `src/data/segments/azure/dnsz-workload.json` — 8 values: SHARED Shared platform, DNS DNS workload, NETWORK Network workload, CORP Corporate, PUBLIC Public DNS, PRIVATE Private DNS, ZONE Zone workload, GLOBAL Global workload.
- No Location, no Instance, no constraints block, no Purpose field — exactly the 3-segment Region-based lowercase shape per plan. All three `defaultValue: SHARED` values exist in their respective libs.
- Collision check performed before authoring: no `afd-[`/`pe-[`/`dnsz-[` pattern among existing 36 Azure rule files.
- Verified: `npm run check:data` → **DATA GATE PASS (159 files, 0 errors)** (153 + 6 new).

### Task 2 — EN/FR locales + catalog-integrity proofs (commit 3149650)

- `src/locales/en.json` — appended `data.rule.azure-front-door.name/.description`, `data.rule.azure-private-endpoint.name/.description`, `data.rule.azure-dns-zone.name/.description` + 24 `data.lib.azure/{afd,pe,dnsz}-workload.*` keys (8 per lib) after the mlw-workload block.
- `src/locales/fr.json` — identical key set with French translations: "Front Door Azure", "Point de terminaison privé", "Zone DNS"; lib mirrors (Plateforme partagée, Charge web, Diffusion de contenu, Liaison privée, DNS public/privé, etc.).
- EN/FR flat-key parity verified programmatically: **1048 = 1048, onlyEN 0 / onlyFR 0**.
- `src/lib/data-integrity.test.ts` — catalog count 68→71 (comment `68 + 3 afd/pe/dnsz`), category counts Azure 36→39, `NEW_CONVENTION_IDS` appended `azure-front-door`, `azure-private-endpoint`, `azure-dns-zone` after `azure-machine-learning-workspace` with length expectation 44→47. All other assertions untouched.
- Gates: `npm run check:data` 159 PASS 0 errors; `npm test` **240/240 pass** (catalog 71, Azure 39, search-reachability 47 incl. `front-door`/`private-endpoint`/`dns-zone` fragments, EN=FR parity, description/pattern rules); `npm run build` green; `npm run lint` 0 errors (1 pre-existing warning only).

## How This Closes the Milestone

Milestone v1.12 CAF Expansion III is now complete: catalog 65→71 conventions (Azure 33→39) via Phase 28 (bvault/adb/mlw) + Phase 29 (afd/pe/dnsz), all as zero-code-diff pure JSON auto-discovered via `import.meta.glob`. 159 files gated, 240 tests, 1048-key EN/FR parity. CAF-16/CAF-17/CAF-18 satisfied.

## Deviations from Plan

None - plan executed exactly as written.

## Verification Evidence

| Gate | Result |
|------|--------|
| `npm run check:data` | DATA GATE PASS (159 files, 0 errors) |
| `npm test` | 240 passed (11 files), including catalog 71 / Azure 39 / reachability 47 / EN=FR |
| `npm run build` | ✓ built (tsc -b + vite), only pre-existing chunk-size warning |
| `npm run lint` | 0 errors, 1 pre-existing warning (unchanged) |
| Acceptance greps | patterns `afd-…`/`pe-…`/`dnsz-…` present; `maxLength 50` + `forceLowercase` + `(?!.*--)` present; libs contain required tokens (WEB/FRONTEND, DATA/PRIVLINK/ENDPOINT, DNS/PUBLIC/PRIVATE); FR strings "Front Door Azure"/"Point de terminaison privé"/"Zone DNS" present; EN=FR grep counts 2=2 for front-door keys |

Manual spot-check (select each convention → generate `afd-shared-frc-prod` / `pe-shared-frc-prod` / `dnsz-shared-frc-prod`) is covered mechanically by example/allowedPattern alignment in check:data and validateName wiring from Phase 19; no browser run performed by this executor.

## Self-Check: PASSED

All 9 key files + SUMMARY exist on disk; commits 8b0ea0a and 3149650 present in git log on gsd/v1.12-caf-expansion-iii.

