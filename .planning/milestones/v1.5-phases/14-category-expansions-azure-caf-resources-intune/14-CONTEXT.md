# Phase 14: Category Expansions — Azure CAF Resources + Intune - Context

**Gathered:** 2026-08-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Add 8 new conventions as data-driven JSON to the two *existing* Azure and Intune categories: storage account, key vault, NSG, public IP per the CAF abbreviation standard (AZURE-01..04) and Autopilot device-name template, Group Tag, update ring, assignment groups (INTUNE-01..04). No new category directories → no icon wiring needed (unlike Phase 13). The phase deliberately exercises special-case validation patterns: storage account breaks the hyphenated convention shape (no-separator + lowercase-only), and Autopilot carries a hard 15-char budget with `%SERIAL%`/`%RAND:x%` macros that expand after the app's job is done.

</domain>

<decisions>
## Implementation Decisions

### Storage-account special case (AZURE-01)
- **D-01:** Builder shape is a literal `st` prefix with NO separator tokens — pattern `st[Workload][Environment][Instance]`; segments concatenate directly (`stprovad001`). Breaks the hyphenated Azure-category norm deliberately.
- **D-02:** Hard validation via existing schema only: `validation.forceLowercase` + whole-name `allowedPattern` `^[a-z0-9]+$` (lowercase alphanumeric, no hyphens). Zero code.
- **D-03:** Uppercase input is auto-lowercased by `forceLowercase`; the allowedPattern guards residual violations (hyphens, symbols). No flag-only UX.
- **D-04:** maxLength 24 enforces the official limit; global uniqueness is surfaced as a bilingual tip explaining the name IS the endpoint (`stprovad001.blob.core.windows.net`) — uniqueness itself cannot be validated client-side.

### Autopilot device-name template (INTUNE-01)
- **D-05:** The hard 15-char limit is enforced as maxLength 15 counting LITERAL typed text (%SERIAL% = 8 chars as typed), plus a bilingual tip that `%SERIAL%` expands to the real serial at enrollment — keep static text well under 15. Macro-expansion-aware length estimation was explicitly rejected (code change).
- **D-06:** Macros are inserted via a dropdown segment library (e.g. `src/data/segments/intune/autopilot-macros.json`) holding `%SERIAL%` and `%RAND:1%`…`%RAND:15%` values; custom values still allowed. Prevents macro typos.
- **D-07:** Character rules split: charset enforced via whole-name `allowedPattern` (letters/numbers/hyphens/%-macros) + per-field patterns on text segments; the not-all-numbers rule stays a bilingual tip (lookahead regex rejected as opaque checklist noise).
- **D-08:** One convention with `patterns[]` variants (Phase 13 D-14 precedent) — e.g. "Prefix + serial" (`DT-%SERIAL%`) vs "Custom template" — instead of multiple conventions.

### Key vault (AZURE-02)
- **D-09:** The official 3–24 char rule is honored with tips + partial hard validation: `maxLength` 24 plus whole-name `allowedPattern` for start-letter / end-letter-or-number anchors. A schema `minLength` extension was explicitly REJECTED — zero code changes preserved for QUAL-01.
- **D-10:** Sub-rule split: start letter + end letter/number = hard pattern; no-consecutive-hyphens = tip (cannot combine cleanly with the anchors in one readable regex); 3-char minimum = tip.
- **D-11:** Builder shape is hyphenated CAF style `kv-[Workload]-[Environment]-[Region]` — hyphens are legal in vault names (just never doubled); consistent with the rest of the Azure category (storage account D-01 is the sole exception).

### Segment & value sources
- **D-12:** New CAF-standard workload-abbreviation segment library (e.g. `src/data/segments/azure/caf-workloads.json`: st, kv, nsg, pip, vm, vnet…) because existing core Workload values (AD, VNET, WEBAPP) predate CAF abbreviations. Core Environment/Region/Instance libraries are reused wherever values fit (Phase 13 D-11 rule).
- **D-13:** Group Tags (INTUNE-02): new sample-value segment library (e.g. `intune/group-tags.json`) with department/site code samples (DEV, HR, PARIS…) and `allowCustomValue` — tenant-specific in reality, mirroring Phase 13 D-09 entra-attributes precedent.
- **D-14:** Update rings (INTUNE-03): new segment library with fixed ring values Pilot/Dev/Broad/Production.
- **D-15:** Assignment groups (INTUNE-04): reuse/extend existing Intune libraries. NOTE: current `src/data/segments/intune/intune-prefix.json` holds CMP/CFG/MAM/MACFG — it does NOT yet contain the `INTUNE-{DEV|USR}` tokens, so the planner must either extend that file or add a sibling library (within D-12/D-11 discretion).

### Carried forward from Phase 13 (applied here)
- Convention-level `validation` blocks + tips only; `validation-rules.json` untouched (13-D-12).
- All gotchas as EN+FR bilingual tip strings on fields/conventions via InfoIcon mechanism (13-D-13).
- `patterns[]` variants to avoid convention-count inflation (13-D-14).
- Per-field `allowedPattern` exists since plan 13-04 — usable for INTUNE-01 text segments.

### OpenCode's Discretion
Exact regex strings within the decided strictness splits (D-02/D-07/D-09/D-10), exact segment-file names/splits within D-12..D-15, NSG/public-IP pattern details per CAF research (they follow the ordinary hyphenated pattern with no special validation), whether INTUNE-04 extends intune-prefix.json or adds a new file, FR terminology for all new keys, and example values — as long as gates stay green, EN/FR parity holds, and zero code changes outside JSON.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone research (grounding for all 8 conventions)
- `.planning/research/SUMMARY.md` — Official Microsoft standards digest researched 2026-08-24: CAF abbreviation table (storage/key-vault/NSG/public-IP patterns), Autopilot 15-char rule + `%SERIAL%`/`%RAND:x%` macros, Group Tag / update ring / assignment-group taxonomies. All patterns/tips must match these sources.

### Planning artifacts
- `.planning/REQUIREMENTS.md` — AZURE-01..04, INTUNE-01..04 requirement text (this phase's scope); Future Requirements lists explicit deferrals.
- `.planning/ROADMAP.md` §Phase 14 — Deliverables 14a–14b with success criteria; watch-outs on storage-account no-hyphen break and Autopilot macro budget.
- `.planning/PROJECT.md` — Constraints (data model, bilingual parity, git policy) and Key Decisions table.
- `.planning/phases/13-new-microsoft-365-categories-teams-sharepoint-power-platform/13-CONTEXT.md` — Prior-phase decisions reused here (tips mechanism, patterns[] variants, segment-reuse rule).

### Codebase maps
- `.planning/codebase/CONVENTIONS.md` §Data-Driven JSON Conventions — NamingConvention schema, segment library shape, catalog merge rules.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `NamingValidationConfig` (`src/types/Rule.ts:40`) — maxLength, allowedPattern, forceLowercase, removeCharacters, caseMode already cover every enforcement decided above with zero code.
- Whole-name + per-field `allowedPattern` (plan 13-04) — supports storage lowercase-only and Autopilot charset rules.
- `NamingPatternOption` / `patterns[]` variants — covers Autopilot template variants (13-D-14 precedent: purview sensitivity labels).
- Core segment libraries (`src/data/segments/core/*.json`) — reusable Environment/Region/Instance values.
- Existing Intune segments (`src/data/segments/intune/`: assignments.json, intune-prefix.json, intune-scopetag.json) — starting point for INTUNE-04 (note: no DEV/USR tokens yet).

### Established Patterns
- Conventions auto-discover from `src/rules/<category>/` via `import.meta.glob` — dropping JSON files into existing `azure/` and `intune/` dirs requires no registration.
- kebab-case convention ids, `[Segment]` pattern tokens, builder blocks with locked/recommended segments, EN/FR locale mirror.
- Tips via `field?.tip && <InfoIcon>` — sole mechanism for uniqueness/expansion/immutability guidance.

### Integration Points
- `src/rules/azure/` — 4 new convention files join 8 existing ones (existing rules use `^[A-Za-z0-9_.-]+$`; storage account intentionally diverges per D-02).
- `src/rules/intune/` — 4 new convention files join 5 existing ones.
- `src/data/segments/azure/`, `src/data/segments/intune/` — new library files per D-12..D-14.
- Locale files `src/locales/en.json` / `fr.json` — parity must hold (374=374 baseline grows).

</code_context>

<specifics>
## Specific Ideas

- Storage-account name doubles as its public endpoint — the uniqueness tip should teach this (`stprovad001.blob.core.windows.net`).
- Autopilot templates should teach the enrollment-time expansion risk: static text must stay well under 15 chars because %SERIAL% grows.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Pre-existing deferrals recorded in REQUIREMENTS.md Future Requirements: additional Azure resources beyond this batch — ACR, AKS, Cosmos DB, Service Bus.)

</deferred>

---

*Phase: 14-Category Expansions — Azure CAF Resources + Intune*
*Context gathered: 2026-08-24*
