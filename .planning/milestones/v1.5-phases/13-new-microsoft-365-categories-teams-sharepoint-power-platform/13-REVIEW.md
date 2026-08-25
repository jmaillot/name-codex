---
phase: 13-new-microsoft-365-categories-teams-sharepoint-power-platform
reviewed: 2026-08-24T17:00:00Z
depth: standard
files_reviewed: 25
files_reviewed_list:
  - src/App.css
  - src/assets/icons/power-platform.svg
  - src/assets/icons/purview.svg
  - src/assets/icons/sharepoint.svg
  - src/assets/icons/teams.svg
  - src/components/NavPanel.tsx
  - src/data/segments/power-platform/lifecycle.json
  - src/data/segments/purview/classification.json
  - src/data/segments/teams/entra-attributes.json
  - src/locales/en.json
  - src/locales/fr.json
  - src/rules/power-platform/pp-environment.json
  - src/rules/purview/purview-dlp-policy.json
  - src/rules/purview/purview-retention-label.json
  - src/rules/purview/purview-retention-policy.json
  - src/rules/purview/purview-sensitivity-label.json
  - src/rules/sharepoint/spo-communication-site.json
  - src/rules/sharepoint/spo-hub-site.json
  - src/rules/sharepoint/spo-team-site.json
  - src/rules/teams/m365-group-naming-policy.json
  - src/rules/teams/team-department.json
  - src/rules/teams/team-project.json
  - src/rules/teams/team-service.json
  - src/styles/tokens.css
findings:
  critical: 1
  warning: 1
  info: 3
  total: 5
status: issues_found
---

# Phase 13: Code Review Report

**Reviewed:** 2026-08-24T17:00:00Z
**Depth:** standard
**Files Reviewed:** 25
**Status:** issues_found

## Summary

Phase 13 adds four new categories (Teams, SharePoint, Power Platform, Purview): 11 rule JSONs, 3 segment libraries, nav icons/tokens/CSS, and full EN/FR locale coverage. All JSON parses cleanly; all rule libraries resolve against the segment-file loader (`src/lib/data.ts`); locale key sets are in perfect EN/FR parity; nav icon and CSS-class maps cover every new category; the vitest suite passes (137/137).

The one serious problem is cross-file: the generation engine force-uppercases every segment value (`src/hooks/useAppState.ts:250`), and none of the newly added rules account for this. Every mixed-case example shipped in the new rule files is unreachable in the app, and for the M365 Group Naming Policy rule the uppercasing corrupts Entra attribute placeholders into tokens Entra ID will not resolve. Verified programmatically: exactly 9 rule files ship mixed-case examples without `forceLowercase`, and all 9 are new in this phase — prior phases consistently authored examples to match actual (uppercased) output.

## Critical Issues

### CR-01: Engine forces ALL-CAPS output; new rules' examples and semantics assume mixed case — Entra attribute placeholders corrupted

**File:** `src/rules/teams/m365-group-naming-policy.json:20-27` (primary victim); systemic across `src/rules/teams/team-department.json`, `team-project.json`, `team-service.json`, `src/rules/sharepoint/spo-hub-site.json`, `src/rules/purview/purview-sensitivity-label.json`, `purview-retention-label.json`, `purview-retention-policy.json`, `purview-dlp-policy.json`
**Root cause:** `src/hooks/useAppState.ts:250` — `seg?.value.trim().toUpperCase() ?? ""`; `normalizeName()` lowercases only when `validation.forceLowercase` is set, and none of the new rules set it.

**Issue:** Every segment value is uppercased before name assembly. Consequences for this phase's rules:

1. **Invalid generated output (functional break):** `m365-group-naming-policy` defaults `Department` to `[Department]` from the `teams/entra-attributes` library. After uppercasing, the generated name is `GRP_SALES REPORTING_[DEPARTMENT]`. Entra ID naming-policy attribute placeholders are case-sensitive camelCase (`[Department]`, `[Company]`, …) — `[DEPARTMENT]` is not a recognized placeholder and will be treated as literal text (or rejected), producing a broken policy string. Same corruption applies to any attribute value the user picks from the dropdown.
2. **Unreachable documented examples:** all mixed-case examples cannot be reproduced by the app, e.g. `DEPT-HR-Operations` (actual: `DEPT-HR-OPERATIONS`), `Finance Hub` (actual: `FINANCE HUB`), `Legal Hold 7Y` (actual: `LEGAL HOLD 7Y`), `Confidential` classification (actual: `CONFIDENTIAL`). The Purview rules explicitly warn that retention-label names are immutable after save, making wrong-case guidance actively harmful.
3. Pre-existing rules were audited: zero older rules ship mixed-case examples without `forceLowercase` — this phase broke an established invariant.

**Fix:** Introduce an explicit per-rule case mode instead of unconditional uppercasing. Minimal, backwards-compatible option:

```ts
// types/Rule.ts
validation?: { ...; caseMode?: "upper" | "lower" | "preserve" };
```

```ts
// useAppState.ts (rawName construction)
const seg = builderSegments.find((s) => s.sourceName === token.value);
const v = seg?.value.trim() ?? "";
const mode = selectedConvention.validation?.caseMode ?? "upper";
return mode === "upper" ? v.toUpperCase() : mode === "lower" ? v.toLowerCase() : v;
```

Then set `"caseMode": "preserve"` on the nine new rules (at minimum `m365-group-naming-policy`, where the bracketed attribute tokens must never be re-cased). Alternatively, keep engine behavior frozen and rewrite all nine rules' examples/defaults to ALL-CAPS — but that does NOT fix the `[DEPARTMENT]` corruption, so the engine change is required regardless.

## Warnings

### WR-01: Category → icon and category → CSS class mappings are parallel hand-maintained structures

**File:** `src/components/NavPanel.tsx:22-39` and `41-80`
**Issue:** `getCategoryIcon()` (object literal) and `getCategoryClass()` (switch statement) encode the same category keys twice. Adding a category requires editing both plus `tokens.css`; forgetting one silently degrades to the Azure fallback icon (`?? iconAzure`) or an empty class with no error — exactly the kind of drift this phase risked (and avoided only by luck/discipline). The switch also duplicates the `"Defender"`/`"Defender for M365"` aliasing already expressed in the icon map.
**Fix:** Collapse to one source of truth:

```tsx
const CATEGORY_META: Record<string, { icon: string; cls: string }> = {
  Azure: { icon: iconAzure, cls: "azure-icon" },
  Teams: { icon: iconTeams, cls: "teams-icon" },
  // ...
};
const meta = CATEGORY_META[category];
// icon: meta?.icon ?? iconAzure ; class: meta?.cls ?? ""
```

## Info

### IN-01: Dead className `category-icon`

**File:** `src/components/NavPanel.tsx:38`
**Issue:** `<img … className="category-icon" />` references a class defined in no stylesheet (verified across all CSS files). Styling actually happens via the `.nav-icon img` descendant selector (`src/App.css:252`). Misleading dead hook for future styling work.
**Fix:** Drop the className, or move sizing onto it intentionally.

### IN-02: `pp-environment` examples not reproducible from its own Region library

**File:** `src/rules/power-platform/pp-environment.json:40-42`
**Issue:** Examples use `westeurope`/`eastus`, but the `core/region` library backing the Region segment only offers `WE`, `NE`, `FRC`, `FRS` (`src/data/segments/core/region.json`). A user following the documented example cannot reconstruct it via the dropdowns, and mixing the two styles fragments real-world naming.
**Fix:** Change examples to library values, e.g. `"dev-we-it-sandbox"` / `"prod-frc-fin-reporting"`, or add the full-name regions to the library.

### IN-03: Icon assets stylistically divergent (Illustrator exports with masks/filters)

**File:** `src/assets/icons/power-platform.svg`, `src/assets/icons/purview.svg`
**Issue:** These two are Adobe Illustrator exports carrying generator comments, `<style>` blocks, opacity masks, and gradient-filter definitions (and `purview.svg` uses a `0 0 500 500` viewBox vs `48 48` for the others), while `teams.svg`/`sharepoint.svg` are compact minimal SVGs. No security issue (no scripts/external refs — verified), and rendering is safe because icons load via `<img>` (scoped document), but the assets are ~an order of magnitude heavier and inconsistent to maintain.
**Fix:** Run the new SVGs through an optimizer (svgo) and normalize viewBoxes to 48×48 like the rest of the set.

---

_Positive notes:_ locale EN/FR parity is complete including all new keys (diff-verified); `--cat-*` tokens correctly added to **both** dark and light theme blocks in `tokens.css:52-55,124-127`; `App.css` additions are clean additive rules matching existing conventions; JSON schema usage (`patterns[]` multi-pattern, `removeCharacters`, `forceLowercase`, `lockedSegments`) is consistent with the engine's actual capabilities in `src/lib/validation.ts` and `src/lib/segments.ts`.

_Reviewed: 2026-08-24T17:00:00Z_
_Reviewer: OpenCode (gsd-code-reviewer)_
_Depth: standard_
