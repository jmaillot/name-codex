# Phase 14: Category Expansions — Azure CAF Resources + Intune - Pattern Map

**Mapped:** 2026-08-25
**Files analyzed:** 13 new JSON files + 2 locale modifications
**Analogs found:** 13 / 13 (all files are pure JSON additions to well-established shapes; zero code changes per CONTEXT decisions)

## File Classification

| New/Modified File | Role | Data Flow | Closest Analog | Match Quality |
|-------------------|------|-----------|----------------|---------------|
| `src/rules/azure/azure-storage-account.json` | config (convention data) | transform (static catalog) | `src/rules/purview/purview-sensitivity-label.json` | role-match (validation block diverges per D-01/D-02) |
| `src/rules/azure/azure-key-vault.json` | config | transform | `src/rules/azure/azure-resource-group.json` | exact |
| `src/rules/azure/azure-network-security-group.json` | config | transform | `src/rules/azure/azure-resource-group.json` | exact |
| `src/rules/azure/azure-public-ip.json` | config | transform | `src/rules/azure/azure-virtual-machine.json` | exact |
| `src/rules/intune/intune-autopilot-device-name.json` | config | transform | `src/rules/purview/purview-sensitivity-label.json` | exact (patterns[] variants + tips + per-field allowedPattern) |
| `src/rules/intune/intune-group-tag.json` | config | transform | `src/rules/intune/endpoint-security-policy.json` | role-match |
| `src/rules/intune/intune-update-ring.json` | config | transform | `src/rules/intune/configuration-profile.json` | role-match |
| `src/rules/intune/intune-assignment-group.json` | config | transform | `src/rules/intune/endpoint-security-policy.json` | role-match |
| `src/data/segments/azure/caf-workloads.json` | model (segment library) | static lookup | `src/data/segments/core/workload.json` | exact |
| `src/data/segments/intune/autopilot-macros.json` | model | static lookup | `src/data/segments/azure/ip.json` | exact |
| `src/data/segments/intune/group-tags.json` | model | static lookup | `src/data/segments/intune/intune-scopetag.json` | exact |
| `src/data/segments/intune/update-rings.json` | model | static lookup | `src/data/segments/intune/assignments.json` | exact |
| `src/data/segments/intune/intune-prefix.json` (extend, D-15 option A) | model | static lookup | itself | n/a (edit-in-place) |
| `src/locales/en.json` / `fr.json` (modify) | config (i18n mirror) | static lookup | existing `data.rule.purview-*` key blocks in both files | exact |

## Pattern Assignments

### Azure conventions ×4 (`src/rules/azure/*.json`) — config, static catalog

#### AZURE-02 Key Vault / AZURE-03 NSG / AZURE-04 Public IP (hyphenated CAF style)

**Analog:** `src/rules/azure/azure-resource-group.json` (whole file, 60 lines)

**Top-level shape** (lines 1–7):
```json
{
  "id": "azure-resource-group",
  "category": "Azure",
  "name": "Resource Group",
  "description": "Azure resource group naming.",
  "pattern": "RG-[Region]-[Environment]-[Workload]",
```
- `id` = kebab-case, prefixed with category (`azure-key-vault`, `azure-network-security-group`, `azure-public-ip`)
- `pattern` uses `[Segment]` tokens matching `fields[].name` exactly (integrity test at `src/lib/data-integrity.test.ts:34` — "every pattern token maps to a known segment")

**Fields with defaults + inline allowedValues** (lines 8–31): fields carry `defaultValue`, optional `allowedValues`, `allowCustomValue`. For CAF workloads use `"library": "azure/caf-workloads"` instead of inline `allowedValues`.

**Builder block** (lines 36–55):
```json
"builder": {
    "separator": "-",
    "defaultSegments": ["Region", "Environment", "Workload"],
    "availableSegments": ["Custom"],
    "recommendedSegments": ["Workload"],
    "lockedSegments": ["Region", "Environment"],
    "fixedFirstSegments": [],
    "fixedLastSegments": []
}
```
Key Vault per D-11: `fixedFirstSegments: ["Prefix"]` with a fixed `kv` first segment (or a literal token in the pattern) — follow how other rules pin prefixes via `fixedFirstSegments` + locked fields (see also `endpoint-security-policy.json` lines 108–117).

**Validation block** (lines 56–59) — baseline Azure norm:
```json
"validation": {
    "maxLength": 128,
    "allowedPattern": "^[A-Za-z0-9_.-]+$"
}
```
Key vault diverges per D-09/D-10: `"maxLength": 24` + whole-name `allowedPattern` enforcing start-letter / end-letter-or-number anchors; no-consecutive-hyphens and 3-char minimum go in bilingual **tips**, not regex. NSG/public-IP keep the baseline shape (no special validation).

**Tips mechanism** (analog: `src/rules/purview/purview-sensitivity-label.json` lines 35–53):
```json
{
    "name": "Sublabel",
    "type": "text",
    "allowCustomValue": true,
    "allowedPattern": "^[A-Za-z0-9&/-]+$",
    "tip": "Sublabels inherit the parent label's settings; keep names short, stable, and space-free."
}
```
Convention-level tips also live on the convention object (see `data.rule.purview-retention-label.description` in `src/locales/en.json` — immutable-save warning carried in description). Use this for: storage uniqueness-is-the-endpoint tip (D-04), key-vault min-length/no-double-hyphen tips (D-10), Autopilot expansion tip (D-05). Rendered by `field?.tip && <InfoIcon text={fieldTip(field, field.tip)} />` (`src/components/SegmentEditor.tsx:105`); FR overrides resolve through `tl('data.field.<Name>.tip', fallback)` (`src/lib/segments.ts:40`).

---

### AZURE-01 Storage Account — the deliberate outlier

**Analog:** `src/rules/purview/purview-sensitivity-label.json` for the *mechanism* (custom `validation` block + per-field patterns), but every hyphenated default from `azure-resource-group.json` must be inverted:

Per D-01..D-04:
- `pattern`: `st[Workload][Environment][Instance]` — tokens concatenate with NO separator. The `builder.separator` field is optional in `NamingBuilderConfig` (`src/types/Rule.ts:33-40`), so either omit `separator` entirely or set it appropriately for direct concatenation — ⚠️ verify against the builder UI component that an omitted/empty separator renders concatenated segments before committing.
- `validation`:
```json
"validation": {
    "maxLength": 24,
    "forceLowercase": true,
    "allowedPattern": "^[a-z0-9]+$"
}
```
`forceLowercase` already exists in `NamingValidationConfig` (`src/types/Rule.ts:40-46`). Uppercase input auto-lowercases; `allowedPattern` catches residual hyphens/symbols (D-03).
- Uniqueness cannot be validated client-side — bilingual tip only (D-04), e.g. referencing `stprovad001.blob.core.windows.net`.
- Workload field uses `"library": "azure/caf-workloads"` (D-12).

---

### INTUNE-01 Autopilot device-name template (`src/rules/intune/intune-autopilot-device-name.json`)

**Analog:** `src/rules/purview/purview-sensitivity-label.json` — the exact Phase 13 D-14 precedent for one convention with `patterns[]` variants:

**patterns[] variants** (lines 7–33):
```json
"pattern": "[Classification]",
"patterns": [
    {
      "id": "parent-label",
      "name": "Parent Label",
      "description": "Top-level label from the classification taxonomy",
      "pattern": "[Classification]",
      "defaultSegments": ["Classification"],
      "examples": ["Confidential"]
    },
    ...
]
```
For Autopilot: variants like `id: "prefix-serial"` (`DT-%SERIAL%`) vs `id: "custom-template"` — one convention, multiple `patterns[]` entries (D-08). Each variant carries its own `defaultSegments`/`examples`; localized names via `data.rule.<id>.pattern.<pid>.name` (see `patternName()` at `src/lib/segments.ts:48`).

**Macro segment field** — dropdown from the macro library with custom values still allowed:
```json
{
    "name": "Macro",
    "library": "intune/autopilot-macros",
    "allowCustomValue": true
}
```
**Text segment charset** — per-field `allowedPattern` (line 51 precedent): letters/numbers/hyphens on typed-text fields (D-07).
**Whole-name validation** — `"maxLength": 15` + whole-name `allowedPattern` accepting letters/numbers/hyphens/%-macros; NOT-all-numbers rule = tip only (D-05/D-07). Length counts literal typed text (`%SERIAL%` = 8 chars as typed); no macro-aware estimation code (explicitly rejected).

---

### INTUNE-02 Group Tag / INTUNE-03 Update Ring / INTUNE-04 Assignment Group

**Analog:** `src/rules/intune/endpoint-security-policy.json` (whole file, 124 lines) — richest Intune rule showing library-backed fields, `allowCustomValue`, and locked/fixed segments:

**Library-referenced field** (lines 55–67):
```json
{
    "name": "Assignments",
    "library": "intune/assignments",
    "defaultValue": "AllUsers",
    "examples": ["GroupName"],
    "allowCustomValue": true
}
```
- Group Tag (INTUNE-02): field `"library": "intune/group-tags"` + `allowCustomValue: true` (tenant-specific samples — mirrors entra-attributes/Phase 13 D-09 precedent, D-13).
- Update Ring (INTUNE-03): field `"library": "intune/update-rings"`; ring value likely `lockedSegments`/fixed since Pilot/Dev/Broad/Production are the fixed taxonomy (D-14).
- Assignment Group (INTUNE-04): either extend `intune-prefix.json` (add `INTUNE-DEV`/`INTUNE-USR` values — ⚠️ audit existing consumers of `IntPrefix` first, since CMP/CFG/MAM/MACFG consumers would see the new values too) or add a sibling library — planner's call per CONTEXT Discretion.

**Fixed-first prefix pattern** (lines 111–117): `fixedFirstSegments` pins leading tokens — the model for `INTUNE-{DEV|USR}-<name>` where the `INTUNE-DEV`/`INTUNE-USR` token is a fixed first segment.

---

### Segment libraries ×4 (`src/data/segments/**/*.json`)

**Analog (descriptive values):** `src/data/segments/core/workload.json` (whole file, 37 lines):
```json
{
  "name": "Workload",
  "values": [
    { "value": "AD", "description": "Identity" },
    { "value": "VNET", "description": "Virtual Network" }
  ]
}
```
**Analog (minimal sample values):** `src/data/segments/intune/intune-scopetag.json` — same `{name, values[{value, description}]}` shape; empty-string descriptions are legal but prefer real descriptions for new libs (they surface in `optionLabel()` as `"value - description"`, `src/lib/segments.ts:29`).

New libraries:
- `azure/caf-workloads.json`: st, kv, nsg, pip, vm, vnet, … (CAF abbreviations; existing `core/workload.json` values predate CAF — do NOT edit it, add the new lib, D-12)
- `intune/autopilot-macros.json`: `%SERIAL%`, `%RAND:1%`…`%RAND:15%` (D-06)
- `intune/group-tags.json`: DEV, HR, PARIS… department/site samples (D-13)
- `intune/update-rings.json`: Pilot, Dev, Broad, Production (D-14)

**No registration needed:** `src/lib/data.ts:11-30` globs `../data/segments/**/*.json` via `import.meta.glob`; lookup key is the path after `/segments/` lowercased (e.g. `intune/autopilot-macros`). Same auto-discovery applies to rules under `src/rules/<category>/` (`src/lib/data.ts:57-60`).

⚠️ **Integrity gate:** `data-integrity.test.ts:10` ("every field library resolves to a real segment file with values") fails if a rule references a library path that doesn't match a dropped file — keep `library` strings exactly `<dir>/<filename-without-ext>` lowercase.

---

### Locale files (`src/locales/en.json` / `fr.json` — modify)

**Analog:** the `purview-sensitivity-label` key blocks present identically in both files. Required keys per new artifact (`src/lib/segments.ts:32-52`):

| Key pattern | Purpose |
|---|---|
| `data.rule.<id>.name` / `.description` | Convention card title/description |
| `data.rule.<id>.pattern.<variantId>.name` | patterns[] variant names (Autopilot only) |
| `data.field.<FieldName>.label` / `.tip` | Field labels + bilingual tips (InfoIcon fallbacks) |
| `data.lib.<library>.<value>` | Value descriptions, e.g. `data.lib.azure/caf-workloads.st` |

Baseline parity is currently 374=374 keys; **every EN key added must have its FR mirror** (Phase 15 gate). Tips written inline in rule JSON serve as EN fallbacks; the locale entries are the authoritative FR translations.

## Shared Patterns

### Zero-code constraint (applies to ALL files)
**Source:** `src/types/Rule.ts:40-46`
```typescript
export interface NamingValidationConfig {
  maxLength?: number;
  allowedPattern?: string;
  forceLowercase?: boolean;
  removeCharacters?: string[];
  caseMode?: "upper" | "lower" | "preserve";
}
```
Everything decided in CONTEXT (lowercase forcing, whole-name + per-field patterns, max lengths) is expressible with these existing knobs. No TypeScript edits anywhere in this phase.

### Auto-discovery
**Source:** `src/lib/data.ts:11-16, 57-60` — dropping JSON into `src/rules/azure/`, `src/rules/intune/`, `src/data/segments/{azure,intune}/` requires zero registration.

### Bilingual tips via InfoIcon
**Source:** `src/components/SegmentEditor.tsx:105` + `src/lib/segments.ts:40`
```typescript
{field?.tip && <InfoIcon text={fieldTip(field, field.tip)} />}
// fieldTip resolves tl(`data.field.${field.name}.tip`, fallback)
```
Apply to: storage uniqueness, key-vault soft sub-rules, Autopilot expansion budget, not-all-numbers rule.

### Validation-rules.json untouched
**Source:** Phase 13 D-12 carried forward — convention-level `validation` blocks only; `src/data/validation-rules.json` is NOT modified.

## No Analog Found

None — all 8 conventions map onto established rule shapes; the storage account's *values* diverge (no-separator, lowercase-only) but its *file structure* is fully covered by existing schema. Two watch-items flagged above: (1) empty/omitted `builder.separator` rendering for direct concatenation — verify in the builder UI during planning; (2) extending `intune-prefix.json` affects existing consumers of the `IntPrefix` library — prefer a sibling library unless audit shows it safe.

## Metadata

**Analog search scope:** `src/rules/**`, `src/data/segments/**`, `src/types/Rule.ts`, `src/lib/{data,segments}.ts`, `src/locales/*.json`, `src/lib/data-integrity.test.ts`
**Files scanned:** ~45 (all rule JSONs wc'd, segment libs read, lib/test sources grepped)
**Pattern extraction date:** 2026-08-25
