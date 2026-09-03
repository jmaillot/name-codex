# Milestones

## v1.13 Builder Ergonomics — Drag & Drop — SHIPPED 2026-09-03

**Version:** v1.13
**Date:** 2026-09-03
**Phases:** 30 (1 phase) | **Plans:** 2 | **Tasks:** 6 | **Git:** b07cd9f..5ba7a6b
**Tag:** v1.13

**Delivered:** Builder segment drag & drop reorder via mouse (handle-only GripVertical, HTML5 DnD, insertion line, pinned guards) and keyboard (Space/Enter grab, Arrow skip pinned, Esc restore, focus retention) with ARIA live announcements and splice-based reorder.

Key accomplishments:
- Drag handle + HTML5 DnD reorder with constraint awareness and live preview (BLD-01/02/06) — `GripVertical` handle-only draggable, `reorderSegments` splice with `isFixedFirst`/`isLocked` barriers, 2px accent insertion line skipping illegal slots
- Keyboard reorder + ARIA live region + button coexistence (BLD-03/04/05/06) — `aria-grabbed`, `tabIndex 0`, `sr-only` `aria-live="polite"` (`liveGrab`/`liveMove`/`liveDrop`/`liveCancel`), `Esc` snapshot restore, focus via `segment-${sourceName}`
- Governance validation/score recompute on drop, up/down buttons/remove/addCustomSegment coexistence preserved, 240 → 249 tests (9 new `BuilderCard.test.tsx`), `check:data`/`check:tokens`/`build` pass
- Token-compliant styling (`var(--shadow-card)`, `var(--accent)`) and i18n EN/FR parity for drag/live keys

**Phases shipped:**
- Phase 30: Builder Drag & Drop Reorder — 2/2 plans complete (30-01 + 30-02) — Completed 2026-09-03

**Decisions:**
- Native HTML5 drag over external library — linear list sufficient, no dependency
- Scope to reorder ergonomics only — catalog mature at 71 conventions, no data additions
- Direct splice with clamped index and barrier checks — never displace pinned segment (T-30-01)

**Issues deferred:** BLD-07 persisted order per convention, BLD-08 touch drag, PRST-01 preset system — deferred to v2 (see archived requirements).

**Archives:**
- `.planning/milestones/v1.13-ROADMAP.md`
- `.planning/milestones/v1.13-REQUIREMENTS.md`

---

## v1.12 CAF Expansion III — SHIPPED 2026-09-01

Delivered: Six Azure CAF conventions as pure JSON — Backup Vault, Databricks, ML Workspace, Front Door, Private Endpoint, DNS Zone (dotted-domain) — catalog 68→71 (Azure 39), EN/FR parity 1048, 240 tests.

---
*Last updated: 2026-09-03 after v1.13 milestone*
