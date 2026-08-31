import { allConventions, caNumberingRanges, getGeneratorFile, getSegmentFile, segmentCatalog } from './data'
import { parsePattern } from './parse'
import { fieldByName } from "./segments"
import { validateName } from './validation'
import type { BuilderSegment } from './segments'
import en from "../locales/en.json"
import fr from "../locales/fr.json"

describe("data integrity", () => {
  it("allConventions is non-empty", () => {
    expect(allConventions.length).toBeGreaterThan(0)
  })

  it("azure-storage-account rejects names shorter than the Azure 3-character minimum (WR-02)", () => {
    const conv = allConventions.find((c) => c.id === "azure-storage-account")
    expect(conv, "azure-storage-account convention exists").toBeDefined()
    const seg = (name: string, value: string): BuilderSegment =>
      ({ key: `${name}-0`, sourceName: name, label: name, value })
    // "st" is only 2 characters — Azure requires 3–24, so the allowed-pattern row must fail
    const rows = validateName("st", conv!, [seg("Workload", "app")])
    expect(rows.length).toBe(5) // empty / filled / length / allowed / recommended-present
    expect(rows[3].label).toContain("Allowed characters")
    expect(rows[3].valid, `"st" (2 chars) must fail the allowedPattern row`).toBe(false)
  })

  it("azure-storage-account still accepts a compliant name like stappprod001 (WR-02 regression guard)", () => {
    const conv = allConventions.find((c) => c.id === "azure-storage-account")
    expect(conv).toBeDefined()
    const seg = (name: string, value: string): BuilderSegment =>
      ({ key: `${name}-0`, sourceName: name, label: name, value })
    const rows = validateName(
      "stappprod001",
      conv!,
      [seg("Workload", "app"), seg("Environment", "prod"), seg("Instance", "001")],
    )
    for (const row of rows) expect(row.valid, `${row.label} should pass`).toBe(true)
  })

  it("intune-autopilot-device-name description matches shipped behavior — flags %RAND:n% over-budget expansion (WR-03)", () => {
    const conv = allConventions.find((c) => c.id === "intune-autopilot-device-name")
    expect(conv, "intune-autopilot-device-name convention exists").toBeDefined()
    expect(conv!.description).toContain(
      "flags templates whose %RAND:n% expansion would exceed the 15-character limit",
    )
    expect(conv!.description).not.toContain("typed length only")
  })

  it("every field library resolves to a real segment file with values", () => {
    for (const conv of allConventions) {
      const fields = [...(conv.fields ?? []), ...(conv.patterns?.flatMap((p) => p.fields ?? []) ?? [])]
      for (const field of fields) {
        if (!field.library) continue
        const file = getSegmentFile(field.library)
        expect(file, `${conv.id} library ${field.library} should resolve`).toBeDefined()
        const values = file?.values ?? []
        expect(values.length, `${conv.id} library ${field.library} should have values`).toBeGreaterThan(0)
      }
    }
  })

  it("every field generator resolves to a real generator file", () => {
    for (const conv of allConventions) {
      const fields = [...(conv.fields ?? []), ...(conv.patterns?.flatMap((p) => p.fields ?? []) ?? [])]
      for (const field of fields) {
        if (!field.generator) continue
        const file = getGeneratorFile(field.generator)
        expect(file, `${conv.id} generator ${field.generator} should resolve`).toBeDefined()
      }
    }
  })

  it("every pattern token maps to a known segment", () => {
    // WR-05: explicit, frozen exemptions only — generator-only tokens and
    // documented CA generator prefixes. No substring escape hatch (e.g. any
    // token containing "Policy"), so a typo like "GroupPolicyNmae" fails loudly.
    const EXEMPT_TOKENS = new Set(["PolicyId"])
    const EXEMPT_PREFIXES = ["CA-"]
    for (const conv of allConventions) {
      const allPatternFields = [...(conv.fields ?? []), ...(conv.patterns?.flatMap((p) => p.fields ?? []) ?? [])]
      const patterns = [conv.pattern, ...(conv.patterns?.map((p) => p.pattern) ?? [])].filter(Boolean) as string[]
      for (const pattern of patterns) {
        const tokens = parsePattern(pattern)
        for (const token of tokens) {
          if (token.type !== "segment") continue
          const resolved = fieldByName([...allPatternFields, ...segmentCatalog], token.value)
          const exempt =
            EXEMPT_TOKENS.has(token.value) ||
            EXEMPT_PREFIXES.some((prefix) => token.value.startsWith(prefix))
          expect(
            resolved !== undefined || exempt,
            `${conv.id} pattern token ${token.value} should map to known segment`,
          ).toBe(true)
        }
      }
    }
  })

  it("every personaRanges value exists as key in caNumberingRanges", () => {
    const generator = getGeneratorFile("ca-policy-id") as any
    expect(generator).toBeDefined()
    const personaRanges = generator?.personaRanges as Record<string, string> | undefined
    expect(personaRanges).toBeDefined()
    for (const [personaKey, rangeKey] of Object.entries(personaRanges!)) {
      expect(caNumberingRanges[rangeKey], `persona ${personaKey} maps to range ${rangeKey} which must exist in caNumberingRanges`).toBeDefined()
    }
  })

  it("caNumberingRanges has expected keys", () => {
    expect(Object.keys(caNumberingRanges)).toContain("Global")
    expect(Object.keys(caNumberingRanges)).toContain("Internals")
    expect(Object.keys(caNumberingRanges)).toContain("Admins")
  })

  it("every convention has required shape", () => {
    for (const conv of allConventions) {
      expect(conv.category, `${conv.id} should have category`).toBeTruthy()
      expect(conv.id, `${conv.id} should have id`).toBeTruthy()
      expect(conv.name, `${conv.id} should have name`).toBeTruthy()
      const hasPattern = Boolean(conv.pattern) || Boolean(conv.patterns?.length)
      expect(hasPattern, `${conv.id} should have pattern or patterns`).toBe(true)
    }
  })

  it("segmentCatalog entries have name and library resolution works case-insensitive", () => {
    expect(segmentCatalog.length).toBeGreaterThan(0)
    const file = getSegmentFile("CORE/REGION")
    expect(file).toBeDefined()
    const file2 = getSegmentFile("core/region")
    expect(file2).toBeDefined()
  })

  it("getGeneratorFile is case-insensitive", () => {
    expect(getGeneratorFile("CA-POLICY-ID")).toBeDefined()
    expect(getGeneratorFile("ca-policy-id")).toBeDefined()
    expect(getGeneratorFile("CA-EMERGENCY-POLICY-ID")).toBeDefined()
  })

  it("getSegmentFile returns undefined for unknown library", () => {
    expect(getSegmentFile("nonexistent/fake-library-xyz")).toBeUndefined()
  })

  it("getGeneratorFile returns undefined for unknown generator", () => {
    expect(getGeneratorFile("nonexistent-generator-xyz")).toBeUndefined()
  })

  it("catalog contains exactly 50 conventions (25 existing + 19 new + 6 CAF)", () => {
    expect(allConventions.length).toBe(50)
  })

  it("catalog spans exactly 11 categories with expected counts", () => {
    const counts: Record<string, number> = {}
    for (const conv of allConventions) counts[conv.category] = (counts[conv.category] ?? 0) + 1
    expect(counts).toEqual({
      "Azure": 18,
      "Conditional Access": 2,
      "Defender for M365": 3,
      "Entra ID": 1,
      "Exchange": 2,
      "Groups": 5,
      "Intune": 10,
      "Power Platform": 1,
      "Purview": 4,
      "SharePoint": 3,
      "Teams": 1,
    })
  })

  const NEW_CONVENTION_IDS = [
    "teams-team",
    "m365-group-naming-policy", "spo-team-site", "spo-communication-site", "spo-hub-site",
    "pp-environment", "purview-sensitivity-label", "purview-retention-label",
    "purview-retention-policy", "purview-dlp-policy",
    "azure-storage-account", "azure-key-vault", "azure-network-security-group", "azure-public-ip",
    "intune-autopilot-device-name", "intune-group-tag", "intune-update-policy", "intune-autopilot-profile",
    "intune-scope-tag",
    "azure-container-registry", "azure-kubernetes-service", "azure-cosmos-db",
    "azure-service-bus", "azure-function-app", "azure-app-service",
  ]

  it("every new convention is reachable via global-search (name/description/id/pattern match)", () => {
    expect(NEW_CONVENTION_IDS.length).toBe(25)
    // WR-04: mirror the exact predicate used by filteredConventions in
    // useAppState (name/description/id/pattern) and query with a PARTIAL
    // id fragment, so the test exercises real substring matching instead
    // of the tautological c.id.includes(c.id).
    const matchesSearch = (
      c: { name: string; description: string; id: string; pattern?: string },
      query: string,
    ): boolean =>
      c.name.toLowerCase().includes(query) ||
      c.description.toLowerCase().includes(query) ||
      c.id.toLowerCase().includes(query) ||
      (c.pattern ?? "").toLowerCase().includes(query)
    for (const id of NEW_CONVENTION_IDS) {
      const conv = allConventions.find((c) => c.id === id)
      expect(conv, `${id} should exist`).toBeDefined()
      const fragment = id.toLowerCase().replace(/^[a-z]+-/, "")
      expect(fragment.length, `${id} should yield a non-empty search fragment`).toBeGreaterThan(0)
      expect(
        matchesSearch(conv!, fragment),
        `${id} should be reachable by searching its partial id "${fragment}"`,
      ).toBe(true)
    }
  })

  function flattenKeys(obj: Record<string, unknown>, prefix = ""): string[] {
    return Object.entries(obj).flatMap(([k, v]) => {
      const key = prefix ? `${prefix}.${k}` : k
      return v !== null && typeof v === "object" ? flattenKeys(v as Record<string, unknown>, key) : [key]
    })
  }

  it("en.json and fr.json have identical flat key sets (both directions)", () => {
    const enKeys = flattenKeys(en).sort()
    const frKeys = flattenKeys(fr).sort()
    expect(enKeys).toEqual(frKeys)
  })
})
