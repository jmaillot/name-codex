---
phase: 17-generic-segment-constraint-vocabulary
plan: 01
subsystem: data-gate
tags: [data-integrity, validation, segment-constraints, ci-gate, tdd]
requires:
  - "Phase 16 check:data gate (scripts/check-data.mjs, validateSegment)"
provides:
  - "SegmentConstraints TypeScript type (src/types/Rule.ts)"
  - "constraints declaration validation in validateSegment (compile-only allowedPattern, non-negative integer lengths, min<=max cross-key)"
affects:
  - "Phase 18+ builder enforcement can rely on gate-validated constraints declarations"
tech-stack:
  added: []
  patterns:
    - "hasOwn allowlist key iteration over hostile JSON (T-17-02)"
    - "compile-only RegExp validation via try/catch new RegExp() — never executed (T-17-01)"
key-files:
  created: []
  modified:
    - src/types/Rule.ts
    - scripts/check-data.mjs
    - scripts/check-data.test.mjs
decisions:
  - "Test 13 rewritten per intent: valid declaration coexisting with a legacy defect proves coexistence by asserting the duplicate fires AND zero constraints.* violations appear (a valid declaration cannot yield a second violation)"
metrics:
  duration: "~8 min"
  completed: 2026-08-26
---

# Phase 17 Plan 01: Generic Segment Constraint Vocabulary Summary

**One-liner:** Gate-validated `constraints` vocabulary for segment libraries — compile-only `allowedPattern` RegExp checks plus non-negative-integer length bounds with `min <= max`, backed by a documented `SegmentConstraints` type and 14 TDD test cases.

## What Was Built

- **`src/types/Rule.ts`**: New `export interface SegmentConstraints { allowedPattern?: string; minLength?: number; maxLength?: number }` immediately after `NamingValidationConfig`. Exactly D-03's three keys; nothing consumes it yet (D-02 locked decision).
- **`scripts/check-data.mjs`**: `validateSegment` gained a constraints branch after the values loop, before `return violations`:
  - Presence gated on `hasOwn(json ?? {}, 'constraints')` (own-property, never truthy lookup).
  - Non-null non-array plain object required → else `'constraints must be an object'`.
  - `allowedPattern`: string type gate BEFORE `new RegExp()` compile in try/catch (compile-only — `.test()`/`.exec()` never run, structurally preventing ReDoS per T-17-01).
  - `minLength`/`maxLength`: `Number.isInteger(v) && v >= 0` (rejects booleans, NaN, Infinity, floats, negatives — T-17-03).
  - Cross-key rule fires only when both keys present AND individually well-typed — no double-punishing.
  - Fixed allowlist iteration (`hasOwn(c,'allowedPattern')` + loop over `['minLength','maxLength']`) — never `Object.entries`/`Object.keys` over hostile JSON (T-17-02). Empty `{}` passes clean (D-07).
  - Header comment updated: Segments block documents the optional vocabulary; unknown-key rule (D-10) qualified with the Phase 17 exception.
- **`scripts/check-data.test.mjs`**: `constrainedSegFile` factory + nested `describe('constraints')` with 14 cases covering every rejection class, collect-all within declarations, legacy-check coexistence, and absent-key pass-through.

## Commits

| Task | Commit | Description |
| ---- | ------ | ----------- |
| 1 (RED) | `878f621` | test(17-01): add failing constraint-vocabulary tests for validateSegment |
| 2 (GREEN) | `a0d5b94` | feat(17-01): validate segment constraints declarations in check:data gate |

TDD gates verified: RED commit (11 new tests failing, 31 pre-existing passing) precedes GREEN commit. No refactor commit needed.

## Verification Evidence

- `npx vitest run scripts/check-data.test.mjs` → **42/42 passed**
- `npm test` → **225/225 passed** (11 files; suite grew 211→225)
- `node scripts/check-data.mjs` → **DATA GATE PASS (94 files, 0 errors)** — untouched catalog unaffected (additivity proven)
- `npm run lint` → exit 0 (1 pre-existing warning, see Deferred)
- `npm run build` → ✓ built in 7.83s
- Negative proof end-to-end: `validateSegment({constraints:{allowedPattern:'[',minLength:5,maxLength:2},…})` returns exactly 2 violations (non-compilable pattern + inverted lengths), confirming collect-all without double-punishment
- Forbidden-pattern greps clean: no `.test(`, no `.exec(`, no `Object.entries(c)` in check-data.mjs

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Test 13 assertion was logically impossible as written**
- **Found during:** Task 2 GREEN run
- **Issue:** Plan's Test 13 ("valid declaration coexisting with an existing value defect") expected ≥2 total violations, but a *valid* declaration produces zero constraint violations by definition — only the duplicate-value violation exists. The assertion could never pass against a correct implementation.
- **Fix:** Rewrote to assert the plan's actual intent: the duplicate violation still fires AND no `constraints.*` violation appears (declaration path ran cleanly alongside the legacy defect — neither suppresses the other).
- **Files modified:** scripts/check-data.test.mjs
- **Commit:** a0d5b94

Otherwise: none — plan executed exactly as written.

## Threat Model Compliance

All mitigations from the plan's STRIDE register landed in code + tests: T-17-01 (compile-only, enforced by forbidden-pattern greps + code comment), T-17-02 (hasOwn allowlist iteration), T-17-03 (type gates covered by tests 4–7, 9–11), T-17-04 accepted per plan rationale. No new security surface outside the plan's threat model.

## Known Stubs

None. The plan is deliberately inert at runtime (D-02: type added though nothing consumes it; D-06: declaration well-formedness only) — this is locked-decision scope, not an unfinished stub. Phase 18+ builder wiring is the documented future consumer.

## Deferred Issues

- Pre-existing unused-import lint warning at `scripts/check-data.test.mjs:14` (`dirname` from `node:path`) — present at base commit d4d12e9d, out of scope per boundary rule. Logged in phase `deferred-items.md`.

## Self-Check: PASSED

- FOUND: src/types/Rule.ts (contains `export interface SegmentConstraints {`)
- FOUND: scripts/check-data.mjs (constraints branch + header DATA-02 line)
- FOUND: scripts/check-data.test.mjs (14 constraint cases)
- FOUND: commit 878f621
- FOUND: commit a0d5b94
