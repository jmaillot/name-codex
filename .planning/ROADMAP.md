# Roadmap: Name Codex

## Milestones

- ✅ **v1.0 Baseline Release** — Phase 1 (shipped 2026-08-19)
- ✅ **v1.1 Quality & Refactor** — Phases 2-6 (shipped 2026-08-21)
- ✅ **v1.2 Performance** — Phase 7 (shipped 2026-08-21)
- ✅ **v1.3 Developer Portal UI** — Phases 8-10 (shipped 2026-08-24)
- ✅ **v1.4 Light Mode** — Phases 11-12 (shipped 2026-08-24)
- ✅ **v1.5 Naming Convention Expansion** — Phases 13-15 (shipped 2026-08-25)

## Phases

<details>
<summary>✅ v1.0 Baseline Release (Phase 1) — SHIPPED 2026-08-19</summary>

- [x] Phase 1: Baseline Release v1.0 (3/3 plans) — completed 2026-08-19

Full details: `.planning/milestones/v1.0-ROADMAP.md`

</details>

<details>
<summary>✅ v1.1 Quality & Refactor (Phases 2-6) — SHIPPED 2026-08-21</summary>

- [x] Phase 2: Backup & Safety Net (3/3 plans) — completed 2026-08-20
- [x] Phase 3: Refactor App.tsx (2/2 plans) — completed 2026-08-20
- [x] Phase 4: Bug Fixes (5/5 plans) — completed 2026-08-20
- [x] Phase 5: Tests (2/2 plans) — completed 2026-08-21
- [x] Phase 6: Cleanup (2/2 plans) — completed 2026-08-21

Full details: `.planning/milestones/v1.1-ROADMAP.md`

</details>

<details>
<summary>✅ v1.2 Performance (Phase 7) — SHIPPED 2026-08-21</summary>

- [x] Phase 7: Performance Optimizations (3/3 plans) — completed 2026-08-21

Full details: `.planning/milestones/v1.2-ROADMAP.md`

</details>

<details>
<summary>✅ v1.3 Developer Portal UI (Phases 8-10) — SHIPPED 2026-08-24</summary>

- [x] Phase 8: Design Token Foundation (3/3 plans) — completed 2026-08-23
- [x] Phase 9: Layout Restructure (3/3 plans) — completed 2026-08-23
- [x] Phase 10: Developer-Portal Polish & Verification (4/4 plans incl. 2 gap-closure) — completed 2026-08-24

Azure Portal / Fluent-inspired reskin with zero behavior change: semantic token dark theme (`tokens.css`, light mode = pure token swap), CommandBar layout with global search + EN/FR switcher, monospace polish on denser panels, SAFE-01 proven via full 9×EN/FR smoke matrix (workflow-8 drift found → fixed → re-proven).

Full details: `.planning/milestones/v1.3-ROADMAP.md`

</details>

<details>
<summary>✅ v1.4 Light Mode (Phases 11-12) — SHIPPED 2026-08-24</summary>

- [x] Phase 11: Light Token Palette (2/2 plans) — completed 2026-08-24
- [x] Phase 12: Theme Switching & Verification (3/3 plans) — completed 2026-08-24

Full light theme as a pure token swap on the v1.3 token layer: navy-tinted Fluent/Azure-inspired light palette proven WCAG AA in both themes by the theme-scoped `check:tokens` gate (18/18 pairs), OS-aware boot-time resolution with no flash of wrong theme (`name-codex-theme-v14-0` localStorage override), sun/moon CommandBar toggle with bilingual labels and 175ms color-only fade, and behavior-neutrality proven end-to-end (137 tests zero added, PERF-01..03 re-proofs, dual-theme smoke matrix user-approved 18/18 PASS). Phases archived to `.planning/milestones/v1.4-phases/`.

Full details: `.planning/milestones/v1.4-ROADMAP.md`

</details>

<details>
<summary>✅ v1.5 Naming Convention Expansion (Phases 13-15) — SHIPPED 2026-08-25</summary>

- [x] Phase 13: New Microsoft 365 Categories — Teams, SharePoint, Power Platform, Purview (4/4 plans) — completed 2026-08-25
- [x] Phase 14: Category Expansions — Azure CAF Resources + Intune (5/5 plans) — completed 2026-08-25
- [x] Phase 15: Milestone Verification — Full Catalog Integrity (4/4 plans) — completed 2026-08-25

Catalog grew 25→45 conventions across 7→11 categories (new Teams, SharePoint, Power Platform, Purview categories + Azure CAF and Intune expansions), all data-driven JSON only with EN/FR parity; builder correctness fixes from UAT/review sweeps (`allowedPattern` validation, `assembleRawName`, validateName/activeFields sync); catalog integrity locked by new vitest proofs (183 tests green); verification verdict COMPLETE-WITH-WAIVER (9/9 mechanical gates green, dual smoke matrix waived by user approval). Phases archived to `.planning/milestones/v1.5-phases/`.

Full details: `.planning/milestones/v1.5-ROADMAP.md`

</details>

---

_Requirements coverage: 21/21 REQ-IDs shipped for v1.5. Requirements archived to `.planning/milestones/v1.5-REQUIREMENTS.md`._

_Next milestone not yet defined — start with `/gsd-new-milestone` (creates fresh REQUIREMENTS.md). Previous milestones archived under .planning/milestones/ (v1.0–v1.5)._
