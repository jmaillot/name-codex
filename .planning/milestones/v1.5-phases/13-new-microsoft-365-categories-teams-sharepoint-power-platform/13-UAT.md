---
status: complete
phase: 13-new-microsoft-365-categories-teams-sharepoint-power-platform
source: [13-01-SUMMARY.md, 13-02-SUMMARY.md, 13-03-SUMMARY.md]
started: 2026-08-24T17:35:00Z
updated: 2026-08-24T17:50:00Z
---

## Current Test

number: none
name: session complete
expected: |
  All 9 tests executed.
awaiting: n/a

## Tests

### 1. New categories appear in nav with brand icons
expected: Open the app — Teams, SharePoint, Power Platform, Purview appear alphabetically in the left nav, each with its own official Microsoft brand icon (no Azure fallback) and a distinct brand color.
result: pass

### 2. Light mode keeps icons legible
expected: Toggle light mode (sun/moon in command bar). All four new category icons adapt color — none become invisible or low-contrast against light surfaces.
result: pass

### 3. Teams Project Team — fixed prefix, no Prefix segment
expected: Select Teams → Project Team. The builder shows only Workload and Function segments (no editable Prefix control). The generated name starts with the literal `PRJ-` (e.g. `PRJ-Atlas-Finance`). A name over 30 chars is flagged by validation.
result: pass

### 4. Teams M365 Group Naming Policy — attribute tokens
expected: Select Teams → M365 Group Naming Policy. Generated name starts with locked `GRP_`. The Department field's dropdown offers `[Department]`-style Entra attribute tokens ([Department], [Company], [Office], [StateOrProvince], [CountryOrRegion], [Title]). An InfoIcon tip shows on GroupName.
result: pass

### 5. SharePoint Team Site — URL validation + inheritance tip
expected: Select SharePoint → Team Site. Typing uppercase letters or spaces triggers validation steering toward lowercase-hyphenated names. The site-name field tip mentions that group-connected sites inherit the M365 group naming policy.
result: pass

### 6. Power Platform Environment — ALM pattern
expected: Select Power Platform → Environment. Pattern shows `[Lifecycle]-[Region]-[BusinessUnit]-[Purpose]`; Lifecycle dropdown offers dev/test/sbx/uat/prod; output is forced lowercase; the Lifecycle tip covers sandbox-vs-production guidance.
result: pass

### 7. Purview Sensitivity Label — sublabel variant
expected: Select Purview → Sensitivity Label. Switch the pattern variant to Sublabel and build e.g. `Confidential-Payroll` from the classification taxonomy (Personal…Highly Confidential). Entering a double quote results in it being stripped/invalid at generation.
result: issue — works, but user prefers no spaces in sublabel names (see gap below, minor)

### 8. Purview gotcha tooltips
expected: Hover the InfoIcons on Purview Retention Label ("cannot be changed after save" + no double quotes), Retention Policy (7-day application lead-time), and DLP Policy (old names persist forever in audit records). Each shows its gotcha tooltip.
result: pass

### 9. French language parity for new content
expected: Switch the language to Français. All four new categories, their rule names/descriptions, segment labels, and gotcha tips render in French (e.g. « étiquette de rétention », « Hautement confidentiel »). No English leftovers in the new content.
result: pass

## Summary

total: 9
passed: 8
issues: 1
pending: 0
skipped: 0
blocked: 0

- truth: "Purview sensitivity label sublabel names contain no spaces (e.g. Confidential-Payroll)"
  status: failed
  reason: "User reported: the only thing is i would prefer without spaces there"
  severity: minor
  test: 7
  root_cause: ""
  artifacts: []
  missing: []
  debug_session: ""
