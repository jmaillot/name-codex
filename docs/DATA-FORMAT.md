# Data Format: Segment Libraries & Constraints

This document is the contributor reference for the plain-JSON data layer under `src/rules/**`, `src/data/segments/**` and `src/data/generators/**`, with a focus on the optional `constraints` vocabulary available to segment libraries.

## Segment library shape

A segment library is a single JSON file with these top-level keys:

| Key | Type | Required | Meaning |
|-----|------|----------|---------|
| `name` | string | yes | Display name of the segment (e.g. `"Region"`) |
| `values` | array | yes | The list of selectable values |
| `constraints` | object | no | Optional value constraints — see [Constraints vocabulary](#constraints-vocabulary) |

Each entry in `values[]` is an object:

- `value` — string, unique within the file's `values[]`. An intentional empty string (`""`) is allowed as a blank-value sentinel.
- `description` — non-empty string describing the value.

Illustrative example (shape adapted from `src/data/segments/core/region.json`):

```json
{
  "name": "Region",
  "values": [
    { "value": "WE", "description": "West Europe" }
  ]
}
```

## Constraints vocabulary

Any segment library may declare ONE optional top-level `constraints` object. It applies file-level to every value in `values[]`. It has exactly three keys:

| Key | Type | Meaning |
|-----|------|---------|
| `allowedPattern` | string | Raw regular expression with explicit anchors written by the author — used as-is, never wrapped or auto-anchored (same convention as rule-level `validation.allowedPattern`) |
| `minLength` | integer ≥ 0 | Minimum value length |
| `maxLength` | integer ≥ 0 | Maximum value length |

The keys are independent: omit a key to leave that axis unconstrained, and `constraints: {}` is a valid no-op.

Well-formed example (e.g. `core/region` ships with constraints live since v1.7):

```json
{
  "name": "Region",
  "constraints": { "allowedPattern": "^[A-Z]{2,4}$", "minLength": 2, "maxLength": 4 },
  "values": [
    { "value": "WE", "description": "West Europe" }
  ]
}
```

### Malformed declarations and their gate outcomes

The `check:data` gate rejects each of these declarations at CI/dev time:

| Declaration | Gate outcome |
|-------------|--------------|
| `"allowedPattern": "["` | FAILS: not a compilable regular expression |
| `"allowedPattern": 42` | FAILS: must be a string |
| `"minLength": -1` | FAILS: must be a non-negative integer |
| `"maxLength": 1.5` | FAILS: must be a non-negative integer |
| `"minLength": 5, "maxLength": 2` | FAILS: minLength must be ≤ maxLength |
| `"constraints": "^[A-Z]+$"` | FAILS: constraints must be an object |

Failures are reported collect-all style: the gate scans every file and prints one plain-text `file: reason` line per violation before exiting non-zero.

## What the gate checks — and what it doesn't

The gate validates **declaration well-formedness only**: it checks that `allowedPattern` is a string that compiles via `new RegExp()` (it is never executed), and that `minLength`/`maxLength` are non-negative integers with `minLength ≤ maxLength`.

It does NOT check whether existing `values[]` entries satisfy the declared constraints, and it never executes the pattern against any input. Segment libraries may declare `constraints: { allowedPattern, minLength, maxLength }` — live since v1.7. `allowedPattern` is a raw anchored regex (e.g. `"^[A-Z0-9]{2,4}$"`), never wrapped; `minLength`/`maxLength` are non-negative integers with `minLength <= maxLength`. Validated by `check:data` (compile-only) and enforced in the builder: dropdowns filtered by `allowedPattern`, inputs clamped by `maxLength`, validation rows for all three.
