---
phase: 10-developer-portal-polish-verification
plan: 04
subsystem: verification
tags: [safe-01, smoke-matrix, d09-d12-gate, human-verify]

# Dependency graph
requires:
  - phase: 10-developer-portal-polish-verification
    provides: plan 03 workflow-8 filter→builder fix (c9cf94c) + green automated gates
provides:
  - Complete 18-run smoke record (9 workflows × EN/FR)
  - Live EN↔FR toggle spot-check result (VERIFICATION gap 3)
  - Visual density check result (four breakpoint widths)
  - SAFE-01 sign-off OR blocking-drifts record gating UAT/tag
affects: [uat, v1.3-tag]

requirements_completed: []  # filled ONLY after all 18 runs + toggle + density pass

gap_closure: true

# Metrics
duration: TBD
completed: TBD
---

# Phase 10 Plan 04: Full Smoke Matrix & SAFE-01 Sign-off Summary

**Gap closure:** Re-run of the full 9-workflow × EN/FR smoke matrix on the reskinned UI post-fix (plan 10-03's filter-aware selection resolution at `useAppState.ts:102-106`), folding in the live EN↔FR language-toggle spot-check and visual density confirmation. This record is the D-09/D-12 gate for SAFE-01 closure, UAT, and the v1.3 tag.

## Status: AWAITING HUMAN SMOKE SESSION

Automated pre-smoke gates are green and the dev server is running. The matrix below is transcribed EXACTLY as the user reports it — no run may be recorded as pass without explicit user confirmation (D-12 honesty rule).

## Pre-Smoke Gate Baseline (executed 2026-08-24)

| Gate | Command | Observed | Expected (vs 10-03) |
|------|---------|----------|---------------------|
| Tests | `npx vitest run` | **137 passed (137)**, 6 files, 0 failed | ✓ matches 10-03 exactly |
| Tokens | `node scripts/check-tokens.mjs` | **TOKEN GATE PASS** (literals: 0 violations, contrast: 9/9 pairs) | ✓ matches 10-03 |

Raw output: `/tmp/opencode/p10-pre-smoke.out`. Dev server log: `/tmp/opencode/p10-dev-server.log`.

## Smoke Matrix — 9 Workflows × EN/FR (18 runs)

| # | Workflow | EN | FR |
|---|----------|----|----|
| 1 | Copy name | PENDING | PENDING |
| 2 | Copy markdown | PENDING | PENDING |
| 3 | Governance score | PENDING | PENDING |
| 4 | Validation | PENDING | PENDING |
| 5 | Favorites persist | PENDING | PENDING |
| 6 | History accumulate/clear | PENDING | PENDING |
| 7 | Last-object-per-category restore | PENDING | PENDING |
| 8 | Global search / filter → builder refresh (**THE FIX**) | PENDING | PENDING |
| 9 | Rail persistence (residual form) | PENDING | PENDING |

### Workflow-specific expectations

- **Workflow 8 (post-fix expectation from 10-VERIFICATION.md):** typing a ConfigureCard filter query updates the object list AND refreshes the segment builder selection; clearing restores prior selection/builder.
- **Workflow 9 (residual form — rail removed by approved Phase 09.1, commit 82a1ea8):** confirm NavPanel always renders expanded at 280px, no rail-toggle control exists anywhere, refreshing after nav interaction writes NO `name-codex-rail-collapsed-v1` entry to localStorage. Requires explicit user acknowledgment that this feature was intentionally removed — will NOT be silently marked pass.

## Live EN↔FR Toggle Spot-Check (D-10 live half — VERIFICATION gap 3)

PENDING — both directions required: EN→FR and FR→EN on chrome labels, panel headings, button copy, aria labels.

## Visual Density Check (VERIFICATION human_verification item 3)

PENDING — panels must read visibly denser than v1.2 with nothing cramped/clipped at:
- [ ] Desktop (>1100px)
- [ ] ~1100px
- [ ] ~980px
- [ ] <720px

## SAFE-01 Disposition

PENDING — exactly one of:
- **Sign-off:** all 18 runs + toggle + density confirmed → `requirements-completed: [SAFE-01]`, UAT/tag unblocked.
- **Blocking Drifts** (per D-12): any behavioral difference = FAIL → fixes before UAT/tag, no KNOWN_ISSUE deferral.
