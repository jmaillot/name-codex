# Name Codex

## What This Is

Naming Governance App for Microsoft 365 & Azure — single-page React + TypeScript + Vite application that helps users define, explore and govern naming conventions for Azure, Entra ID, Exchange, Groups, Intune, Conditional Access, Defender, Teams, SharePoint, Power Platform and Purview. Pick an object type, assemble its segments, and the app generates, validates and documents the final name in real time. All conventions, segment libraries and generators are plain JSON under `src/rules`, `src/data/segments`, `src/data/generators` — no backend. Deployed at https://name-codex.jeremymaillot.fr/. Builder now supports fluid drag & drop and keyboard reorder with constraint awareness (v1.13).

## Core Value

A user can pick any supported resource type, assemble its naming segments visually, and get a governed, validated name with a score and documentation — instantly and without backend.

## Current State

**Shipped:** v1.13 Builder Ergonomics — Drag & Drop (2026-09-03) — Phase 30 (2/2 plans), 6 tasks, 8 files modified, 958 insertions, 5689 LOC TypeScript/React, 249 vitest tests, 18/18 WCAG pairs pass.
- Drag handle + HTML5 DnD reorder with GripVertical, insertion line, pinned guards (isFixedFirst/isLocked), splice reorder with barrier checks
- Keyboard Space/Enter grab, Arrow skip pinned, Esc restore snapshot, focus retention, `aria-grabbed` + `sr-only` live announcements
- `npm run check:data`, `check:tokens`, `test`, `build` all pass; no data additions this milestone

**Next Milestone Goals:** TBD — catalog mature at 71 conventions; potential focus on builder persistence (BLD-07), touch drag (BLD-08), or preset system (PRST-01) per deferred requirements. Run `/gsd-new-milestone` to define.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Browse 71 conventions across 11 categories (Azure 36, Entra ID, Exchange, Groups, Intune, Conditional Access, Defender, Teams, SharePoint, Power Platform, Purview) — v1.12
- ✓ Search and filter object types, switch pattern variants, view description and example — v1.0
- ✓ Segment builder with visual assembly, fixed/locked/recommended/custom segments, reorder via buttons, add/remove, tips — v1.0
- ✓ Segment governance: mutual exclusions, conditional values, auto-numbered policy IDs (CA persona ranges), pattern literals — v1.6+
- ✓ Live preview respecting validation rules (length, allowed characters, mandatory segments), governance score /100 with per-rule checklist, Modified badge — v1.0
- ✓ Copy generated name, copy Markdown documentation, copy JSON, favorites & history (localStorage), restore last object per category, Convention Reference dictionary — v1.0
- ✓ Data-driven JSON conventions + segment libraries + generators; shared catalog with allowedValues and constraints — v1.0+
- ✓ Segment library constraints vocabulary (allowedPattern, minLength, maxLength) validated by check:data, enforced in builder (dropdown filtering, maxLength clamping, validation rows) — v1.7–v1.10
- ✓ CAF Expansion I–III and Azure data-driven expansions (storage, key vault, nsg, etc. through bvault/adb/mlw + afd/pe/dnsz) — v1.11–v1.12
- ✓ i18n EN/FR, dark/light theme, design tokens with WCAG 18/18, 240+ vitest tests (jsdom), check:tokens, check:data gates — v1.0+
- ✓ Drag-and-drop reorder of builder segments via mouse with live name/pattern regeneration — v1.13
- ✓ Constraint-aware drag — fixed/locked segments pinned (draggable false, cursor not-allowed, showFeedback) — v1.13
- ✓ Keyboard-accessible reorder — Space/Enter grab, ArrowUp/Down skip pinned, Esc cancel, Enter/Space drop, focus retention and ARIA live region — v1.13
- ✓ Live regeneration of name/pattern/validation/score on reorder with existing button/remove/addCustom coexistence — v1.13

### Active

<!-- Current scope. Next milestone to define. -->

- [ ] Next milestone requirements — run `/gsd-new-milestone` to define (candidates: BLD-07 persisted order, BLD-08 touch drag, PRST-01 preset system)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- Persisting custom segment order per convention in localStorage — deferred to v2 (BLD-07), adds state migration complexity for small gain
- Touch/mobile drag with custom gesture handling — deferred to v2 (BLD-08), native HTML5 sufficient for desktop
- Full builder redesign or preset/template system — deferred to v2 (PRST-01), focused polish shipped in v1.13
- New conventions or segment libraries — catalog mature at 71; no data additions in v1.13, defer until demand
- Backend or collaboration features — app remains static, local-only by design

## Context

- Brownfield SPA: React 19, TypeScript 6, Vite 8, no backend, all data as JSON. 71 conventions shipped through v1.13 (now with builder DnD). 8 files modified in v1.13 (BuilderCard, SegmentEditor, useAppState, App.css, locales), `reorderSegments` splice and keyboard grab logic established.
- Builder now reorders via handle drag and keyboard plus legacy buttons; `SegmentEditor` handle is `draggable={isMovable}` with `GripVertical` for movable and `aria-grabbed`; `BuilderCard` owns `onReorder` splice, insertion line, and `aria-live="polite"` live region.
- v1.13 shipped 2026-09-03 with Phase 30 (2 plans) — `npm run build` 2028 modules, 625kB, `check:tokens` 0 violations, `check:data` 159 files, tests 249. Git history `b07cd9f..5ba7a6b` on `main`, tag `v1.13`.
- Technical debt: none new; touch/mobile and persisted order remain deferred intentionally.

## Constraints

- **Tech stack**: React + TypeScript + Vite, no new runtime dependencies unless justified — why: keep bundle small and static deploy simple
- **Compatibility**: Must preserve existing BuilderCard/SegmentEditor props and moveSegment semantics — why: avoid cascading refactor across useAppState (upheld in v1.13 — moveSegment preserved, reorderSegments added alongside)
- **a11y**: Keyboard reorder must be WCAG-compliant — focus visible, operable without mouse, live announcements — why: governance tool used in enterprise contexts (validated: 18/18 WCAG, keyboard E2E in `BuilderCard.test.tsx`)
- **No regressions**: `npm run check:data`, `npm run check:tokens`, `npm test` (249 tests), `npm run build` must pass — why: data and token gates are release blockers (validated)

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| JSON data-driven conventions + segment libraries | Add/adjust naming standards without touching code; proven through 71 conventions | ✓ Good |
| Segment builder with fixed/locked/recommended model + validation scoring | Governance requires visual assembly with constraint enforcement | ✓ Good |
| SegmentConstraints vocabulary (Phase 17) wired in Phase 19 | Machine-readable shape docs, compile-only gate, later enforced in builder | ✓ Good |
| Builder reorder via buttons (pre-v1.13) | Simple, accessible baseline before drag enhancement | ✓ Good — retained for coexistence in v1.13 |
| Scope v1.13 to reorder ergonomics only (no persistence/new conventions) | Catalog mature; builder friction is highest leverage polish | ✓ Good — 6/6 BLD shipped, no scope creep |
| Use native HTML5 drag over external DnD library | Avoid dependency, sufficient for linear list reorder | ✓ Good — 2px insertion line, native ghost, 0 deps |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd-transition`):
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions
5. "What This Is" still accurate? → Update if drifted

**After each milestone** (via `/gsd-complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-09-03 after v1.13 milestone*
