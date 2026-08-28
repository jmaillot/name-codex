# Catalog Possibilities — All Addable Conventions & Segments

> **Purpose:** One file listing *every* convention and segment value you *could* add next. Review, tick what you want, and add step-by-step. Existing items are marked ✅ shipped; proposed items are ☐ backlog. Add a new JSON file per convention — no code changes required (see `docs/DATA-FORMAT.md`).

*Last generated: 2026-08-28 after v1.6 — 45 conventions / 11 categories shipped, 40 Region + 40 Country short codes.*

---

## How to Add

1. Copy a template from `docs/templates/` or an existing rule in `src/rules/<category>/`.
2. Create `src/rules/<category>/<new-id>.json` with `id`, `category`, `name`, `description`, `pattern`, `fields[]`.
3. If you need a new segment library, add `src/data/segments/<category>/<name>.json` + locale keys `data.lib.<lib>.<value>` in `src/locales/en.json` & `fr.json`.
4. Run `npm run check:data` (must PASS) + `npx vitest run` (226) + `npm run build`.
5. Tick it here and commit.

Pattern rules: `[SegmentName]` tokens map to `fields[].name`. Use `library: "core/region"` etc. for dropdowns, `values: []` for inline fixed lists, `allowCustomValue: true/false`, `defaultValue`. See `docs/DATA-FORMAT.md`.

---

## Shipped Catalog (45) — Reference

| Category | ID | Pattern | Shipped |
|---|---|---|---|
| Azure | `azure-resource-group` | `RG-[Region]-[Environment]-[Workload]` | ✅ |
| Azure | `azure-logic-apps` | `[Country][Location][Type][Role][Instance]` — Type `LA` fixed, Role `SEAR` via `core/role` | ✅ |
| Azure | `azure-virtual-machine` | `[Country][Location][OS][Role][Instance]` — OS `core/operating-system` (W/L) | ✅ |
| Azure | `azure-virtual-network` | `[Region]-[Country]-[Workload]-[Instance]` — Workload `VNET` fixed | ✅ |
| Azure | `azure-virtual-subnets` | `...` | ✅ |
| Azure | `azure-virtual-network-gateway` | `[Region]-[Country]-[Workload]-[Instance]-[Role]` — Role `GW` fixed | ✅ |
| Azure | `azure-virtual-network-gateway-ip` | `...-[Role]-[IP]` — Role `GW` + IP `IP` fixed | ✅ |
| Azure | `azure-storage-account` | `st[Workload][Environment][Region][Instance]` — CAF 24-char, lowercase no hyphen | ✅ |
| Azure | `azure-key-vault` | `...` | ✅ |
| Azure | `azure-network-security-group` | `...` | ✅ |
| Azure | `azure-public-ip` | `pip-[Environment]-[Region]-[Workload]-[Instance]` — Workload `azure/publicip-workload` (VPNGW removed) | ✅ |
| Azure | `azure-sentinel-workspace` | `[Country][Location][Type][Role]` — Type `core/type` LA, Role `core/role` SIEM | ✅ |
| Entra ID | `entra-app-registration` | 4 patterns (Generic/Enterprise/MSP/Project) — Version `V1` selectable | ✅ |
| Exchange | `exchange-shared-mailbox` | `...` | ✅ |
| Exchange | `exchange-room-equip` | `...` | ✅ |
| Groups | `exchange-distribution-group` | `[Location]-[Prefix]-[Scope]-[Department]-[Purpose]` — Purpose `Alerts/Invoices` examples | ✅ |
| Groups | `groups-m365` | `[Prefix]-[MembershipTypeM365]-[Department]-[Purpose]-[Sensitivity]-[Environment]` | ✅ |
| Groups | `group-security` | `...` | ✅ |
| Groups | `group-pim` | `...` | ✅ |
| Groups | `m365-group-naming-policy` | `...` Entra attributes | ✅ |
| Teams | `teams-team` | `...` | ✅ |
| SharePoint | `spo-team-site` / `spo-communication-site` / `spo-hub-site` | `...` | ✅ |
| Power Platform | `pp-environment` | `PPE-...` 3 patterns | ✅ |
| Purview | `purview-sensitivity-label` / `purview-retention-label` / `purview-retention-policy` / `purview-dlp-policy` | `...` | ✅ |
| Intune | `intune-compliance-policy` | `CMP-[ScopeTag]-[OS]-[Assignments]-...-[Version]` — OS `core/operating-system`, Version `V1` | ✅ |
| Intune | `configuration-profile` | `CFG-...` — same OS/Version | ✅ |
| Intune | `endpoint-security-policy` | `SEC-[ScopeTag]-[OS]-...` — ScopeTag `intune/intune-scopetag` FR, Version `V1` | ✅ |
| Intune | `intune-autopilot-device-name` | `...` `%SERIAL%`/`%RAND:x%` 15-char | ✅ |
| Intune | `intune-group-tag` / `intune-autopilot-profile` / `intune-scope-tag` / `intune-update-policy` | `...` | ✅ |
| Conditional Access | `ca-emergency-policy` / `ca-extended-policy` | `...` | ✅ |
| Defender | `defender-m365-policy` / `def-antispam-policy` / `def-quarantine-policy` | Version `V1` selectable | ✅ |

Total: **45 / 11 categories**.

---

## Proposed Additions — Pick What You Want

### Azure CAF Resources (Not Yet Shipped) — ☐ Backlog

CAF abbreviation standard (Microsoft Cloud Adoption Framework) — each is a one-JSON convention, typically pattern `[Environment]-[Region]-[Workload]-[Instance]` or `st...` style outlier. Copy `storage-account` or `key-vault` as template.

| Proposed ID | CAF Abbr | Resource Type | Suggested Pattern | Suggested Fields | Notes |
|---|---|---|---|---|---|
| `azure-container-registry` | `acr` | Container Registry | `acr-[Environment]-[Region]-[Instance]` | Environment `core/environment`, Region `core/region` (AUE..WUS3), Instance `core/instance` | Global unique, lowercase |
| `azure-kubernetes-service` | `aks` | Kubernetes Service (AKS) | `aks-[Environment]-[Region]-[Workload]-[Instance]` | + Workload |  |
| `azure-cosmos-db` | `cosmos` | Cosmos DB | `cosmos-[Workload]-[Environment]-[Region]-[Instance]` |  |  |
| `azure-service-bus` | `sb` | Service Bus | `sb-[Workload]-[Environment]-[Region]-[Instance]` |  |  |
| `azure-sql-database` | `sql` | SQL Database | `sql-[Workload]-[Environment]-[Region]-[Instance]` |  | Pair with `sqlserver` |
| `azure-sql-server` | `sqlsrv` | SQL Server | `sqlsrv-[Workload]-[Environment]-[Region]-[Instance]` |  |  |
| `azure-api-management` | `apim` | API Management | `apim-[Workload]-[Environment]-[Region]-[Instance]` |  |  |
| `azure-function-app` | `func` | Function App | `func-[Workload]-[Environment]-[Region]-[Instance]` |  |  |
| `azure-app-service` | `app` | App Service | `app-[Workload]-[Environment]-[Region]-[Instance]` |  |  |
| `azure-app-insights` | `appi` | Application Insights | `appi-[Workload]-[Environment]-[Region]-[Instance]` |  |  |
| `azure-log-analytics` | `log` | Log Analytics Workspace | `log-[Workload]-[Environment]-[Region]-[Instance]` |  |  |
| `azure-data-factory` | `adf` | Data Factory | `adf-[Workload]-[Environment]-[Region]-[Instance]` |  |  |
| `azure-event-hub` | `evh` | Event Hub | `evh-[Workload]-[Environment]-[Region]-[Instance]` |  |  |
| `azure-key-vault` | already shipped | — | — | — | ✅ |
| `azure-redis-cache` | `redis` | Redis Cache | `redis-[Workload]-[Environment]-[Region]-[Instance]` |  |  |
| `azure-load-balancer` | `lb` | Load Balancer | `lb-[Workload]-[Environment]-[Region]-[Instance]` |  | Not to confuse with Public IP LB |
| `azure-application-gateway` | `agw` | Application Gateway | `agw-[Workload]-[Environment]-[Region]-[Instance]` |  |  |
| `azure-firewall` | `afw` | Azure Firewall | `afw-[Workload]-[Environment]-[Region]-[Instance]` |  |  |
| `azure-bastion` | `bas` | Bastion Host | `bas-[Workload]-[Environment]-[Region]-[Instance]` |  |  |
| `azure-nat-gateway` | `ngw` | NAT Gateway | `ngw-[Workload]-[Environment]-[Region]-[Instance]` |  |  |
| `azure-recovery-vault` | `rsv` | Recovery Services Vault | `rsv-[Workload]-[Environment]-[Region]-[Instance]` |  |  |
| `azure-backup-vault` | `bvault` | Backup Vault | `bvault-...` |  |  |
| `azure-synapse-workspace` | `synw` | Synapse Workspace | `synw-...` |  |  |
| `azure-databricks` | `adb` | Databricks Workspace | `adb-...` |  |  |
| `azure-cognitive-service` | `cog` | Cognitive Service | `cog-...` |  |  |

**How to prioritize:** Tick 3–5 per milestone. Storage/Key Vault/NSG/Public IP already prove the pattern — next 3 could be `acr`, `aks`, `cosmos` (most requested).

### Intune — Remaining Taxonomy — ☐ Backlog

| Proposed ID | Purpose | Suggested Pattern | Fields | Notes |
|---|---|---|---|---|
| `intune-compliance-policy` | already hard-wired OS+Version | ✅ shipped | vs Version V1 |  |
| `intune-app-protection` | Mobile App Protection | `MAM-[ScopeTag]-[Workload]-[Instance]` |  | Exists as `app-protection.json` but check Version |
| `intune-app-configuration` | App Config | `MACFG-...` |  | Check OS/Version alignment |
| `intune-autopilot-*` | Already 3 | — | — | Add `autopilot-enrollment-status` if needed |

Check existing `src/rules/intune/*.json` — any with empty `Version` or `OS` should be wired like you just fixed for Compliance/Configuration/Endpoint.

### Defender for M365 — ☐ Backlog

- `def-m365-policies` now has Version `V1` ✅
- `def-antispam-policy` still has empty `Version` — add same `V1` values block if you want consistency (not yet fixed).
- `def-quarantine-policy` has no Version — maybe add `Version` field with `V1` (quarantine policies are versioned internally).

### Entra ID — ☐ Backlog

- `entra-app-registration` now has Version `V1` ✅
- Proposed: `entra-enterprise-app` (SAML apps), `entra-conditional-access-naming` (if not covered by CA), `entra-pim-role` expansions.

### Groups / Exchange / Teams / SharePoint — ☐ Backlog

- `group-distribution` Purpose now `Alerts/Invoices` ✅
- Proposed: `group-distribution` could also get `MembershipType` variants (you have 4 groups already).
- SharePoint: consider `spo-site-script` or `spo-list` conventions if needed.
- Teams: consider `teams-channel` naming.

### Purview — ☐ Backlog

All 4 shipped. Proposed: `purview-information-protection` policy extensions, but likely out of scope.

### Conditional Access — ☐ Backlog

2 shipped. Proposed: `ca-named-location`, `ca-authentication-strength` if you want more granular CA objects.

### Segment Libraries — Expandable Values — ☐ Backlog

| Library | Current | Proposed Additions | File |
|---|---|---|---|
| `core/region` | 40 short codes (AUE..WUS3) | Already complete — consider adding sovereign regions later (China `cn-`, Gov) if needed | `src/data/segments/core/region.json` |
| `core/country` | 40 ISO codes (AE..ZA) | Already complete — add remaining 150+ ISO if you want full world coverage, or keep principal 40 | `src/data/segments/core/country.json` |
| `core/environment` | 7 (PROD/PREPROD/UAT/TEST/DEV/LAB/PILOT) | Add `STAGING`, `SANDBOX`, `DEMO` if used | `src/data/segments/core/environment.json` |
| `core/location` | 2 (AAD/AZ) | Align to region geography or add `ONPREM`, `HYBRID` | `src/data/segments/core/location.json` |
| `core/role` | 9 (AD/SQL/.../APP) | Add `DC`, `FS`, `WEB`, `API`, `DB` etc. if needed | `src/data/segments/core/role.json` |
| `core/instance` | 10 (001-010) | Extend to `011-100` if you need more instances | `src/data/segments/core/instance.json` |
| `core/department` | 4 (IT/HR/FIN/OPS) | Add `LEGAL`, `MARKETING`, `SALES`, `SECURITY`, `RESEARCH` | `src/data/segments/core/department.json` |
| `core/operating-system` | 7 (W/L/IOS/IPOS/MAC/AND/AllPlatforms) | Add `UBUNTU`, `RHEL` if you distinguish Linux flavors | `src/data/segments/core/operating-system.json` |
| `intune/*` | Assignments, Prefixes, etc. | Add new `ScopeTag` values (HR/IT/FR already) — expand to `FIN`, `LEGAL` | `src/data/segments/intune/*` |
| `azure/*` | `keyvault-workload`, `publicip-workload`, `storageaccount-workload`, `ip` | Add new workload lists for each new Azure resource (e.g., `acr-workload`) | `src/data/segments/azure/*` |
| `defender/*` | 4 files | Add new `def-policytype` values if new Defender policies appear | `src/data/segments/defender/*` |
| `purview/classification` | 5 | Add sub-classifications if taxonomy expands | `src/data/segments/purview/classification.json` |

**Constraint vocabulary (Phase 17):** Any library can now declare `constraints: { allowedPattern, minLength, maxLength }` — validated by `check:data`, inert until wired. Use it to document expected value shape (e.g., Region short codes `^[A-Z0-9]+$`, Country `^[A-Z]{2}$`).

---

## Suggested Next Steps (Step-by-Step)

1. **Review this file** — tick 3–5 rows you want next (e.g., `acr`, `aks`, `cosmos`).
2. For each ticked row, create the JSON file:
   ```json
   {
     "id": "azure-container-registry",
     "category": "Azure",
     "name": "Container Registry",
     "description": "Azure Container Registry naming per CAF: acr-<workload>-<environment>-<instance>. Globally unique, lowercase, no hyphens.",
     "pattern": "acr-[Workload]-[Environment]-[Instance]",
     "fields": [
       { "name": "Workload", "library": "azure/acr-workload", "defaultValue": "APP", "allowCustomValue": true },
       { "name": "Environment", "library": "core/environment", "defaultValue": "PROD", "allowCustomValue": true },
       { "name": "Instance", "library": "core/instance", "defaultValue": "001", "allowCustomValue": true }
     ],
     "examples": ["acr-app-prod-001"],
     "builder": { "separator": "-", "defaultSegments": ["Workload","Environment","Instance"], "availableSegments": ["Custom"], "recommendedSegments": ["Workload"], "lockedSegments": [], "fixedFirstSegments": [], "fixedLastSegments": [] }
   }
   ```
3. If needed, create `src/data/segments/azure/acr-workload.json` with 3–5 workload values.
4. Add locale keys if you use `data.lib.azure/acr-workload.<value>` (or keep description in JSON).
5. Run gates, commit, push.

When you're ready, tell me which 3–5 you ticked and I'll scaffold them via `/gsd-plan-phase`.

---

*Generated from live catalog (45 conventions, 31 segment libraries) — update this file as you add items; keep it in git (not .planning) so you can review on GitHub.*
