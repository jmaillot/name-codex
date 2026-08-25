# Phase 15: Milestone Verification — Full Catalog Integrity - Context

**Gathered:** 2026-08-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Prove the whole v1.5 catalog holds together: all 45 conventions (25 existing + 20 new) auto-discoverable with zero code changes across 11 categories, JSON-integrity tests passing against the grown catalog, EN/FR locale parity maintained, build/lint green on Linux after `npm ci`, and a user-run dual smoke matrix over representative new-category workflows. This is the milestone-closing phase — no new catalog content, only proof (plus the decided WR-02..WR-06 sweep). QUAL-01 is the sole requirement.

</domain>

<decisions>
## Implementation Decisions

### Smoke matrix scope
- **D-01:** Full dual matrix — 6 workflows × EN/FR × dark/light ≈ 24 runs. Phase 12 precedent (18-run dual-theme matrix) carried forward; theme was untouched this milestone but the full matrix is chosen for maximum close-out confidence.
- **D-02:** Matrix is **user-run** — the user builds each name in the running app and judges output + governance score; the agent records PASS/FAIL honestly as-is (D-10/D-12 precedent: visual judgment belongs to the user; FAILs are findings, not process failures).
- **D-03:** Workflows are **pre-scripted by the agent**: one fixed convention + fixed segment values per workflow (Teams team, SharePoint site, Power Platform environment, Purview label, Azure storage account, Intune Autopilot device name), delivered as a step-by-step script so every run is reproducible and identical across language/theme axes.
- **D-04:** The 6 workflows match ROADMAP deliverable 15b exactly: Teams, SharePoint, Power Platform, Purview + storage-account + Autopilot templates.

### Zero-code-diff proof
- **D-05:** Proof method: `git diff v1.4..HEAD --name-only` filtered to the allowed data paths; any surviving path is a code change that must be explicitly justified in the verification report.
- **D-06:** Allowed-change whitelist: `src/rules/**`, `src/data/**` (segments/generators/catalog), `src/locales/en.json`, `src/locales/fr.json`. Everything else (`src/lib`, `src/components`, `src/styles`, config, CI, package.json) counts as a code diff and must be zero or justified.
- **D-07:** Reachability is proven mechanically, not by manual nav walk: assert `allConventions.length === 45`, 11 categories present in navigation, and global-search hits for each new convention id — via extended integrity tests or a one-off mechanical check whose output lands in the report.

### Finding handling
- **D-08:** Split policy: **mechanical FAILs are fixed in-phase** (broken JSON reference, missing locale key, wrong generated output/score → gap-closure plan or same-plan fix); **subjective smoke FAILs are recorded and triaged with the user before any fix** — no silent deferral, no unauthorized fixing.
- **D-09:** Phase 14's deferred review warnings **WR-02..WR-06 are swept in this phase** so v1.5 closes clean (they are data/locale-level warnings, expected cheap).
- **D-10:** Results land in a **single consolidated verification report** (`15-VERIFICATION.md`) covering: gate results, diff-proof output, count/search assertions, smoke matrix table, findings + dispositions. Phase 10 "VERIFICATION passed 10/10" style.

### Test suite policy
- **D-11:** The D-11 suite-freeze precedent is interpreted for this phase: **catalog-integrity assertions are allowed** — extending the JSON-integrity suite fits QUAL-01's purpose and does not violate the freeze's spirit (which guarded behavior-neutral phases). No behavior-test additions beyond catalog proofs.
- **D-12:** New integrity assertions live in the **existing data-integrity suite file(s)** alongside current JSON-integrity tests — one home for catalog proofs, no new test spec files.
- **D-13:** Pass bar: mechanical gates exit 0 (build/lint/test) + the catalog proofs themselves (45-count, category count, search reachability, EN/FR key parity). Current hard numbers remain the reference (143 tests green); new assertions may raise the count; no new coverage floor.

### OpenCode's Discretion
Exact segment values in the scripted workflows, exact assertion wording/placement within the existing integrity suite, the diff-filter command details, report structure/formatting, and FR wording of any fix-driven locale additions — as long as gates stay green, parity holds, and the whitelist (D-06) is respected.

</decisions>

<specifics>
## Specific Ideas

- The smoke script should feel like the Phase 12 dual-theme matrix: same table format, honest PASS/FAIL recording, explicit user approval at the end.
- Storage-account workflow should re-prove the D-01 special case from Phase 14 (lowercase, no separators) and Autopilot should re-prove the 15-char budget behavior.

</specifics>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone scope & success criteria
- `.planning/ROADMAP.md` §Phase 15 — Deliverables 15a–15b with the exact success criteria this phase must prove.
- `.planning/REQUIREMENTS.md` — QUAL-01 text; traceability table (21/21 REQ-IDs).

### Prior-phase decisions applied here
- `.planning/phases/13-new-microsoft-365-categories-teams-sharepoint-power-platform/13-CONTEXT.md` — Phase 13 decisions (new categories, tips mechanism, patterns[] variants).
- `.planning/phases/14-category-expansions-azure-caf-resources-intune/14-CONTEXT.md` — Phase 14 decisions (storage-account no-separator case D-01..D-04, Autopilot macro budget D-05..D-08).
- `.planning/phases/14-category-expansions-azure-caf-resources-intune/14-REVIEW.md` — WR-02..WR-06 deferred warnings to be swept (D-09).

### Project constraints & precedents
- `.planning/PROJECT.md` — Constraints (data model, bilingual parity, Linux `npm ci`, git policy) and Key Decisions table (D-10/D-11/D-12 precedents).
- `.planning/codebase/CONVENTIONS.md` §Data-Driven JSON Conventions — schema/integrity rules the tests enforce.
- `.planning/codebase/TESTING.md` — test layout and JSON-integrity test targets (note: pre-v1.1 document; vitest now configured in `vite.config.ts`).

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- JSON-integrity Vitest suite (`src/test/`, data-integrity specs) — natural home for the 45-count/category/search assertions (D-12).
- `allConventions` aggregation via `import.meta.glob` in `src/lib/data.ts` — single point to assert catalog size and category coverage.
- Locale files `src/locales/en.json` / `fr.json` — flat-key mirror makes parity mechanically checkable.
- `check:tokens` gate — untouched by this phase but part of the green-gates evidence.

### Established Patterns
- Conventions auto-discover from `src/rules/<category>/` — dropping JSON requires no registration; proof = diff filter + count assertion.
- Honest-FAIL smoke recording (Phase 10/12): agent-scripted steps, user executes, results recorded verbatim.
- Milestone-close flow: verification → review → `/gsd-complete-milestone` (archive to `.planning/milestones/v1.5-*`, annotated tag).

### Integration Points
- Git history: base ref `v1.4` tag for the zero-code-diff proof (D-05); current work lives on the v1.5 gsd branch.
- `npm ci` required on Linux before build/lint/test (Windows-native node_modules constraint).
- Catalog state verified on disk 2026-08-25: 45 convention JSONs across 11 categories (azure 12, intune 9, conditional-access 2, defender 3, entra-id 1, exchange 2, groups 4, power-platform 1, purview 4, sharepoint 3, teams 4), 46 segment-library JSONs.

</code_context>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Standing deferrals live in REQUIREMENTS.md Future Requirements: SharePoint library/folder conventions, additional Azure resources ACR/AKS/Cosmos DB/Service Bus, Power Platform solutions/apps/flows, DATA-01 schema-check script, DATA-02 segment-level validation rules.)

</deferred>

---

*Phase: 15-milestone-verification-full-catalog-integrity*
*Context gathered: 2026-08-25*
