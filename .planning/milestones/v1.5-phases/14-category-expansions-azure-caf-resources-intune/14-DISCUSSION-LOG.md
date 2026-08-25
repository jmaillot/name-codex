# Phase 14: Category Expansions — Azure CAF Resources + Intune - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-24
**Phase:** 14-category-expansions-azure-caf-resources-intune
**Areas discussed:** Storage-account no-hyphen handling, Autopilot 15-char macro budget, Key-vault 3-char minimum, CAF abbreviation & segment sources

---

## Storage-account no-hyphen handling

| Option | Description | Selected |
|--------|-------------|----------|
| Literal prefix, no separators | Pattern `st[Workload][Environment][Instance]`, segments concatenate directly | ✓ |
| Hyphenated like other Azure rules | Visual consistency, but breaks the official no-hyphen rule | |
| Hard validation via schema | forceLowercase + whole-name `^[a-z0-9]+$` (zero code) | ✓ |
| Soft tip only | User can violate; loses governance points only | |
| maxLength + uniqueness tip | 24-char cap hard; uniqueness taught via endpoint example tip | ✓ |
| maxLength only | No education about global uniqueness | |
| Auto-lowercase + pattern guard | forceLowercase transforms input; pattern catches hyphens/symbols | ✓ |
| Flag only, no transform | Uppercase shown as live error user must fix | |

**User's choice:** All recommended options accepted.
**Notes:** Storage account is the deliberate exception to the hyphenated Azure category norm.

---

## Autopilot 15-char macro budget

| Option | Description | Selected |
|--------|-------------|----------|
| Literal count + expansion tip | maxLength 15 on literal text; tip explains %SERIAL% expands at enrollment | ✓ |
| Macro-expansion estimate | Treat %SERIAL% as ~7 chars, warn on estimate — requires code change | |
| Tip only, no maxLength | No hard limit | |
| Macro dropdown library | intune/autopilot-macros.json with %SERIAL% and %RAND:1..15%; custom still allowed | ✓ |
| Free-text macros | Typed manually; typo-prone | |
| Charset pattern + all-numbers tip | allowedPattern for charset; not-all-numbers as bilingual tip (lookahead regex too opaque) | ✓ |
| Full regex incl. not-all-numbers | Lookahead `^(?!^[0-9]+$)…` fully hard but opaque checklist string | |
| Soft guidance only | Tips only | |
| patterns[] variants | One convention, variants e.g. "Prefix + serial" (DT-%SERIAL%) vs "Custom template" | ✓ |
| Single pattern | Builder add/remove covers customs | |

**User's choice:** All recommended options accepted.

---

## Key-vault 3-char minimum

| Option | Description | Selected |
|--------|-------------|----------|
| Tip + partial hard validation | Tip documents full rule; maxLength 24 + anchors pattern enforce what schema can — zero code, QUAL-01 intact | ✓ |
| Add minLength to schema | ~5-line validation-config extension; documented exception like 13-D-04 icon wiring | |
| Start/end via pattern, hyphens tip | Anchors in allowedPattern; no-consecutive-hyphens stays a tip | ✓ |
| Full combined regex | `(?!.*--)` combined — opaque | |
| Tips only | Only maxLength hard | |
| Hyphenated CAF shape | `kv-[Workload]-[Environment]-[Region]` consistent with Azure category | ✓ |
| No separators like storage | Legal but inconsistent | |

**User's choice:** All recommended options accepted.
**Notes:** minLength schema extension explicitly rejected to preserve zero-code-change claim for Phase 15 QUAL-01 verification.

---

## CAF abbreviation & segment sources

| Option | Description | Selected |
|--------|-------------|----------|
| New CAF workload library + reuse rest | azure/caf-workloads.json (st, kv, nsg, pip, vm…); core Environment/Region/Instance reused | ✓ |
| Extend core Workload library | Would mutate 8 already-shipped Azure rules | |
| Inline per convention | Duplicated values across 4 rules | |
| Sample-value library + custom allowed | intune/group-tags.json samples (DEV, HR, PARIS…) with allowCustomValue | ✓ |
| Free text + tip | No discoverable examples | |
| New ring library + reuse prefix lib | Fixed Pilot/Dev/Broad/Production values; assignment groups reuse/extend existing Intune libs | ✓ |
| Single combined Intune file | Mixes unrelated value sets | |

**User's choice:** All recommended options accepted.
**Notes:** Discovery during scout: existing `intune-prefix.json` holds CMP/CFG/MAM/MACFG — the `INTUNE-{DEV|USR}` tokens do not exist yet; planner decides extend-vs-new-file within discretion.

---

## OpenCode's Discretion

Exact regex strings within decided strictness splits; exact segment-file names/splits; NSG/public-IP pattern details per CAF research (ordinary hyphenated shape, no special validation); INTUNE-04 extend-vs-new-file; FR terminology; example values.

## Deferred Ideas

None during discussion (pre-existing REQUIREMENTS.md deferrals noted in CONTEXT.md).
