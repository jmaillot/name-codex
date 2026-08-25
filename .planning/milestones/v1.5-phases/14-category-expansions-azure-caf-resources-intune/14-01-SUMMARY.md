---
phase: 14-category-expansions-azure-caf-resources-intune
plan: 01
subsystem: data-naming-rules
tags: [azure, caf, naming-conventions, i18n, data-driven]
requires:
  - import.meta.glob rule auto-discovery (src/lib/data.ts)
  - validation-rules.json shadowing precedence (src/lib/validation.ts)
  - EN/FR flat-key locale resolution (src/lib/segments.ts)
provides:
  - azure-storage-account convention (AZURE-01)
  - azure-key-vault convention (AZURE-02)
  - azure-network-security-group convention (AZURE-03)
  - azure-public-ip convention (AZURE-04)
  - azure/caf-workloads segment library
affects:
  - Azure category navigation (auto-discovers 12 conventions)
  - governance scoring / validation for new conventions
tech-stack:
  added: []
  patterns:
    - pure data-driven JSON convention (zero TypeScript changes)
    - literal-prefix pattern tokens (kv-, nsg-, pip-) via parsePattern/useAppState literalPrefixes
    - separator:"" for direct concatenation (storage account outlier)
key-files:
  created:
    - src/rules/azure/azure-storage-account.json
    - src/rules/azure/azure-key-vault.json
    - src/rules/azure/azure-network-security-group.json
    - src/rules/azure/azure-public-ip.json
    - src/data/segments/azure/caf-workloads.json
  modified:
    - src/locales/en.json
    - src/locales/fr.json
decisions:
  - "Key vault start-letter/end-alnum anchors hard-enforced via regex ^[A-Za-z][A-Za-z0-9-]*[A-Za-z0-9]$; 3-char minimum and no-consecutive-hyphens carried as description tips only (D-10)"
  - "Storage Account validation block kept byte-equivalent to the shadowing validation-rules.json Azure>Storage Account entry so precedence is behaviorally irrelevant (13-D-12 respected; file untouched)"
  - "caf-workloads created as new dedicated library instead of extending core/workload.json (D-12)"
metrics:
  duration: ~6 min
  completed: 2026-08-25
---

# Phase 14 Plan 01: Azure CAF Resource Conventions Summary

Four CAF-standard Azure conventions (Storage Account no-hyphen/lowercase outlier, Key Vault with anchored validation, NSG, Public IP) plus an 8-value CAF workload library added as pure data JSON — zero TypeScript changes, fully bilingual.

## What Was Built

- **Task 1** (`79896ce`): `src/data/segments/azure/caf-workloads.json` with 8 CAF abbreviations (st, kv, nsg, pip, vm, vnet, nic, app); `azure-key-vault.json` (kv-[Workload]-[Environment]-[Region], maxLength 24 + `^[A-Za-z][A-Za-z0-9-]*[A-Za-z0-9]$` anchors); `azure-network-security-group.json` (nsg-[Workload]-[Instance]); `azure-public-ip.json` (pip-[Workload]-[Environment]-[Region]-[Instance]) — all with baseline `^[A-Za-z0-9_.-]+$` validation and ReDoS-safe anchored class regexes per T-14-01.
- **Task 2** (`be8d19c`): `azure-storage-account.json` — pattern `st[Workload][Environment][Instance]`, `"separator": ""` for direct concatenation (empty string passes the `?? "-"` default in useAppState.ts:227), forceLowercase + removeCharacters [-,_,.] + `^[a-z0-9]+$`, endpoint-uniqueness tip in description (stprovad001.blob.core.windows.net).
- **Task 3** (`3d893dd`): 18 new keys per language in en.json/fr.json (4× rule name/description, 8× lib option descriptions, 1× absent data.field.Instance.tip) with faithful FR translations; parity holds.

## Verification Results

| Gate | Result |
|------|--------|
| Task 1 node checks (ids, patterns, kv regex accepts KV-APP-PROD-FRC, lib has st) | PASS |
| All field.library values resolve on disk | PASS |
| allowedPattern grep gate (anchored classes only, no nested quantifiers/lookahead) | PASS |
| Storage pipeline simulation ST-APP-PROD-001 → stappprod001 passes ^[a-z0-9]+$ | PASS |
| Shadowing block byte-equivalence confirmed against validation-rules.json | PASS |
| `npx vitest run` | 143/143 passed (6 files incl. data-integrity gates over new files) |
| `npm run build` (after Linux `npm ci`) | exit 0 |
| `npm run lint` | exit 0 (5 pre-existing warnings, 0 errors) |
| EN/FR key-count parity | equal |
| `ls src/rules/azure/*.json \| wc -l` | 12 (8 existing + 4 new) |
| `git diff --stat src/data/validation-rules.json src/data/segments/core/workload.json` | empty (untouched) |

Note: the double-hyphen case (`KV--X`) passes the key-vault anchor regex by design — documented as tip-only sub-rule per D-10 (plan explicitly accepted this).

## Deviations from Plan

None — plan executed exactly as written.

One environmental note: locale JSON files are nested (`{ui:{}, data:{...dotted keys}}`), not top-level flat as the plan's verify script assumed; verification was adapted to check under `.data` where all dotted keys live. No content deviation.

## Known Stubs

None — every convention is fully wired through existing auto-discovery, builder, validation, and i18n resolution paths.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 79896ce | feat(14-01): add CAF workload library + Key Vault, NSG, Public IP conventions |
| 2 | be8d19c | feat(14-01): add storage account outlier convention (no-separator, lowercase-only) |
| 3 | 3d893dd | feat(14-01): add EN/FR locale keys for Azure CAF conventions |

## Self-Check: PASSED

- FOUND: src/rules/azure/azure-storage-account.json
- FOUND: src/rules/azure/azure-key-vault.json
- FOUND: src/rules/azure/azure-network-security-group.json
- FOUND: src/rules/azure/azure-public-ip.json
- FOUND: src/data/segments/azure/caf-workloads.json
- FOUND: commit 79896ce
- FOUND: commit be8d19c
- FOUND: commit 3d893dd
