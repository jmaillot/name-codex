---
phase: 13-new-microsoft-365-categories-teams-sharepoint-power-platform
plan: 02
subsystem: data-layer
tags: [json-data, power-platform, purview, i18n, naming-conventions]
requires:
  - src/lib/data.ts ruleModules glob auto-discovery
  - src/types/Rule.ts schema (NamingConvention/NamingPatternOption/NamingValidationConfig)
  - src/data/segments/core/region.json + core/department.json + core/purpose.json libraries
provides:
  - Power Platform category with pp-environment convention (<lifecycle>-<region>-<bu>-<purpose>, forceLowercase)
  - Purview category with 4 conventions (sensitivity label w/ patterns[] variants, retention label, retention policy, DLP policy)
  - src/data/segments/power-platform/lifecycle.json (dev/test/sbx/uat/prod per D-11)
  - src/data/segments/purview/classification.json (5-tier taxonomy incl. Highly Confidential)
  - EN/FR locale keys for all new rules, fields and lib values (parity 339=339)
affects:
  - Phase 13 plan 03 (Azure/Intune expansions follow same pattern)
tech-stack:
  added: []
  patterns:
    - "patterns[] multiple NamingPatternOption variants on ONE convention file (D-14: PURV-01 parent label + sublabel keeps convention count intact)"
    - validation.removeCharacters[] generation-time character stripping (Purview no-double-quotes rule)
key-files:
  created:
    - src/rules/power-platform/pp-environment.json
    - src/rules/purview/purview-sensitivity-label.json
    - src/rules/purview/purview-retention-label.json
    - src/rules/purview/purview-retention-policy.json
    - src/rules/purview/purview-dlp-policy.json
    - src/data/segments/power-platform/lifecycle.json
    - src/data/segments/purview/classification.json
  modified:
    - src/locales/en.json (+31 keys across tasks 1-3)
    - src/locales/fr.json (+31 keys)
decisions:
  - "PURV-01 as ONE convention with patterns[] two variants (parent-label, sublabel) per D-14 — roadmap's 12-convention count preserved"
  - "power-platform/lifecycle.json created as a genuinely new lowercase ALM value set rather than reusing uppercase core/environment (D-11)"
  - "Shared neutral data.field.PolicyName.tip covering both retention-policy (7-day lead time) and DLP (audit persistence) semantics; precise per-convention wording stays in each rule JSON's field tip fallback"
metrics:
  duration: "~10 min"
  completed: 2026-08-24
---

# Phase 13 Plan 02: Power Platform & Purview Categories Summary

**One-liner:** 5 new JSON conventions across two new categories — PP environment names per ALM strategy (`dev-westeurope-it-sandbox`, lowercase-enforced) and four Purview compliance-object types with Microsoft-documented gotchas (immutable-after-save, no double quotes, 7-day lead time, audit persistence) surfaced as bilingual InfoIcon tips — plus lifecycle and classification segment libraries, fully EN/FR parity (339=339), zero code changes.

## What Was Built

### Task 1 — Power Platform category (commit c695d5a)

- `src/rules/power-platform/pp-environment.json` — `[Lifecycle]-[Region]-[BusinessUnit]-[Purpose]` ALM pattern; `forceLowercase` + `^[a-z0-9-]+$`; Lifecycle field tip carries the sandbox-vs-production type guidance; description covers minimum Dev/Test/Prod coverage and renaming the `{tenant} (default)` environment.
- `src/data/segments/power-platform/lifecycle.json` — exactly dev/test/sbx/uat/prod (new value set per D-11; core Environment left untouched).
- Region/BusinessUnit/Purpose reuse existing `core/region`, `core/department`, `core/purpose` libraries.
- Locale keys (EN+FR): rule name/description, 5 lifecycle values, `Lifecycle.label/.tip`, `BusinessUnit.label`.

### Task 2 — Purview sensitivity label (commit fb0d65c)

- `src/rules/purview/purview-sensitivity-label.json` — **ONE** convention with `patterns[]` holding TWO variants (`parent-label`: `[Classification]`; `sublabel`: `[Classification]-[Sublabel]`) per D-14, so the 12-convention count stays intact.
- `validation.removeCharacters: ["\""]` strips double quotes at generation time; `allowedPattern ^[A-Za-z0-9 &/-]+$` permits taxonomy spaces ("Highly Confidential") and M&A-style sublabels.
- `src/data/segments/purview/classification.json` — Personal/Public/General/Confidential/Highly Confidential.
- Locale keys (EN+FR): rule name/description, 5 taxonomy values (incl. « Hautement confidentiel »), `Classification.label/.tip`, `Sublabel.label/.tip`.

### Task 3 — Retention labels/policies + DLP policy (commit 47e70b6)

- `purview-retention-label.json` (PURV-02) — immutability gotcha: "The name CANNOT be changed after save"; tip also covers no-double-quotes + up-to-7-days policy application.
- `purview-retention-policy.json` (PURV-03) — 7-day application lead-time + plan-names-before-creation guidance.
- `purview-dlp-policy.json` (PURV-04) — renamable BUT old names persist forever in audit/alert records.
- All three share `removeCharacters: ["\""]` + simple anchored `^[A-Za-z0-9 &/_()-]+$` (ReDoS-safe per T-13-02-01).
- Locale keys (EN+FR): 3× rule name/description (« étiquette de rétention », « délai d'application de 7 jours », « les anciens noms persistent dans les enregistrements d'audit »…), `LabelName.label/.tip`, shared neutral `PolicyName.label/.tip`.

## Verification

- `npm run build` exit 0 · `npm run lint` exit 0 (warnings pre-existing only) · `npm test -- --run`: **6 files / 137 tests passed**
- All 7 new JSON files parse; categories verified `"Power Platform"` ×1 and `"Purview"` ×4
- patterns[] structure: exactly 2 variants with ids `parent-label` + `sublabel`; top-level `pattern` still present
- Gotcha string gates: "cannot be changed"/"7 days" in retention label, "7-day" in retention policy, "audit" in DLP policy
- EN/FR full-file key parity: 339 = 339 (node deep-equal on sorted key lists)
- Zero code changes: categories appear via existing `import.meta.glob('../rules/**/*.json')` auto-discovery

## Deviations from Plan

### Plan Clarifications (no code change)

**1. [Plan arithmetic error] Task-3 acceptance criterion "`ls src/rules/purview/` returns exactly 5 files" contradicts the plan's own file lists**
- **Found during:** task 3 acceptance verification
- **Issue:** The plan's `files_modified`, `must_haves.artifacts`, and requirements (PP-01, PURV-01..04) enumerate exactly **4** Purview rule JSONs — PURV-01 counts as ONE convention per D-14. The "5 files" acceptance text and the `<verification>` line "1 + 5 parseable JSON files" are off-by-one against the plan's own structure (correct totals: 4 purview + 1 power-platform = 5 conventions/files overall).
- **Resolution:** Delivered exactly the 4 enumerated Purview files; no fifth convention fabricated (that would violate D-11/D-14 and the must_haves artifact list). All substantive acceptance criteria pass as written.

**2. [Plan text clarification] Task-3 locale note mentions `data.field.PolicyName.tips` (plural) once, then correctly specifies `.tip` throughout**
- **Found during:** task 3 locale key authoring
- **Resolution:** Implemented `.label` + `.tip` (singular) matching the resolution scheme the plan itself describes and all existing locale key conventions.

## Auth Gates

None.

## Known Stubs

None — every field/example/tip is real data drawn from the plan and Microsoft documentation.

## Threat Flags

None — no new surface beyond the plan's threat model. T-13-02-01 mitigated: all new `allowedPattern` regexes are simple anchored character classes (no nested quantifiers, no alternation overlap → ReDoS-safe); T-13-02-02/T-13-02-03 accepted as planned (generation-only tooling; authoritative enforcement remains in Microsoft Purview).

## Self-Check: PASSED

- All 7 created files exist on disk and parse (verified via node JSON.parse)
- Commits verified in git log: c695d5a, fb0d65c, 47e70b6
