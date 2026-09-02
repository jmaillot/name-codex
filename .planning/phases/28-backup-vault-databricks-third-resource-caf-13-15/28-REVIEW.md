---
status: clean
phase: 28-backup-vault-databricks-third-resource-caf-13-15
plan: 01
depth: standard
files_reviewed: 9
findings:
  critical: 0
  warning: 0
  info: 1
  total: 1
reviewed_at: 2026-09-02T12:00:00Z
reviewer: gsd-code-reviewer
---

# Code Review — Phase 28: Backup Vault + Databricks + Machine Learning Workspace (CAF-13..15)

**Depth:** standard  
**Files reviewed:** 9 (3 rule JSON, 3 workload JSON, 2 locale JSON new-key deltas, 1 test)  
**Scope source:** `.planning/phases/28-backup-vault-databricks-third-resource-caf-13-15/28-01-SUMMARY.md` key_files (Tier 2)

## Summary

Phase 28 ships three Azure CAF conventions (`bvault`/`adb`/`mlw`) as pure data-driven JSON per `28-CONTEXT.md` D-03..D-09 and `28-PATTERNS.md` canonical precedents. All rule JSON copy `azure-recovery-vault.json` / `azure-synapse-workspace.json` builder and validation verbatim, workload libs follow `rsv-workload.json` / `synw-workload.json` shape, EN/FR parity holds (1018 keys each), and `src/lib/data-integrity.test.ts` proofs bump 65→68 / Azure 33→36 / NEW_CONVENTION_IDS 41→44. No code changes beyond JSON+locale+test — consistent with Phase 19 constraint wiring. No bugs, security issues, or code-quality defects found at standard depth.

## Files Reviewed

- `src/rules/azure/azure-backup-vault.json` — BVault CAF rule `bvault-[Workload]-[Region]-[Environment]`
- `src/rules/azure/azure-databricks-workspace.json` — Databricks CAF rule `adb-[Workload]-[Region]-[Environment]`
- `src/rules/azure/azure-machine-learning-workspace.json` — ML Workspace CAF rule `mlw-[Workload]-[Region]-[Environment]`
- `src/data/segments/azure/bvault-workload.json` — BVault workload library 8 values
- `src/data/segments/azure/adb-workload.json` — ADB workload library 8 values
- `src/data/segments/azure/mlw-workload.json` — MLW workload library 8 values
- `src/locales/en.json` — 30 new keys (6 rule name/description + 24 lib values)
- `src/locales/fr.json` — FR mirror 30 keys
- `src/lib/data-integrity.test.ts` — catalog proofs updated to 68/36/44

## Findings

### Info — 1 observation (non-blocking)

#### IN-01 — `adb-workload.ETL` identical EN/FR display value is intentional — precedent-consistent

- **Files:** `src/locales/en.json:1012` `src/locales/fr.json:ETL` (`data.lib.azure/adb-workload.ETL` = `Extract Transform Load` in both)
- **Severity:** info (no fix required)
- **Detail:** Both locales render `Extract Transform Load` for `ETL`. This is consistent with the existing precedent `data.lib.azure/adf-workload.ETL` which is also identical EN/FR (`ad`f:1015), and the acronym has no idiomatic FR translation. `src/lib/data-integrity.test.ts:219` parity gate passes (1018 keys each, flat sets equal), and the value is an acronym label rather than a translatable phrase.
- **Recommendation:** No change. If a FR variant is desired in future, `ETL` → `Extraction, Transformation et Chargement` would be the idiomatic translation, but retaining the English acronym matches current product taxonomy and avoids divergence from `adf-workload.ETL`.

## Detailed Checks

### Rule JSON correctness (`src/rules/azure/*.json`)

**Verdict: PASS — no issues**

- **Schema shape:** Each file has required `id` (`azure-backup-vault`, `azure-databricks-workspace`, `azure-machine-learning-workspace`), `category: Azure`, `name`, `description`, `pattern`, `fields[3]`, `examples[2]`, `builder`, `validation` — validated against `docs/DATA-FORMAT.md` and `scripts/check-data.mjs:51-135` expectations.
- **Pattern:** `bvault-[Workload]-[Region]-[Environment]`, `adb-[Workload]-[Region]-[Environment]`, `mlw-[Workload]-[Region]-[Environment]` — all lowercase per D-04, 3-segment Region-based per D-03/D-05.
- **Fields:** `Workload → azure/<id>-workload` (`bvault-workload`/`adb-workload`/`mlw-workload`), `Region → core/region`, `Environment → core/environment`; each has `defaultValue` (`SHARED` for bvault/mlw, `DATA` for adb), `allowCustomValue: true` per D-07. Defaults verified present in corresponding lib (SHARED/DATA in bvault/adb/mlw).
- **Builder:** Copied verbatim from `azure-recovery-vault.json:28-36` — `separator: "-"`, `defaultSegments: [Workload, Region, Environment]`, `availableSegments` adds `Custom`, `recommendedSegments: [Workload]`, no locked/fixed segments — matches `28-PATTERNS.md:27-73` and D-09. No `Location` or `Instance` segment, no `constraints` block per D-07 — correct.
- **Validation:** `maxLength: 50`, `forceLowercase: true`, `allowedPattern: "^(?!.*--)[a-z][a-z0-9-]{0,48}[a-z0-9]$"` — exact copy of `azure-recovery-vault.json:37-41` / `azure-synapse-workspace.json` per D-08. Formula `N = maxLength-2 = 48` correct. `allowedPattern` compiles; verified both examples per rule match (`bvault-shared-frc-prod`, `bvault-backup-we-dev`, `adb-data-frc-prod`, `adb-analytics-we-dev`, `mlw-shared-frc-prod`, `mlw-train-we-dev`). `forceLowercase` ensures generated names lowercased before validation.
- **Description quality:** Lengths 285/307/301 chars ≥50, none contain their own `pattern` string — passes `data-integrity.test.ts:227-228` and `check-data.mjs:70-72`.
- **Examples:** Lowercase, hyphen-separated, satisfy `allowedPattern` and `maxLength 50`.
- **No injection / trust-boundary issue:** Static curated JSON, no user input templating; `allowedPattern` with `(?!.*--)` prevents double-hyphen injection; `validateName` enforces at runtime per threat T-28-01.

### Workload libraries (`src/data/segments/azure/*-workload.json`)

**Verdict: PASS — no issues**

- **Structure:** Each has `name: "Workload"` matching `fields[0].name`, and `values: [8]` — matches `rsv-workload.json` / `synw-workload.json` shape per `28-PATTERNS.md:144-221`.
- **Uniqueness:** 8 values each, all unique within file (passes `check-data.mjs:138-230`).
- **Token shape:** All `value` tokens UPPERCASE alphanumeric (`^[A-Z0-9]+$`), no whitespace.
- **Descriptions:** All non-empty, short noun phrases.
  - bvault: `SHARED Shared platform`, `BACKUP Backup workload`, `ARCHIVE Archive workload`, `DR Disaster recovery`, `SERVER Server backup`, `DATA Data workload`, `SAP SAP workload`, `VAULT Vault workload` — per PLAN Task 1 spec.
  - adb: `DATA Data`, `ANALYTICS Analytics`, `AI AI workload`, `ML Machine learning`, `DATALAKE Data Lake`, `ETL Extract Transform Load`, `STREAMING Streaming analytics`, `BI Business Intelligence` — per spec; distinct from synw/adb data/AI libs with Databricks compute bias, satisfies D-02 distinct-taxonomy rule.
  - mlw: `SHARED Shared platform`, `TRAIN Model training`, `INFER Model inference`, `ML Machine learning`, `AI AI workload`, `DATA Data workload`, `RESEARCH Research`, `ANALYTICS Analytics` — ML-training taxonomy distinct from synw/adb per D-02.
- **Default alignment:** `azure-backup-vault` default `SHARED` ∈ bvault, `azure-databricks-workspace` default `DATA` ∈ adb, `azure-machine-learning-workspace` default `SHARED` ∈ mlw.
- **No constraints block** per D-07 — correct omission.

### Locales (`src/locales/en.json`, `src/locales/fr.json`) — new-key delta

**Verdict: PASS — no issues**

- **Key count:** 30 new keys = 6 rule (`3× name+description`) + 24 lib (`3×8 workload values`) — verified via `grep -c` and flattened key inspection (`28-01-PLAN.md:49-54` expectations met).
- **EN/FR parity:** Flat key sets identical — 1018 keys each, `Set(enKeys) == Set(frKeys)` — passes `data-integrity.test.ts:219-222` (`flattenKeys` both directions). No drift.
- **Rule translations:** FR names `Coffre de sauvegarde`, `Espace de travail Databricks`, `Espace de travail Machine Learning` — correct CAF FR terminology per SUMMARY. Descriptions are full FR translations, not partial.
- **Lib translations:** FR workload values correctly localized (e.g., `bvault-workload.SHARED Plateforme partagée`, `adb-workload.ANALYTICS Analytique`, `mlw-workload.TRAIN Entraînement de modèle`), with acronym `ETL` intentionally identical — see IN-01.
- **Commutativity:** All 30 EN keys have FR mirrors and vice versa — `grep -c` counts equal (2 rule keys each, 8 lib keys each per resource).

### Test file (`src/lib/data-integrity.test.ts`)

**Verdict: PASS — no issues**

- **Catalog count:** `expect(allConventions.length).toBe(68)` with comment `65 + 3 bvault/adb/mlw` — correct bump from 65 to 68 per ROADMAP. Verified `allConventions` auto-discovered via `import.meta.glob` — no code diff needed.
- **Category counts:** `Azure: 36` (33→36) — correct, other 10 categories unchanged, totals 68.
- **NEW_CONVENTION_IDS:** Appended `azure-backup-vault`, `azure-databricks-workspace`, `azure-machine-learning-workspace` in alphabetical order after `azure-synapse-workspace` — alphabetical-ish per PLAN line 137, satisfies `28-01-PLAN.md:141`. Length bump `41→44` correct (`expect(NEW_CONVENTION_IDS.length).toBe(44)`).
- **Search-reachability predicate:** Mirrors `useAppState` `filteredConventions` (`name/description/id/pattern` substring on partial id fragment) — still exercises real substring matching, not tautological `c.id.includes(c.id)` — unchanged and correct.
- **Locale parity proofs:** `enKeys == frKeys` dynamic check covers new keys without hard-coded count — no update needed, already green.
- **Description invariant:** `≥50` and `!includes(pattern)` loop covers new conventions automatically.

## Security Review

- **Tampering (T-28-01) — pattern injection:** All `allowedPattern` values are static, anchored, lowercase-hyphen with `(?!.*--)` guard; `validateName` enforces at runtime. No user-controlled regex. PASS.
- **Spoofing (T-28-02) — workload values:** Static curated taxonomy, no user input in JSON; `check-data.mjs` asserts values non-empty unique. PASS.
- **Information disclosure (T-28-03) — locales:** Static bilingual strings, no secrets. PASS.
- **Supply chain (T-28-SC):** No new dependencies, no install scripts. PASS.

## Verification Performed

- Parsed and validated all 3 rule JSON + 3 workload JSON as JSON; checked schema invariants, builder/validation verbatim copy vs `azure-recovery-vault.json`, allowedPattern compilation, examples matching, defaultValue ∈ lib.
- Flattened EN/FR locale key sets (1018 each) and verified parity; spot-checked rule/workload translations.
- Inspected `src/lib/data-integrity.test.ts:146-184` assertions for 68/36/44 correctness and ordering.

## Recommendation

**Status `clean` — no fixes required.** Phase is ready to proceed to Phase 29 (CAF-16..18). Optional: if FR translation for `adb-workload.ETL` should be localized, align with `adf-workload.ETL` decision globally — currently consistent as-is.

---

*Reviewed at standard depth per `code-review.md`. Rule library verification done via pattern precedent comparison, not live `npm run check:data` / `npm test` execution in this agent session (SUMMARY reports gates green: `check:data` 153 files PASS, `npm test` 240 pass, `npm run build` Vite success, `check:tokens` 18/18 WCAG).*
