---
phase: 14-category-expansions-azure-caf-resources-intune
plan: 02
subsystem: data-naming-rules
tags: [intune, autopilot, naming-conventions, i18n, data-driven, macros]
requires:
  - import.meta.glob rule auto-discovery (src/lib/data.ts)
  - segment library resolution by key (src/lib/data.ts getSegmentFile)
  - patterns[] variant mechanism (purview-sensitivity-label precedent; patternName at segments.ts:62)
  - EN/FR flat-key locale resolution (src/i18n.ts flatten + keySeparator:false)
provides:
  - intune-autopilot-device-name convention (INTUNE-01, 3 pattern variants)
  - intune-group-tag convention (INTUNE-02)
  - intune-update-ring convention (INTUNE-03)
  - intune-assignment-group convention (INTUNE-04)
  - intune/autopilot-macros segment library (%SERIAL% + %RAND:1..15)
  - intune/group-tags segment library
  - intune/update-rings segment library
  - intune/assignment-group-prefix segment library (sibling to IntPrefix per D-15)
affects:
  - Intune category navigation (auto-discovers 9 conventions)
  - governance scoring / validation for new conventions
tech-stack:
  added: []
  patterns:
    - pure data-driven JSON convention (zero TypeScript changes)
    - literal-counted maxLength with post-enrollment macro expansion documented as tips (D-05)
    - separator:"" direct concatenation for prefix+macro templates
key-files:
  created:
    - src/data/segments/intune/autopilot-macros.json
    - src/data/segments/intune/group-tags.json
    - src/data/segments/intune/update-rings.json
    - src/data/segments/intune/assignment-group-prefix.json
    - src/rules/intune/intune-autopilot-device-name.json
    - src/rules/intune/intune-group-tag.json
    - src/rules/intune/intune-update-ring.json
    - src/rules/intune/intune-assignment-group.json
  modified:
    - src/locales/en.json
    - src/locales/fr.json
decisions:
  - "Autopilot maxLength 15 counts LITERAL typed text only — macro-expansion-aware estimation rejected per D-05; expansion warning carried in description + Prefix/Macro/Template tips"
  - "Colon admitted in whole-name allowedPattern ([A-Za-z0-9%:-]) because %RAND:n% requires it; not-all-numbers sub-rule kept as tip only (D-07)"
  - "assignment-group-prefix created as NEW sibling library instead of extending intune-prefix.json so CMP/CFG/MAM/MACFG consumers never see INTUNE-DEV/INTUNE-USR (D-15)"
  - "All 16 macro lib keys included on both EN and FR sides — i18n runs keySeparator:false/nsSeparator:false flat lookup, so %/: characters in keys resolve correctly"
metrics:
  duration: ~14 min
  completed: 2026-08-25
---

# Phase 14 Plan 02: Intune Conventions (Autopilot / Group Tag / Update Ring / Assignment Group) Summary

Four Intune conventions as pure data JSON — Autopilot device-name template with a hard 15-char literal budget and %SERIAL%/%RAND:n% macro dropdown across 3 pattern variants, tenant-customizable Group Tag, locked-taxonomy Update Ring, and fixed-prefix Assignment Group — backed by 4 new segment libraries, fully bilingual EN/FR, zero TypeScript changes.

## What Was Built

- **Task 1** (`e451f27`): Four segment libraries — `intune/autopilot-macros.json` (16 values: %SERIAL% + %RAND:1%..%RAND:15%), `group-tags.json` (6 tenant samples), `update-rings.json` (Pilot/Dev/Broad/Production), `assignment-group-prefix.json` (INTUNE-DEV/INTUNE-USR). `intune-prefix.json` untouched.
- **Task 2** (`eea0b05`): `intune-autopilot-device-name.json` — `validation.maxLength: 15` counting literal text (`DT-%SERIAL%` = 11 as typed); charset split via `^[A-Za-z0-9%:-]+$` whole-name vs `^[A-Za-z0-9-]+$` on the Prefix field; Macro field wired to `intune/autopilot-macros` with `allowCustomValue: true`; `"separator": ""` for direct concatenation; 3 `patterns[]` variants (prefix-serial, prefix-random, custom-template) following the Phase 13 purview precedent. All regexes anchored simple classes (ReDoS-safe per T-14-02-01).
- **Task 3** (`20f2567`): `intune-group-tag.json` (library-backed, custom codes allowed), `intune-update-ring.json` (`allowCustomValue: false` locking Pilot/Dev/Broad/Production, UpdateRing pinned via fixedFirstSegments), `intune-assignment-group.json` (`[GroupPrefix]-[GroupName]`, GroupPrefix locked from the sibling library) — all with baseline `{maxLength:128, ^[A-Za-z0-9_.-]+$}` validation.
- **Task 4** (`8d0a9f6`): 45 new keys per language in en.json/fr.json under `.data` (4× rule name/description, 3× autopilot variant names, 4× field tips incl. FR translations of expansion warnings, 30× lib option descriptions). Parity verified: 397=397 keys with identical key sets.

## Verification Results

| Gate | Result |
|------|--------|
| Task 1 node checks (16 macros, SERIAL/RAND:15 present, libs non-empty) | PASS |
| `git diff --stat src/data/segments/intune/intune-prefix.json` | empty (untouched) |
| Task 2 node checks (maxLength 15, 3 variants, separator "", DT-%SERIAL%=11 chars passes own regex, %RAND:6% accepted) | PASS |
| Task 3 node checks (libraries, allowCustomValue flags, fixedFirstSegments) | PASS |
| Typed-length simulation: DT-%SERIAL% passes `^[A-Za-z0-9%:-]+$` and ≤15 | PASS |
| EN/FR data-level parity | 397 = 397, identical key sets |
| FR translation spot-check ("Balise de groupe", "Anneau de mise à jour", "Groupe d'affectation") | PASS |
| `npx vitest run` | 143/143 passed (6 files incl. data-integrity gates over all 8 new files) |
| `npm run build` (after Linux `npm ci`) | exit 0 |
| `npm run lint` | exit 0 (5 pre-existing warnings, 0 errors) |
| `ls src/rules/intune/*.json \| wc -l` | 9 (5 existing + 4 new) |
| `ls src/data/segments/intune/*.json \| wc -l` | 8 (4 existing + 4 new) |
| Non-JSON src/ modifications | none (QUAL-01 zero-code precondition holds) |

## Deviations from Plan

None — plan executed exactly as written. All four tasks used their prescribed file contents verbatim.

One environmental note (same as 14-01): locale JSON files are nested (`{ui:{}, data:{dotted keys}}`); verification was adapted to check under `.data`. The plan's task-4 contingency about skipping `%`/`:` lib keys was NOT needed — `src/i18n.ts` initializes i18next with `keySeparator: false, nsSeparator: false`, so flat literal keys containing `%` and `:` resolve correctly and all 16 macro lib keys are mirrored on both sides.

## Known Stubs

None — every convention is fully wired through existing auto-discovery, builder, validation, and i18n resolution paths.

## Threat Model Compliance

- T-14-02-01 (mitigate): every new allowedPattern is an anchored simple character class — no lookahead, no nested quantifiers.
- T-14-02-02/03 (accept): tips/descriptions are static authored strings rendered as React text nodes; no new code paths introduced.
- T-14-02-04 (accept): literal-count enforcement + bilingual expansion warning tips implemented exactly as planned (description + Prefix.tip + Macro.tip + Template.tip).

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | e451f27 | feat(14-02): add four Intune segment libraries (autopilot macros, group tags, update rings, assignment-group prefix) |
| 2 | eea0b05 | feat(14-02): add Autopilot device-name convention (15-char literal budget, macro dropdown, 3 pattern variants) |
| 3 | 20f2567 | feat(14-02): add Group Tag, Update Ring, and Assignment Group conventions |
| 4 | 8d0a9f6 | feat(14-02): add EN/FR locale keys for Intune conventions (45 keys per language) |

## Self-Check: PASSED

- FOUND: all 8 new JSON files (4 rules, 4 segment libraries)
- FOUND: 14-02-SUMMARY.md on disk
- FOUND: commits e451f27, eea0b05, 20f2567, 8d0a9f6
