# Phase 15: Milestone Verification — Full Catalog Integrity - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-08-25
**Phase:** 15-milestone-verification-full-catalog-integrity
**Areas discussed:** Smoke matrix scope, Zero-code-diff proof, Finding handling, Test suite policy

---

## Smoke matrix scope

| Option | Description | Selected |
|--------|-------------|----------|
| Full dual matrix (~24) | 6 workflows × EN/FR × dark/light, honest FAIL recording (Phase 12 D-10/D-12 precedent) | ✓ |
| Bilingual only (12) | 6 workflows × EN/FR; theme untouched this milestone | |
| Minimal spot-check (6) | One representative name per category in default language/theme | |

| Option | Description | Selected |
|--------|-------------|----------|
| User-run | User builds the 6 names in the running app; agent records PASS/FAIL as-is | ✓ |
| Agent-run, user reviews | Agent drives workflows in browser/jsdom; user reviews transcript table | |
| Hybrid | Agent dry-runs first; full user matrix only if dry-run is clean | |

| Option | Description | Selected |
|--------|-------------|----------|
| Agent scripts it | Fixed convention + segment values per workflow, step-by-step reproducible script | ✓ |
| You improvise | User chooses conventions/values freely | |

**User's choices:** Full dual matrix (~24 runs); user-run; agent-scripted.
**Notes:** Matches Phase 12's 18-run dual-theme matrix precedent scaled to 6 workflows.

---

## Zero-code-diff proof

| Option | Description | Selected |
|--------|-------------|----------|
| git diff vs v1.4 tag | Diff milestone base tag, filter allowed data paths, justify leftovers | ✓ |
| Merge-base with main | Use branch merge-base as base instead of the tag | |
| File-inventory proof | No diff; grep-based inventory proving changed files live under data paths | |

| Option | Description | Selected |
|--------|-------------|----------|
| Data+locales only | Allow src/rules/**, src/data/**, locales en/fr.json; everything else = code diff | ✓ |
| Data + tests/deps | Additionally allow package.json/lockfile and test files | |
| Strict JSON-only | Only src/rules/** and src/data/**; locale additions also need justification | |

| Option | Description | Selected |
|--------|-------------|----------|
| Count + search assertions | allConventions===45, 11 categories, global-search hits per new convention — mechanically | ✓ |
| Manual nav walk | User clicks through categories and searches; observations recorded as proof | |

**User's choices:** git diff vs v1.4 tag; data+locales whitelist; count + search assertions.

---

## Finding handling

| Option | Description | Selected |
|--------|-------------|----------|
| Fix mechanical, triage visual | Mechanical FAILs fixed in-phase via gap-closure plan; subjective smoke FAILs triaged with user first | ✓ |
| Fix everything | All findings fixed in-phase, no deferral without explicit approval | |
| Record-and-defer all | Findings recorded for a future cleanup milestone only | |

| Option | Description | Selected |
|--------|-------------|----------|
| Sweep in Phase 15 | WR-02..WR-06 absorbed into this phase so v1.5 closes clean | ✓ |
| Defer to backlog | Roll into next milestone backlog like earlier deferred review items | |
| Triage then decide | Agent triages effort/risk per item; user decides during planning | |

| Option | Description | Selected |
|--------|-------------|----------|
| Single verification report | One consolidated 15-VERIFICATION.md (gates, diff proof, smoke table, dispositions) | ✓ |
| Review-doc pattern | 15-REVIEW.md + smoke in plan SUMMARYs; no separate verification doc | |
| Summaries only | Plan SUMMARYs + STATE.md; no dedicated report | |

**User's choices:** Fix mechanical / triage visual; sweep WR-02..WR-06 in Phase 15; single verification report.

---

## Test suite policy

| Option | Description | Selected |
|--------|-------------|----------|
| Integrity assertions allowed | Extending the JSON-integrity suite fits QUAL-01; D-11 freeze doesn't apply to integrity proofs | ✓ |
| Strict freeze, scripts only | Suite count unchanged; new checks run as one-off scripts feeding the report | |
| No restrictions | Any test the planner finds valuable | |

| Option | Description | Selected |
|--------|-------------|----------|
| Extend existing suite | New assertions join the existing data-integrity suite file(s); no new spec files | ✓ |
| New dedicated spec | e.g., src/test/catalog-integrity.test.ts keeps v1.1-era suite untouched | |

| Option | Description | Selected |
|--------|-------------|----------|
| Gates + catalog proofs only | build/lint/test exit 0 + 45-count/category/search/parity proofs; 143 green is reference floor | ✓ |
| Add coverage floor | Also set a new coverage threshold re-proven at close | |
| Exit codes only | Don't track counts at all | |

**User's choices:** Integrity assertions allowed; extend existing suite; gates + catalog proofs pass bar.

---

## OpenCode's Discretion

Exact segment values in scripted smoke workflows, exact assertion wording/placement within the existing integrity suite, diff-filter command details, verification report structure/formatting, FR wording of any fix-driven locale additions.

## Deferred Ideas

None — discussion stayed within phase scope.
