# Phase 13: New Microsoft 365 Categories - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-24
**Phase:** 13-New Microsoft 365 Categories — Teams, SharePoint, Power Platform, Purview
**Areas discussed:** Category icons, Category names & order, Entra policy overlap, Segments & validation

---

## Category icons

| Option | Description | Selected |
|--------|-------------|----------|
| Minimal code touch | Add 4 icon imports + map entries in NavPanel.tsx and 4 color classes in App.css; QUAL-01 stays about conventions/JSON | ✓ |
| Strict zero-code | Accept Azure fallback icon for all 4 new categories | |
| Data-driven icons now | Refactor icon resolution to be JSON-driven; bigger than phase scope | |

| Option | Description | Selected |
|--------|-------------|----------|
| Official brand SVGs | Microsoft product marks in src/assets/icons/ like existing 7 brand icons | ✓ |
| Lucide icons | Generic lucide-react icons tinted per category class | |
| Custom monograms | Simple letter SVGs colored per category | |

| Option | Description | Selected |
|--------|-------------|----------|
| Brand-derived hues | One distinct brand hue per category in App.css category block | ✓ |
| Token-only colors | Derive from existing semantic tokens only | |
| You decide | OpenCode picks as long as check:tokens stays green | |

| Option | Description | Selected |
|--------|-------------|----------|
| Scope QUAL-01 wording | Zero-code claim applies to conventions/segments/generators; icon wiring is an allowed exception | ✓ |
| Leave QUAL-01 as-is | Note deviation when it happens at verification | |

**User's choice:** Minimal code touch, official brand SVGs, brand-derived hues, scope QUAL-01 wording.

---

## Category names & order

| Option | Description | Selected |
|--------|-------------|----------|
| Roadmap labels | "Microsoft Teams", "SharePoint / OneDrive", "Power Platform", "Purview" | |
| Short names | Teams, SharePoint, Power Platform, Purview | ✓ |
| Full official branding | Includes "Microsoft" prefixes everywhere | |

| Option | Description | Selected |
|--------|-------------|----------|
| Alphabetical auto-sort | Keep localeCompare sort in src/lib/data.ts:61 | ✓ |
| Explicit custom order | Add a category-order array (code change) | |

| Option | Description | Selected |
|--------|-------------|----------|
| Kebab-case dirs | teams/, sharepoint/, power-platform/, purview/ under src/rules/ + mirrored segments dirs | ✓ |
| Other scheme | User-specified alternative | |

**User's choice:** Short names ("SharePoint" not "SharePoint / OneDrive"), alphabetical auto-sort, kebab-case directories.

---

## Entra policy overlap

| Option | Description | Selected |
|--------|-------------|----------|
| Single + cross-tip | GRP_ convention lives in Teams; SPO-01 carries an inheritance tip | ✓ |
| Duplicate in both | Same convention JSON in both categories (drift risk) | |
| Move to Entra ID | Put it in the existing Entra ID category instead | |

| Option | Description | Selected |
|--------|-------------|----------|
| Dropdown + sample attrs | Attribute tokens as dropdowns backed by new segment library file | ✓ |
| Free-text attributes | Editable text fields with examples only | |
| Locked attr list | Hardcode the six supported Entra attributes | |

| Option | Description | Selected |
|--------|-------------|----------|
| Tip only | Blocked-words guidance via existing tip mechanism | ✓ |
| Enforce blocked list | Ship default blocked-words list + flag matches (new capability) | |

**User's choice:** Single convention + cross-tip, dropdown attribute segments with sample values, blocked words as tip only.

---

## Segments & validation

| Option | Description | Selected |
|--------|-------------|----------|
| Reuse core + new only | Reuse core libraries where values fit; new files only for new value sets | ✓ |
| Per-category isolation | Each category self-contained even when duplicating core values | |
| You decide | File-by-file at implementation time | |

| Option | Description | Selected |
|--------|-------------|----------|
| Convention validation + tips | Convention-level validation blocks + tips; validation-rules.json untouched | ✓ |
| validation-rules.json keys | Add new category keys to validation-rules.json (new pattern) | |
| maxLength only | Only maxLength where official limits exist | |

| Option | Description | Selected |
|--------|-------------|----------|
| Tips on fields | Immutable/no-quotes/7-day/audit warnings as EN+FR tips | ✓ |
| Description only | Warnings in convention description text | |
| Validation + tips | Also add non-blocking quote validation (code change) | |

| Option | Description | Selected |
|--------|-------------|----------|
| Two conventions | Separate parent-label and sublabel conventions (→ 13 total) | ✓ (initial) |
| One + sublabel segment | Sublabel as a second segment of one convention | |
| You decide | OpenCode checks patterns[] expressiveness first | |

Follow-up (count reconciliation):

| Option | Description | Selected |
|--------|-------------|----------|
| One file, 2 variants | Parent + sublabel as two pattern variants in one convention JSON — keeps 12 | ✓ |
| 13th convention | Accept 13 conventions; adjust verification counts | |

**User's choice:** Reuse core segments, convention-level validation + tips, Purview gotchas as field tips, sensitivity labels as one convention file with two pattern variants.

---

## OpenCode's Discretion

- Exact brand hue values per category color class
- Exact segment-file splits within the reuse-core rule
- Pattern-variant depth within the two sensitivity-label variants
- FR terminology for all new keys (parity must hold)

## Deferred Ideas

None raised during discussion. Pre-existing deferrals live in REQUIREMENTS.md Future Requirements (OneDrive library/folder naming, Power Platform solutions/apps/flows, additional Azure CAF resources).
