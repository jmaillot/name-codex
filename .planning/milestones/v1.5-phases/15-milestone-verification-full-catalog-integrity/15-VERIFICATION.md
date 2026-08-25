# Phase 15 / v1.5 — Full Milestone Verification Record

**Plan:** 15-03 · **Requirement:** QUAL-01 · **Executed:** 2026-08-25
**Method:** mechanical gates + zero-code-diff proof + catalog assertions by executor; dual smoke matrix user-run per D-02/D-10 (Plan 15-04).
**Status:** COMPLETE-WITH-WAIVER — mechanical evidence green; dual smoke matrix WAIVED by direct user approval on 2026-08-25 (see § Smoke matrix below).

---

## Mechanical Gates

Environment: Linux worktree checkout (`/mnt/c`, WSL) — `npm ci` run first per STATE.md environment note (node_modules held Windows-only native bindings). Node v22.23.2, npm 10.9.8, vitest v4.1.11.

### Gate 1: `npm ci`

exit code **0**. Full output:

```
added 137 packages, and audited 138 packages in 1m

31 packages are looking for funding
  run `npm fund` for details

2 vulnerabilities (1 moderate, 1 high)
To address all issues, run:
  npm audit fix
```

Result: ✅ PASS — clean Linux install from the committed lockfile only (137 packages). The 2 audit advisories are pre-existing dependency advisories, unchanged this milestone (no dependency versions changed — see Zero-code-diff proof below).

### Gate 2: `npm run check:tokens`

exit code **0**. Full output:

```
  [dark] --text-primary on --surface-canvas: 18.54:1 (min 7:1) PASS
  [dark] --text-primary on --surface-raised: 17.74:1 (min 7:1) PASS
  [dark] --text-primary on --surface-panel: 16.43:1 (min 7:1) PASS
  [dark] --text-primary on --surface-overlay: 14.27:1 (min 7:1) PASS
  [dark] --text-secondary on --surface-canvas: 8.05:1 (min 4.5:1) PASS
  [dark] --text-secondary on --surface-raised: 7.70:1 (min 4.5:1) PASS
  [dark] --text-secondary on --surface-panel: 7.13:1 (min 4.5:1) PASS
  [dark] --text-secondary on --surface-overlay: 6.19:1 (min 4.5:1) PASS
  [dark] --text-on-accent on --accent-strong: 4.67:1 (min 4.5:1) PASS
  [light] --text-primary on --surface-canvas: 13.22:1 (min 7:1) PASS
  [light] --text-primary on --surface-raised: 14.89:1 (min 7:1) PASS
  [light] --text-primary on --surface-panel: 16.10:1 (min 7:1) PASS
  [light] --text-primary on --surface-overlay: 15.40:1 (min 7:1) PASS
  [light] --text-secondary on --surface-canvas: 4.92:1 (min 4.5:1) PASS
  [light] --text-secondary on --surface-raised: 5.55:1 (min 4.5:1) PASS
  [light] --text-secondary on --surface-panel: 6.00:1 (min 4.5:1) PASS
  [light] --text-secondary on --surface-overlay: 5.74:1 (min 4.5:1) PASS
  [light] --text-on-accent on --accent-strong: 6.67:1 (min 4.5:1) PASS
TOKEN GATE PASS (literals: 0 violations)
WCAG: 18/18 pairs pass (dark 9/9, light 9/9)
```

Result: ✅ PASS — 18/18 contrast pairs (dark 9/9, light 9/9), 0 literal violations.

### Gate 3: `npx vitest run`

First full-suite run hit the **known WSL `/mnt/c` forks worker-startup flake** (documented in 14-REVIEW-FIX.md §Verification and both Wave-1 summaries): vitest failed to start workers for 2 files before they ran. Recorded honestly per T-15-03-04 — never hidden:

```
Error: [vitest-pool]: Failed to start forks worker for test files /mnt/c/Projects/governance-codex/name-codex/src/lib/parse.test.ts.
Caused by: Error: [vitest-pool-runner]: Timeout waiting for worker to respond

Error: [vitest-pool]: Failed to start forks worker for test files /mnt/c/Projects/governance-codex/name-codex/src/hooks/useAppState.preserve-case.test.tsx.
Caused by: Error: [vitest-pool-runner]: Timeout waiting for worker to respond

 Test Files  8 passed (8)
      Tests  163 passed (163)
     Errors  2 errors
   Start at  14:47:46
   Duration  66.28s
EXIT=1
```

Recovery step 1 — rerun of the two affected files in isolation (`npx vitest run src/lib/parse.test.ts src/hooks/useAppState.preserve-case.test.tsx`):

```
 Test Files  2 passed (2)
      Tests  20 passed (20)
   Start at  14:49:09
   Duration  34.32s
EXIT=0
```

Recovery step 2 — clean full-suite rerun with the established `--maxWorkers=2` CLI flag (no config change; precedent from Plans 15-01/15-02):

```
 ✓ src/lib/generators.test.ts (26 tests) 115ms
 ✓ src/lib/segments.test.ts (35 tests) 106ms
 ✓ src/hooks/useAppState.preserve-case.test.tsx (1 test) 37ms
 ✓ src/hooks/useAppState.autopilot.test.tsx (5 tests) 46ms
 ✓ src/lib/data-integrity.test.ts (18 tests) 26ms
 ✓ src/lib/validation.test.ts (38 tests) 24ms
 ✓ src/lib/storage.test.ts (21 tests) 13ms
 ✓ src/lib/macros.test.ts (14 tests) 19ms
 ✓ src/lib/autopilot-budget.test.ts (6 tests) 15ms
 ✓ src/lib/parse.test.ts (19 tests) 10ms

 Test Files  10 passed (10)
      Tests  183 passed (183)
   Start at  14:49:55
   Duration  191.15s
EXIT=0
```

Result: ✅ PASS — **183 tests / 10 files / 0 errors**, matching the phase baseline from 15-01 (143 at v1.5 start-of-phase reference + 40 added across Phases 13–15). Acceptance bar was ≥147; actual 183. Both flake facts annotated above (T-15-03-04).

### Gate 4: `npm run build`

exit code **0**. Tail of output:

```
transforming...✓ 1963 modules transformed.
rendering chunks...
computing gzip size...
dist/index.html                            1.52 kB │ gzip:   0.76 kB
dist/assets/power-platform-CTArE9dr.svg    5.03 kB │ gzip:  1.63 kB
dist/assets/index-Bhh3sJZr.css            24.05 kB │ gzip:  5.58 kB
dist/assets/index-C2nnt7Db.js            454.57 kB │ gzip: 130.99 kB

✓ built in 11.52s
```

Result: ✅ PASS — `tsc -b && vite build`, 1963 modules transformed.

### Gate 5: `npm run lint`

exit code **0**:

```
Found 5 warnings and 0 errors.
Finished in 293ms on 45 files with 103 rules using 16 threads.
```

Warnings (all pre-existing, identical set to 15-02's stash-compare — out of scope per D-06/scope-boundary rules):

```
! react-hooks(exhaustive-deps): React Hook useMemo has unnecessary dependency: i18n.language  (src/hooks/useAppState.ts:102:6, 339:49)
! eslint(no-unused-vars): Variable 'textTokens' is declared but never used.  (scripts/check-tokens.mjs:160:7)
! eslint(no-unused-vars): Variable 'thresholds' is declared but never used.  (scripts/check-tokens.mjs:167:7)
! typescript(triple-slash-reference): Do not use a triple slash reference for vitest/config  (vite.config.ts:1:1)
```

Result: ✅ PASS — exit 0; warnings allowed by design, errors fail.

---

## Zero-code-diff proof

Per D-05/D-06: `git diff v1.4..HEAD --name-only` filtered against the allowed-change whitelist. Command and output verbatim (fixed literal patterns, no interpolation — T-15-03-02):

```
$ git diff v1.4..HEAD --name-only | grep -Ev '^(src/rules/|src/data/|src/locales/en\.json$|src/locales/fr\.json$)'
.planning/milestones/v1.4-phases/12-theme-switching-verification/12-01-SUMMARY.md
.planning/milestones/v1.4-phases/12-theme-switching-verification/12-02-SUMMARY.md
.planning/milestones/v1.4-phases/12-theme-switching-verification/12-03-SUMMARY.md
.planning/milestones/v1.4-phases/12-theme-switching-verification/12-SMOKE-MATRIX.md
.planning/phases/13-new-microsoft-365-categories-teams-sharepoint-power-platform/13-01-SUMMARY.md
.planning/phases/13-new-microsoft-365-categories-teams-sharepoint-power-platform/13-02-SUMMARY.md
.planning/phases/13-new-microsoft-365-categories-teams-sharepoint-power-platform/13-03-SUMMARY.md
.planning/phases/13-new-microsoft-365-categories-teams-sharepoint-power-platform/13-04-SUMMARY.md
.planning/phases/14-category-expansions-azure-caf-resources-intune/14-01-SUMMARY.md
.planning/phases/14-category-expansions-azure-caf-resources-intune/14-02-SUMMARY.md
.planning/phases/14-category-expansions-azure-caf-resources-intune/14-03-SUMMARY.md
.planning/phases/14-category-expansions-azure-caf-resources-intune/14-04-SUMMARY.md
.planning/phases/14-category-expansions-azure-caf-resources-intune/14-05-SUMMARY.md
.planning/phases/15-milestone-verification-full-catalog-integrity/15-01-SUMMARY.md
.planning/phases/15-milestone-verification-full-catalog-integrity/15-02-SUMMARY.md
src/App.css
src/assets/icons/power-platform.svg
src/assets/icons/purview.svg
src/assets/icons/sharepoint.svg
src/assets/icons/teams.svg
src/components/NavPanel.tsx
src/components/SegmentEditor.tsx
src/hooks/useAppState.autopilot.test.tsx
src/hooks/useAppState.preserve-case.test.tsx
src/hooks/useAppState.ts
src/lib/autopilot-budget.test.ts
src/lib/data-integrity.test.ts
src/lib/macros.test.ts
src/lib/macros.ts
src/lib/segments.test.ts
src/lib/segments.ts
src/lib/validation.test.ts
src/lib/validation.ts
src/styles/tokens.css
src/types/Rule.ts
vite.config.ts
```

Full changed-file list: **67 files**. Whitelist side (filtered out by design):

```
      1 src/data/**            (validation-rules.json stale-override removal, 15-01)
      8 src/data/segments/**   (Phase 13/14 segment libraries)
      1 src/locales/en.json
      1 src/locales/fr.json
      4 src/rules/azure/
      4 src/rules/intune/
      1 src/rules/power-platform/
      4 src/rules/purview/
      3 src/rules/sharepoint/
      4 src/rules/teams/
```

### Survivor justification (D-06 "zero or justified" clause)

Every surviving path is explicitly justified below with its originating milestone commit. **Note vs plan pre-declaration:** Plan 15-03 pre-declared only the three WR-04..WR-06 sweep files as expected survivors; the actual survivor list additionally contains sanctioned Phase 13/14 code work and test files, each individually justified here per D-06 as recorded in the frontmatter truth ("any other surviving path must be explicitly justified in 15-VERIFICATION.md").

**Planning artifacts (doc-only, not application code):**
- `.planning/milestones/v1.4-phases/12-*.md` ×4 — deletions from commit `da474e2` ("chore: untrack v1.4 planning artifacts — .planning stays git-ignored"); restores the documented local-only planning policy, zero runtime impact.
- `.planning/phases/{13,14,15}-*-SUMMARY.md` ×11 — planning summary docs committed before the untrack chore took effect for later phases; doc-only, no runtime impact.

**Pre-declared WR-sweep survivors (Plans 15-01/15-02, sanctioned sweep D-09):**
- `src/lib/validation.ts` — WR-04 fix (defaulted 4th `fields` parameter), commit `fd0861f`; plus per-field allowedPattern validation from Phase 13 gap closure `05e1daf`.
- `src/hooks/useAppState.ts` — WR-04 call site (`fd0861f`) + CR-01 preserve-caseMode fix (`78f0245`) + assembleRawName wiring (`57c495c`) + Autopilot budget clamp (`717aec7`).
- `src/components/SegmentEditor.tsx` — WR-05/WR-06 fixes (`8b89b6e`).

**Sanctioned Phase 13/14 feature work (documented in PROJECT.md Current State):**
- `src/assets/icons/{teams,sharepoint,power-platform,purview}.svg` — official Microsoft brand SVGs for the four new categories, commit `8cd9d03` (13-03).
- `src/components/NavPanel.tsx` — new-category icon/color wiring via unified CATEGORY_META, commits `0be4419` + `35ce9a6` (13-03).
- `src/App.css` + `src/styles/tokens.css` — brand-color category tokens for the four new categories, same 13-03 commits.
- `src/lib/macros.ts` — macro-expansion helpers with budget-aware filtering, commit `f2e9e1d` (14-04).
- `src/lib/segments.ts` — `assembleRawName` segment-driven assembly, commit `fa711d2` (14-03).
- `src/types/Rule.ts` — type surface for milestone data features: per-rule `caseMode` (`8607c5d`), `patterns[]` variants (Phase 13), `fixedValues`/`maxLengthBudget` (14-02/14-04).
- `vite.config.ts` — WSL `/mnt/c` polling watcher so Vite HMR works in the dev environment, commit `f7058fa` (14-04). Dev tooling only; zero production behavior change.

**Test files (never ship to the production bundle; each from a committed fix/feature):**
- `src/hooks/useAppState.autopilot.test.tsx` — real-data regression tests, `975874a` (14-04).
- `src/hooks/useAppState.preserve-case.test.tsx` — CR-01 red→green regression harness, `78f0245` (14 fix round).
- `src/lib/autopilot-budget.test.ts` — macro budget tests, `fb57573`/`717aec7` (14-04).
- `src/lib/data-integrity.test.ts` — catalog-proof assertions (D-07/D-11/D-12), `836a108` (15-01).
- `src/lib/macros.test.ts` — helper tests, 14-04.
- `src/lib/segments.test.ts` — assembleRawName contract tests, `86687c6` (14-03); caseMode unit test, `78f0245`.
- `src/lib/validation.test.ts` — per-field allowedPattern tests, `05e1daf` (13-04).

### Supply-chain evidence

`package.json` and `package-lock.json` are **absent from the survivor set** — no dependency changes were made anywhere in v1.5. Combined with Gate 1 (`npm ci` resolving exclusively from the committed lockfile), this evidences T-15-03-03 (supply chain untouched this milestone).

---

## Evidence: catalog proofs (mechanical)

Criterion → verbatim excerpt format, from `npx vitest run src/lib/data-integrity.test.ts --reporter=verbose --maxWorkers=2` (exit 0, 18/18 tests):

**Criterion D-07/D-13: catalog contains exactly 45 conventions**

```
✓ src/lib/data-integrity.test.ts > data integrity > catalog contains exactly 45 conventions (25 existing + 20 new) 0ms
```

**Criterion D-07/D-13: catalog spans exactly 11 categories**

```
✓ src/lib/data-integrity.test.ts > data integrity > catalog spans exactly 11 categories with expected counts 1ms
```

**Criterion D-07: every new convention reachable via global-search id match**

```
✓ src/lib/data-integrity.test.ts > data integrity > every new convention is reachable via global-search id match 0ms
```

**Criterion D-13: EN/FR locale parity maintained**

```
✓ src/lib/data-integrity.test.ts > data integrity > en.json and fr.json have identical flat key sets (both directions) 2ms
```

**On-disk corroboration — category distribution across the 45 rule JSONs:**

```
$ grep -h '"category"' src/rules/*/*.json | sort | uniq -c | sort -rn
     12   "category": "Azure",
      9   "category": "Intune",
      4   "category": "Teams",
      4   "category": "Purview",
      4   "category": "Groups",
      3   "category": "SharePoint",
      3   "category": "Defender for M365",
      2   "category": "Exchange",
      2   "category": "Conditional Access",
      1   "category": "Power Platform",
      1   "category": "Entra ID",
TOTAL=45
```

---

## Smoke matrix (user-run — WAIVED by user approval)

> **⛔ EXPLICIT WAIVER — the dual smoke matrix was NOT executed and NOT passed.**
>
> **Who waived:** the user, directly and explicitly. Asked how to proceed with the unexecuted matrix (Results table empty), the user selected **"Waive the matrix"** and responded **"approved"**, stating they had manually validated the app themselves.
> **When:** 2026-08-25 (Plan 15-04 checkpoint `task 1: User runs the 6-workflow × 4-axis smoke matrix`).
> **Scope waived:** all 24 cells of the dual smoke matrix — 6 workflows (Teams Project Team, SharePoint Team Site, Power Platform Environment, Purview Sensitivity Label sublabel, Azure Storage Account + WR-02 negative probe, Intune Autopilot + `%RAND:12%` boundary probe) × 4 axes (EN/Dark, EN/Light, FR/Dark, FR/Light).
> **Status:** 0 / 24 cells executed. **No PASS values exist anywhere for this matrix — none are claimed.** The script (`15-SMOKE-SCRIPT.md`) marks every cell `WAIVED`, which denotes waived coverage, not a passing test.

**Cell count:** 0/24 executed · **PASS cells:** 0 · **FAIL cells:** 0 — **WAIVED by user approval; 24 cells of manual coverage intentionally foregone.**

**Coverage consequence (stated plainly):** every check this matrix would have provided is UNVERIFIED by direct observation. Specifically, the following can only be surfaced by manual testing in the running app and therefore remain undetected due to the waiver:

- Visual rendering correctness across dark/light themes for generated names, validation rows, and governance scores (mechanical contrast gate 2 proves token ratios only, not visual composition).
- FR-locale runtime behavior of the six workflows beyond the asserted key-parity (D-13 asserts identical flat key sets, not that each French string reads correctly in context).
- End-to-end interactive behavior: CommandBar language/theme switching mid-workflow, custom-typed segment values (`Finance`, `westeurope`, `sandbox`) flowing through the live UI, stale-select sentinel visibility, PolicyId empty-input behavior as actually experienced.
- The WR-02 negative probe (sub-minimum storage-account name rejected) and the Autopilot `%RAND:12%` boundary probe as observed through the UI rather than unit tests.

Partial mitigation: several of these behaviors have mechanical proxies recorded above — WR-02 regex encoding is locked by vitest (15-01), macro budget logic by `autopilot-budget.test.ts`, CR-01 preserve-case by `useAppState.preserve-case.test.tsx`, and EN/FR parity by the D-13 assertion. These prove logic, not user-perceived behavior.

## Findings & dispositions

**Smoke-matrix findings: none possible — the matrix was waived before execution, so zero cells were judged.** There are no FAIL cells to disposition from the matrix; per D-08 there is likewise nothing to fix or triage from it. This is not "0 findings" in the sense of a clean run — it is **0 observations made**.

**Mechanical findings from Waves 1–3 (already covered):** all five deferred review warnings were dispositioned and fixed in-phase under D-08's mechanical branch before verification — WR-02/WR-03 (15-01, commits `622972e`/`262a84e`/`836a108`) and WR-04/WR-05/WR-06 (15-02, commits `fd0861f`/`8b89b6e`). No open mechanical findings remain.

**Findings that remain undetected due to the waiver:** any subjective defect in generated-name quality, governance-score plausibility, theme rendering, or French copy in the six scripted workflows. Per D-02 these are user-judgment surfaces; with the matrix waived they are neither passed nor failed — they are **unobserved**. If any such defect exists, it ships into v1.5 undetected by this milestone's evidence. Triage path if later observed: record against D-08's subjective branch ("recorded — triage with user before any fix").

## Verdict

### Evidence summary

| # | Proof stream | Result | Basis |
|---|--------------|--------|-------|
| 1 | Gate 1 — `npm ci` | ✅ PASS | exit 0, 137 packages from committed lockfile |
| 2 | Gate 2 — `npm run check:tokens` | ✅ PASS | exit 0, 18/18 WCAG pairs, 0 literal violations |
| 3 | Gate 3 — `npx vitest run` | ✅ PASS | exit 0 after documented flake recovery — 183 tests / 10 files / 0 errors (bar was ≥147) |
| 4 | Gate 4 — `npm run build` | ✅ PASS | exit 0, tsc + vite, 1963 modules |
| 5 | Gate 5 — `npm run lint` | ✅ PASS | exit 0, 0 errors (5 pre-existing warnings, out of scope) |
| 6 | Zero-code-diff proof (D-05/D-06) | ✅ PASS | v1.4..HEAD survivors all individually justified to originating commits; package files absent → supply chain untouched |
| 7 | Count assertion (D-07/D-13) | ✅ PASS | exactly 45 conventions / 11 categories, asserted in vitest + on-disk grep corroboration |
| 8 | Category/search assertions (D-07/D-13) | ✅ PASS | 20 new ids reachable via global-search predicate; category map exact |
| 9 | EN/FR parity (D-13) | ✅ PASS | identical flat key sets both directions, deep-equal asserted |
| 10 | Smoke matrix (user-run, D-01/D-02) | ⚠️ **WAIVED** | **NOT executed, NOT passed** — waived by direct user approval 2026-08-25; 0/24 cells |

### Milestone verdict

**VERIFICATION passed 9/9 mechanical proof streams — milestone v1.5 proven ON MECHANICAL EVIDENCE ONLY, with the manual half of QUAL-01 explicitly waived by the user.**

This is a verdict of **completion-with-waiver**, not fully-passed. All mechanical evidence is green and complete: five gates exit 0, the diff proof holds with every survivor justified, the 45-convention catalog is mechanically asserted including search reachability and bilingual parity. What is missing is the entire D-01/D-02 subjective layer: no human has cell-by-cell confirmed generated names, casing/separators, validation rows, governance scores, theme rendering, or French copy in the running app for the six scripted workflows. That coverage gap is real, permanent for this milestone's record, and accepted by the user's explicit waiver decision.

**User-approval stamp:** On 2026-08-25, at the Plan 15-04 blocking checkpoint, the user was presented with the unexecuted smoke matrix (empty Results table) and chose **"Waive the matrix"**, responding **"approved"** — stating they had manually validated the app themselves and approving progression without cell-by-cell results. This waiver is recorded verbatim here and in `15-SMOKE-SCRIPT.md`; no PASS results were fabricated anywhere in this report.

v1.5 is accordingly ready for `/gsd-complete-milestone` **under the waiver**: downstream readers should treat smoke-matrix coverage as absent, not passing.

---

*Phase: 15-milestone-verification-full-catalog-integrity*
*Recorded: 2026-08-25 by Plan 15-03 executor · Finalized (smoke matrix waived by user approval, verdict written): 2026-08-25 by Plan 15-04 executor*
