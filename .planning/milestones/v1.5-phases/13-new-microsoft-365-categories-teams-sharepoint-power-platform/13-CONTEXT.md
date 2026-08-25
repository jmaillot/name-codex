# Phase 13: New Microsoft 365 Categories — Teams, SharePoint, Power Platform, Purview - Context

**Gathered:** 2026-08-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Add four brand-new category directories under `src/rules/` (plus segment catalogs under `src/data/segments/`) so users can build governed names for Microsoft Teams (TEAMS-01..04), SharePoint sites (SPO-01..03), Power Platform environments (PP-01) and Purview compliance objects (PURV-01..04) — 12 new conventions total, all discoverable at build time via the existing JSON glob. Content is grounded in official Microsoft standards documented in `.planning/research/SUMMARY.md` (researched 2026-08-24).

</domain>

<decisions>
## Implementation Decisions

### Category icons (code-touch exception)
- **D-01:** Minimal code touch — add 4 icon imports + entries to the `getCategoryIcon`/`getCategoryClass` maps in `src/components/NavPanel.tsx:18-59`, and 4 color classes in the App.css category color block. Without this, new categories silently fall back to the Azure icon.
- **D-02:** Icon assets are official Microsoft brand SVGs (Teams purple #6264A7 family, SharePoint teal #038387, Power Platform, Purview) placed in `src/assets/icons/`, mirroring the existing 7 brand icons.
- **D-03:** Color classes use brand-derived hues per category (pattern established by `defender-icon` rose in Phase 4). Known-inert tinting vs hardcoded SVG fills is accepted as with Groups/Intune (PROJECT.md ⚠️ revisit note).
- **D-04:** QUAL-01's "zero code changes" claim is scoped: it applies to conventions/segments/generators JSON only. NavPanel icon/color wiring is an explicitly allowed mechanical exception and must be reflected when QUAL-01 is verified in Phase 15.

### Category names & order
- **D-05:** Display names / JSON `category` values / validation keys are short product names: **Teams**, **SharePoint**, **Power Platform**, **Purview**. (Note: REQUIREMENTS.md says "SharePoint / OneDrive" — user chose short "SharePoint"; OneDrive coverage is deferred per Future Requirements.)
- **D-06:** Nav ordering stays alphabetical via existing `localeCompare` sort (`src/lib/data.ts:61`) — no ordering code.
- **D-07:** Directories: `src/rules/teams/`, `src/rules/sharepoint/`, `src/rules/power-platform/`, `src/rules/purview/` with mirrored `src/data/segments/<dir>/` catalogs (kebab-case, matching `entra-id` style).

### Entra naming-policy overlap (TEAMS-04 ↔ SPO-01)
- **D-08:** ONE "M365 Group Naming Policy" convention lives in the Teams category; the SharePoint group-connected Team-site convention (SPO-01) carries a tip noting group-connected sites inherit this naming policy. No duplication.
- **D-09:** Attribute-token segments ([Department], [Company], [Office]…) are dropdowns backed by a new segment library file (e.g., `teams/entra-attributes.json`) with sample values — real values come from each tenant's directory.
- **D-10:** Blocked-words guidance is a plain field/convention tip (existing `tip` mechanism) — no blocked-list enforcement, no new validation capability.

### Segments & validation
- **D-11:** Reuse core segment libraries (Environment, Region, Department, Purpose, Country) wherever values fit; create new per-category files only for genuinely new value sets (e.g., power-platform lifecycle, purview classification taxonomy).
- **D-12:** Enforcement uses convention-level `validation` blocks + tips: Teams ≤30-char `maxLength`; SharePoint URL lowercase-hyphenated `allowedPattern`; PP `<lifecycle>-<region>-<bu>-<purpose>` pattern. `validation-rules.json` stays untouched (no new category keys — it only has default/Azure today).
- **D-13:** Purview critical gotchas (retention label/policy immutable after save, no double quotes, 7-day application lead time, DLP old names persisting in audit records) go in EN+FR tip strings on fields/conventions via the existing InfoIcon tooltip mechanism.
- **D-14:** Sensitivity labels (PURV-01): one convention JSON file with two pattern variants in `patterns[]` — parent label (Personal/Public/General/Confidential/Highly Confidential from a classification library) + sublabel variant. Keeps the roadmap's 12-convention count intact.

### OpenCode's Discretion
Exact hue values per brand color class, exact segment-file splits within D-11's rule, pattern-variant depth within D-14's two variants, and FR terminology for new keys — as long as gates stay green and EN/FR parity holds.

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Milestone research (grounding for all 12 conventions)
- `.planning/research/SUMMARY.md` — Official Microsoft standards digest: Teams naming/Entra policy format, SharePoint site URL rules, Power Platform ALM environment strategy, Purview label/retention/DLP constraints. All patterns/tips must match these sources.

### Planning artifacts
- `.planning/REQUIREMENTS.md` — TEAMS-01..04, SPO-01..03, PP-01, PURV-01..04 requirement text (this phase's scope); Future Requirements section lists explicit deferrals.
- `.planning/ROADMAP.md` §Phase 13 — Deliverables 13a–13d with success criteria; watch-outs on shared Entra policy and Purview immutability.
- `.planning/PROJECT.md` — Constraints (data model, bilingual parity, git policy) and Key Decisions table (defender-icon precedent, Groups/Intune inert-tint acceptance).

### Codebase maps
- `.planning/codebase/CONVENTIONS.md` §Data-Driven JSON Conventions — NamingConvention schema, segment library shape, generator dispatch, catalog merge rules.

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `NamingConvention` schema (`src/types/Rule.ts`) — `patterns[]` variants support D-14 without schema changes; `builder` block (separator, locked/fixed segments) covers prefix conventions like PRJ-/DEPT-/SRV-.
- Core segment libraries (`src/data/segments/core/*.json`) + shared catalog (`src/data/segment-catalog.json`) — reusable Environment/Region/Department/Purpose/Country fields per D-11.
- `validation.allowedPattern` / `maxLength` on conventions — already expressive enough for storage-account-style rules; supports Teams maxLength and SharePoint lowercase-hyphenated URLs with zero code.
- Existing icon wiring pattern (`NavPanel.tsx` imports + maps, App.css category color block) — template for the 4 mechanical additions per D-01.

### Established Patterns
- Categories auto-discovered from JSON via `import.meta.glob` — dropping rule files into new `src/rules/<dir>/` directories makes them appear in nav automatically (no registration step).
- Tips surface via `field?.tip && <InfoIcon>` — the sole mechanism for Purview gotchas and blocked-words guidance (D-10/D-13).
- kebab-case convention ids, `[Segment]` pattern tokens, EN/FR locale mirror (374=374 baseline grows).

### Integration Points
- `src/components/NavPanel.tsx:18-59` — icon/color maps need 4 entries each (D-01).
- `src/App.css` category color block — 4 new color classes (D-03).
- `src/lib/data.ts:61` — alphabetical sort picks up new categories with no change (D-06).

</code_context>

<specifics>
## Specific Ideas

- Brand colors should come from official Microsoft product palettes (Teams purple, SharePoint teal) — same spirit as the existing Azure/Defender icon treatment.
- The GRP_ naming-policy convention is the canonical home for attribute-token naming across M365 workloads; SharePoint references it rather than repeating it.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope. (Pre-existing deferrals already recorded in REQUIREMENTS.md Future Requirements: OneDrive library/folder naming, Power Platform solutions/apps/flows, additional Azure resources.)

</deferred>

---

*Phase: 13-New Microsoft 365 Categories — Teams, SharePoint, Power Platform, Purview*
*Context gathered: 2026-08-24*
