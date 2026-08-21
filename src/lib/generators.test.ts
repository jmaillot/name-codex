import { caPolicyIdFallbackRange, caPolicyIdOptionsForRange, caPolicyIdRange, generateCaPolicyIds, generateSequence, personaRangeKeyForField } from './generators'
import { caNumberingRanges } from './data'
import type { BuilderSegment } from "./segments"

function seg(name: string, value: string): BuilderSegment {
  return { key: `${name}-0`, sourceName: name, label: name, value }
}

describe("generateSequence", () => {
  it("generates padded sequence with descriptionPrefix", () => {
    const result = generateSequence({ name: "Seq", type: "sequence", start: 1, end: 3, padding: 2, descriptionPrefix: "Num " })
    expect(result).toEqual([
      { value: "01", description: "Num 01" },
      { value: "02", description: "Num 02" },
      { value: "03", description: "Num 03" },
    ])
  })

  it("padding 0 produces no pad", () => {
    const result = generateSequence({ name: "Seq", type: "sequence", start: 5, end: 7, padding: 0 })
    expect(result.map((r) => r.value)).toEqual(["5", "6", "7"])
  })

  it("without descriptionPrefix description equals value", () => {
    const result = generateSequence({ name: "Seq", type: "sequence", start: 1, end: 2, padding: 2 })
    expect(result[0].description).toBe("01")
  })

  it("start greater than end returns empty", () => {
    const result = generateSequence({ name: "Seq", type: "sequence", start: 10, end: 5, padding: 2 })
    expect(result).toEqual([])
  })

  it("single element range", () => {
    const result = generateSequence({ name: "Seq", type: "sequence", start: 3, end: 3, padding: 3 })
    expect(result).toEqual([{ value: "003", description: "003" }])
  })
})

describe("caPolicyIdFallbackRange", () => {
  it("creates fallback range for EM with digits 3", () => {
    const range = caPolicyIdFallbackRange({ name: "ca-emergency-policy-id", type: "caPolicyId", prefix: "EM", digits: 3 })
    expect(range).toEqual({ label: "ca-emergency-policy-id", prefix: "EM", digits: 3, defaultNumber: "001", min: 0, max: 999 })
  })

  it("defaults digits to 3 and defaultNumber to 001", () => {
    const range = caPolicyIdFallbackRange({ name: "x", type: "caPolicyId", prefix: "X" } as any)
    expect(range?.digits).toBe(3)
    expect(range?.defaultNumber).toBe("001")
    expect(range?.min).toBe(0)
    expect(range?.max).toBe(999)
  })

  it("returns undefined when no prefix", () => {
    expect(caPolicyIdFallbackRange({ name: "PolicyId", type: "caPolicyId" } as any)).toBeUndefined()
  })

  it("respects custom defaultNumber", () => {
    const range = caPolicyIdFallbackRange({ name: "x", type: "caPolicyId", prefix: "EM", digits: 3, defaultNumber: "005" } as any)
    expect(range?.defaultNumber).toBe("005")
  })
})

describe("generateCaPolicyIds", () => {
  it("EM fallback generates 1000 ids EM000 to EM999 with EM000 first", () => {
    const gen = { name: "ca-emergency-policy-id", type: "caPolicyId" as const, prefix: "EM", digits: 3 }
    const ids = generateCaPolicyIds(gen)
    expect(ids.length).toBe(1000)
    expect(ids[0].value).toBe("EM000")
    expect(ids[ids.length - 1].value).toBe("EM999")
    expect(ids.some((o) => o.value === "EM001")).toBe(true)
    expect(ids[0].value).not.toBe("EM001")
  })

  it("DEVSEC fallback generates 1000 ids DEVSEC000 to DEVSEC999", () => {
    const gen = { name: "devsec-policy-id", type: "caPolicyId" as const, prefix: "DEVSEC", digits: 3 }
    const ids = generateCaPolicyIds(gen)
    expect(ids.length).toBe(1000)
    expect(ids[0].value).toBe("DEVSEC000")
    expect(ids[ids.length - 1].value).toBe("DEVSEC999")
  })

  it("with real ca-policy-id generator resolves via caNumberingRanges", () => {
    const gen = { name: "PolicyId", type: "caPolicyId" as const, personaRanges: { ALLUSERS: "Global" } } as any
    const ids = generateCaPolicyIds(gen)
    const expectedCount = Object.values(caNumberingRanges).reduce((sum: number, r: any) => sum + (r.max - r.min + 1), 0)
    expect(ids.length).toBe(expectedCount)
    expect(ids.some((o) => o.value.startsWith("CA0"))).toBe(true)
  })

  it("with explicit ranges generates per range", () => {
    const gen = {
      name: "x",
      type: "caPolicyId" as const,
      ranges: {
        TestA: { label: "TestA", prefix: "TA", digits: 2, min: 1, max: 3 },
        TestB: { label: "TestB", prefix: "TB", digits: 2, min: 0, max: 1 },
      },
    }
    const ids = generateCaPolicyIds(gen)
    expect(ids.map((o) => o.value)).toEqual(["TA01", "TA02", "TA03", "TB00", "TB01"])
  })

  it("prefix missing without ranges returns caNumberingRanges", () => {
    const gen = { name: "PolicyId", type: "caPolicyId" as const } as any
    const ids = generateCaPolicyIds(gen)
    expect(ids.length).toBeGreaterThan(0)
    expect(ids[0].value.startsWith("CA")).toBe(true)
  })
})

describe("caPolicyIdRange", () => {
  it("returns range for known key", () => {
    const gen = { name: "PolicyId", type: "caPolicyId" as const, ranges: { Global: { label: "Global", prefix: "CA0", digits: 2, min: 1, max: 99 } } } as any
    expect(caPolicyIdRange(gen, "Global")?.prefix).toBe("CA0")
  })

  it("falls back to caNumberingRanges when generator has no ranges", () => {
    const gen = { name: "PolicyId", type: "caPolicyId" as const } as any
    expect(caPolicyIdRange(gen, "Global")?.prefix).toBe("CA0")
  })

  it("returns undefined for unknown key", () => {
    const gen = { name: "PolicyId", type: "caPolicyId" as const } as any
    expect(caPolicyIdRange(gen, "NonExistent")).toBeUndefined()
  })
})

describe("caPolicyIdOptionsForRange", () => {
  it("returns padded values for known range", () => {
    const gen = { name: "PolicyId", type: "caPolicyId" as const, ranges: { Global: { label: "Global", prefix: "CA0", digits: 2, min: 1, max: 3 } } } as any
    const opts = caPolicyIdOptionsForRange(gen, "Global")
    expect(opts.map((o) => o.value)).toEqual(["CA001", "CA002", "CA003"])
  })

  it("returns empty for unknown key", () => {
    const gen = { name: "PolicyId", type: "caPolicyId" as const } as any
    expect(caPolicyIdOptionsForRange(gen, "Unknown")).toEqual([])
  })

  it("uses caNumberingRanges fallback", () => {
    const gen = { name: "PolicyId", type: "caPolicyId" as const } as any
    const opts = caPolicyIdOptionsForRange(gen, "Internals")
    expect(opts.length).toBe(100)
    expect(opts[0].value).toBe("CA200")
  })
})

describe("personaRangeKeyForField", () => {
  it("returns Internals for Employees persona with ca-policy-id generator", () => {
    const field = { name: "PolicyId", generator: "ca-policy-id" } as any
    const segments = [seg("CA-Persona", "Employees")]
    expect(personaRangeKeyForField(field, segments)).toBe("Internals")
  })

  it("case-insensitive matching", () => {
    const field = { name: "PolicyId", generator: "ca-policy-id" } as any
    expect(personaRangeKeyForField(field, [seg("CA-Persona", "employees")])).toBe("Internals")
    expect(personaRangeKeyForField(field, [seg("CA-Persona", "EMPLOYEES")])).toBe("Internals")
    expect(personaRangeKeyForField(field, [seg("CA-Persona", "  Employees  ")])).toBe("Internals")
  })

  it("returns undefined when persona missing", () => {
    const field = { name: "PolicyId", generator: "ca-policy-id" } as any
    expect(personaRangeKeyForField(field, [])).toBeUndefined()
    expect(personaRangeKeyForField(field, [seg("Other", "Employees")])).toBeUndefined()
  })

  it("returns undefined for non-caPolicyId generator", () => {
    const field = { name: "Other", generator: "ca-emergency-policy-id" } as any
    expect(personaRangeKeyForField(field, [seg("CA-Persona", "Employees")])).toBeUndefined()
  })

  it("returns undefined when field has no generator", () => {
    expect(personaRangeKeyForField(undefined, [seg("CA-Persona", "Employees")])).toBeUndefined()
    expect(personaRangeKeyForField({ name: "PolicyId" } as any, [seg("CA-Persona", "Employees")])).toBeUndefined()
  })

  it("returns Global for AllUsers persona", () => {
    const field = { name: "PolicyId", generator: "ca-policy-id" } as any
    expect(personaRangeKeyForField(field, [seg("CA-Persona", "AllUsers")])).toBe("Global")
  })
})
