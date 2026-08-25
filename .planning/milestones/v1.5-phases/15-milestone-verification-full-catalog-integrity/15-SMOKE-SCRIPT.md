# Phase 15 / v1.5 — User-Run Dual Smoke Matrix Script

**Plan:** 15-03 · **Requirement:** QUAL-01 · **Authored:** 2026-08-25
**Scope:** D-01 full dual matrix — 6 workflows × EN/FR × dark/light ≈ **24 cells**. Per D-02 this matrix is **user-run**: you build each name in the running app and judge output + governance score honestly; the executor records results as-is (FAILs are findings, not process failures).
**Setup:** run `npm run dev`, open the app. Theme axis: sun/moon toggle in the CommandBar. Language axis: EN/FR pill in the CommandBar. Run each workflow once per axis: **EN/Dark, EN/Light, FR/Dark, FR/Light**.

---

## Workflow 1 — Microsoft Teams · Project Team (CR-01 re-proof)

1. Click category **Teams** in the left rail → select convention **Project Team** (`teams-project-team`).
2. Segment **Workload** (free-text field): type `Atlas`.
3. Segment **Function** (dropdown backed by the core/function library): type the custom value `Finance` (the library itself offers Alerts/Info/Backup/Reporting/Invoices/SSO — `Finance` is entered as a custom value; the field accepts custom input).
4. Generated name must read **`PRJ-Atlas-Finance`** — mixed case preserved exactly (this convention is `caseMode: preserve`; re-proves the CR-01 fix).
5. Validation: all rows pass; length 16 ≤ 30 max; governance score correct per checklist.

## Workflow 2 — SharePoint · Team Site (Group-Connected)

1. Click category **SharePoint** → select **Team Site (Group-Connected)** (`spo-team-site`).
2. Segment **SiteName** (free-text): type `sales-eu`.
3. Expected generated name: **`sales-eu`** — lowercase-hyphenated (`forceLowercase` + `^[a-z0-9-]+$`), valid; all validation rows pass.

## Workflow 3 — Power Platform · Environment

1. Click category **Power Platform** → select **Power Platform Environment** (`pp-environment`).
2. Segment **Lifecycle**: select `dev` (library option; also the field default).
3. Segment **Region**: type custom value `westeurope` (the core/region library carries abbreviations WE/NE/FRC/FRS — type the long form as a custom value).
4. Segment **BusinessUnit**: select `IT` (core/department library option).
5. Segment **Purpose**: type custom value `sandbox` (core/purpose library has no sandbox entry — type it).
6. Expected generated name: **`dev-westeurope-it-sandbox`** — lowercase throughout even if any picked value was displayed uppercase (`forceLowercase`); all validation rows pass.

## Workflow 4 — Purview · Sensitivity Label (Sublabel variant)

1. Click category **Purview** → select **Sensitivity Label** (`purview-sensitivity-label`).
2. Select the **Sublabel** pattern variant (parent label alone is the other variant).
3. Segment **Classification** (fixed dropdown, no custom values): select `Confidential`.
4. Segment **Sublabel** (free-text): type `Payroll`.
5. Expected generated name: **`Confidential-Payroll`** — case preserved (`caseMode: preserve`); sublabel respects its space-free `^[A-Za-z0-9&/-]+$` field pattern; all validation rows pass.

## Workflow 5 — Azure · Storage Account (CAF outlier + WR-02 negative probe)

1. Click category **Azure** → select **Storage Account** (`azure-storage-account`).
2. Fixed prefix `st` is baked into the pattern. Segment **Workload**: select `app`. Segment **Environment**: `prod`. Segment **Instance**: `001`.
3. Expected generated name: **`stappprod001`** — lowercase, NO separators; all validation rows pass including *Allowed characters* (regex `^[a-z0-9][a-z0-9]{1,22}[a-z0-9]$`, the WR-02 3–24 minimum encoding).
4. **NEGATIVE probe (WR-02 re-proof):** shrink the name below the Azure minimum — remove/clear the **Environment** and **Instance** segment rows (or empty their values so they collapse), leaving at most a 1–2 character Workload contribution (e.g. custom value `x`). The name reduces toward `st`/`stx` (< 4 chars).
5. Expected: the **Allowed characters** validation row must now show **FAIL** — a sub-minimum storage-account name is rejected. (If your build cannot shrink below 4 chars through the UI, record the cell honestly as what you observed — that observation is the data.)

## Workflow 6 — Intune · Autopilot Device Name (budget probes)

1. Click category **Intune** → select **Autopilot Device Name** (`intune-autopilot-device-name`).
2. Select pattern variant **Prefix + Random**. Note: this variant pre-seeds Macro to `%RAND:12%` — change it in the next step.
3. Segment **Prefix**: type/select `LT-`. Segment **Macro** (autopilot-macros dropdown): select `%RAND:6%`.
4. Expected template: **`LT-%RAND:6%`** — 11 typed characters ≤ 15 budget; validation passes.
5. **Boundary probe:** change Macro to `%RAND:12%` with Prefix `LT-` → template `LT-%RAND:12%` = exactly **15** expanded characters (3 static + 12 random). Still valid — no clamp misfires at the boundary. (Only going beyond 15 should trip the macro-budget validation row.)

---

## Judging & recording

- Judge every cell yourself: generated-name correctness, validation-row correctness, and **governance-score correctness** included. Mark PASS/FAIL honestly per cell — a FAIL is a finding to triage (D-08), never something to work around silently.
- One judgment per workflow × axis combination ≈ 24 cells (D-01).

### Results

> **⛔ WAIVED by direct user approval — 2026-08-25.**
> The matrix below was **NOT executed and NOT passed**. No cell carries a PASS or FAIL judgment because none was performed. The user manually validated the app themselves and explicitly chose to waive the cell-by-cell dual smoke matrix when asked how to proceed with the empty results table. This coverage gap is recorded verbatim in `15-VERIFICATION.md` § Smoke matrix (user-run) and reflected in the final verdict.

| # | Workflow | EN/Dark | EN/Light | FR/Dark | FR/Light |
|---|----------|---------|----------|---------|----------|
| 1 | Teams — Project Team (`PRJ-Atlas-Finance`) | WAIVED | WAIVED | WAIVED | WAIVED |
| 2 | SharePoint — Team Site (`sales-eu`) | WAIVED | WAIVED | WAIVED | WAIVED |
| 3 | Power Platform — Environment (`dev-westeurope-it-sandbox`) | WAIVED | WAIVED | WAIVED | WAIVED |
| 4 | Purview — Sensitivity Label (`Confidential-Payroll`) | WAIVED | WAIVED | WAIVED | WAIVED |
| 5 | Azure — Storage Account (`stappprod001` + negative probe) | WAIVED | WAIVED | WAIVED | WAIVED |
| 6 | Intune — Autopilot (`LT-%RAND:6%` + `%RAND:12%` boundary) | WAIVED | WAIVED | WAIVED | WAIVED |

Cells completed: **0 / 24 executed — WAIVED by user approval.** No PASS/FAIL values exist; the `WAIVED` markers above denote waived coverage, not passing tests.

Waiver disposition recorded in `15-VERIFICATION.md` (Plan 15-04) alongside the mechanical-only final verdict.

---

*Phase: 15-milestone-verification-full-catalog-integrity*
*Scripted: 2026-08-25 by Plan 15-03 — every segment value verified against `src/rules/*/*.json` and `src/data/segments/*/*.json` before authoring.*
