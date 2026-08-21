import { allConventions, caNumberingRanges, getGeneratorFile, getSegmentFile, segmentCatalog } from "./data"
import { parsePattern } from "./parse"
import { fieldByName } from "./segments"

describe("data integrity", () => {
  it("allConventions is non-empty", () => {
    expect(allConventions.length).toBeGreaterThan(0)
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
    for (const conv of allConventions) {
      const allPatternFields = [...(conv.fields ?? []), ...(conv.patterns?.flatMap((p) => p.fields ?? []) ?? [])]
      const patterns = [conv.pattern, ...(conv.patterns?.map((p) => p.pattern) ?? [])].filter(Boolean) as string[]
      for (const pattern of patterns) {
        const tokens = parsePattern(pattern)
        for (const token of tokens) {
          if (token.type !== "segment") continue
          const fields = [...allPatternFields, ...segmentCatalog]
          const resolved = fieldByName(fields, token.value)
          const fallbackOk = token.value === "PolicyId" || token.value.startsWith("CA-") || token.value.includes("Policy")
          if (!resolved && !fallbackOk) {
            const catalogNames = segmentCatalog.map((f) => f.name)
            const allNames = [...catalogNames, ...allPatternFields.map((f) => f.name)]
            expect(allNames.includes(token.value) || fallbackOk, `${conv.id} pattern token ${token.value} should map to known segment`).toBe(true)
          }
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
})
