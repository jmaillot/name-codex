---
status: resolved
phase: 14-category-expansions-azure-caf-resources-intune
source: [14-01-SUMMARY.md, 14-02-SUMMARY.md]
started: 2026-08-25T07:45:00Z
updated: 2026-08-25T12:00:00Z
resolved_by: [14-03-SUMMARY.md, 14-04-SUMMARY.md, 14-05-SUMMARY.md]
---

## Current Test

[testing complete]

## Tests

### 1. New Azure conventions appear in nav
expected: Open the app and expand the Azure category. Alongside the existing conventions you now see four new entries: Storage Account, Key Vault, Network Security Group, and Public IP (12 total in Azure). Each shows a proper localized name (not a raw id like "azure-key-vault").
result: pass

### 2. Key Vault builder enforces its documented rules
expected: Select Key Vault. The pattern is kv-[Workload]-[Environment]-[Region] with a fixed `kv-` prefix. A valid name like `kv-app-prod-frc` validates green. A name with consecutive hyphens (e.g. manually forcing `kv--app`) or shorter than 3 characters is flagged as invalid, and nothing over 24 characters passes. (This is the CR-01 fix from code review.)
result: pass
resolved: "Fixed by plan 14-03 (assembleRawName segment-driven assembly); user verified in browser and approved"
severity: major

### 3. Storage Account normalizes to lowercase no-separator form
expected: Select Storage Account. The pattern st[Workload][Environment][Instance] concatenates directly with NO separators. Typing uppercase or hyphenated segment values (e.g. APP / PROD / 001, or anything producing ST-APP-PROD-001) yields an all-lowercase, letters-and-digits-only result like `stappprod001`, which validates green against the `^[a-z0-9]+$` rule.
result: pass

### 4. Workload dropdown excludes each rule's own resource prefix
expected: In the Key Vault rule, the Workload dropdown offers CAF workload options but NOT `kv`. In Network Security Group it omits `nsg`; in Public IP it omits `pip`; in Storage Account it omits `st`. Selecting any offered workload produces a sensible name — no `NSG-NSG-001` or `ststprod001` degenerate output. (This is the WR-03 fix.)
result: pass

### 5. New Intune conventions appear in nav
expected: Expand the Intune category — four new entries appear: Autopilot Device Name, Group Tag, Update Ring, and Assignment Group (9 total in Intune), each with a localized display name.
result: pass

### 6. Autopilot device name: variants, macro dropdown, 15-char budget
expected: Select Autopilot Device Name. A pattern variant picker offers three choices (prefix+serial, prefix+random, custom template). The Macro field opens a dropdown containing %SERIAL% and %RAND:1% through %RAND:15%. The generated/template name counts typed characters against the 15-char budget — e.g. `DT-%RAND:4%` passes, while a template longer than 15 typed characters is flagged. The displayed example does not fail its own length check. (WR-01 fix verified here.)
result: pass
resolved: "Fixed by plan 14-04 (budget-aware RAND macros, %RAND:12% default, prefix-reactive clamp); user verified in browser and approved"
severity: major

### 7. Update Ring locks taxonomy to the four rings
expected: Select Update Ring. The ring field is a dropdown with exactly Pilot, Dev, Broad, Production — you cannot type a custom/free-text value into it, and the generated name starts with that ring token in its pinned position.
result: pass

### 8. Group Tag allows custom codes; Assignment Group prefix is locked
expected: Group Tag offers sample tag values in a dropdown but also accepts a custom typed value. Assignment Group builds as [GroupPrefix]-[GroupName] where GroupPrefix only offers INTUNE-DEV or INTUNE-USR from its dropdown.
result: pass

### 9. French translations for all new content
expected: Switch the app language to French. All eight new conventions show French names and descriptions (e.g. "Compte de stockage", "Coffre de clés", "Anneau de mise à jour", "Balise de groupe"), including field tips and dropdown option descriptions — no English leftovers or missing-translation keys in the new UI areas.
result: pass

## Summary

total: 9
passed: 9
issues: 0
pending: 0
skipped: 0
blocked: 0

## Gaps

- truth: "Adding a custom segment value updates the generated name (tested on Key Vault builder)"
  status: resolved
  reason: "User reported: if i add a custom segment, nothing is updated in the name"
  severity: major
  test: 2
  root_cause: "useAppState.ts (~245-259): generatedName is assembled by iterating static patternTokens from parsePattern(activePattern); segments added via addCustomSegment get a sourceName absent from the static pattern, so their values are never read during name assembly. dynamicPattern renders from builderSegments, so the segment shows in the pattern box (with Modified badge) but its value is dropped from generatedName. Affects ALL conventions with a Segment Builder, not just Key Vault."
  artifacts:
    - path: "src/hooks/useAppState.ts"
      issue: "rawName maps over static patternTokens instead of live builderSegments; custom segments can never match a token"
  missing:
    - "Assemble generatedName by iterating builderSegments (using the literalPrefixes / patternSuffix / separator logic dynamicPattern already uses) so every visible segment contributes its value at its list position"
  debug_session: ".planning/debug/custom-segment-name-not-updating.md"

- truth: "With prefix+random variant (e.g. prefix DT-), the suggested/random macro length adapts so the template stays within the 15-character budget; selecting PREFIX+RANDOM defaults to a RAND macro, not SERIAL"
  status: resolved
  reason: "User reported: if the prefix is defined like DT-, make the %RAND:number% fewer to be strict on the 15 typed characters. Follow-up: when selecting PREFIX+RANDOM variant, the default selected Macro value is SERIAL."
  severity: major
  test: 6
  root_cause: "No budget-aware or variant-reactive macro sizing exists anywhere: autopilot-macros.json statically offers %RAND:1%-15%; optionsForSegment (src/lib/segments.ts) supports only exact-value filtering (nothing length/computed-based keyed on another segment's value); patterns define no per-variant field values so buildSegments applies the single global defaultValue %SERIAL% even on prefix-random; validateName enforces maxLength 15 on typed template text only, with no expansion simulation."
  artifacts:
    - path: "src/rules/intune/intune-autopilot-device-name.json"
      issue: "patterns have no per-variant Macro default/fixedValues"
    - path: "src/data/segments/intune/autopilot-macros.json"
      issue: "unfiltered static %RAND:1-15% list offered regardless of prefix"
    - path: "src/lib/segments.ts"
      issue: "optionsForSegment lacks computed/length-based option filtering"
    - path: "src/lib/validation.ts"
      issue: "maxLength enforced on typed string only, not expansion-aware"
  missing:
    - "Per-variant Macro default so prefix-random selects a %RAND:n% instead of %SERIAL%"
    - "Budget-aware option filtering / dynamic default: n adapts to sibling Prefix length so expanded output stays within maxLength"
  debug_session: ".planning/debug/autopilot-rand-not-budget-aware.md"

- truth: "Update Ring rule exposes a helpful tip explaining the four-ring taxonomy"
  status: resolved
  reason: "User reported: for Update Ring, i'll also add a tip, there is none"
  severity: minor
  test: 7
  root_cause: "intune-update-ring.json defines no inline tip on any field; no corresponding tip keys authored in locales."
  artifacts:
    - path: "src/rules/intune/intune-update-ring.json"
      issue: "no tip defined"
    - path: "src/locales/en.json"
      issue: "no corresponding tip key"
    - path: "src/locales/fr.json"
      issue: "no corresponding tip key"
  missing:
    - "Author EN/FR tip content and wire it to the appropriate field in intune-update-ring.json (respect IN-01 rule-scoped namespacing concern from code review)"
  debug_session: ""
