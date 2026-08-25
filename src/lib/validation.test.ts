import { governanceScore, isFixedFirst, isFixedLast, isLocked, isRecommended, normalizeName, validateName } from './validation'
import { makeConvention } from "../test/fixtures/synthetic-conventions"
import type { BuilderSegment } from "./segments"

function seg(name: string, value: string): BuilderSegment {
  return { key: `${name}-0`, sourceName: name, label: name, value }
}

describe("normalizeName", () => {
  it("returns identity when no transformations apply", () => {
    const conv = makeConvention({ validation: { maxLength: 100, allowedPattern: "^[A-Za-z0-9-]+$" } })
    expect(normalizeName("Hello-123", conv)).toBe("Hello-123")
  })

  it("forceLowercase converts to lower", () => {
    const conv = makeConvention({ validation: { forceLowercase: true } as any })
    expect(normalizeName("Hello-World", conv)).toBe("hello-world")
  })

  it("removeCharacters strips specified chars", () => {
    const conv = makeConvention({ validation: { removeCharacters: ["-", "."] } as any })
    expect(normalizeName("a-b.c-d", conv)).toBe("abcd")
  })

  it("maxLength truncates", () => {
    const conv = makeConvention({ validation: { maxLength: 5 } as any })
    expect(normalizeName("abcdefgh", conv)).toBe("abcde")
  })

  it("chains lowercase then remove then truncate", () => {
    const conv = makeConvention({
      validation: { forceLowercase: true, removeCharacters: ["-"], maxLength: 5 } as any,
    })
    expect(normalizeName("AB-CDEFGH", conv)).toBe("abcde")
  })

  it("uses convention validation fallback when category rule missing", () => {
    const conv = makeConvention({ category: "unknownCat", name: "UnknownRule", validation: { maxLength: 3 } as any })
    expect(normalizeName("abcdef", conv)).toBe("abc")
  })

  it("falls back to validationRules.default when convention has no validation", () => {
    const conv = {
      id: "no-val",
      category: "UnknownCategoryThatDoesNotExist123",
      name: "UnknownNameThatDoesNotExist123",
      description: "x",
      pattern: "[A]",
      fields: [],
      builder: { defaultSegments: [] },
    } as any
    expect(normalizeName("hello", conv)).toBe("hello")
    expect(normalizeName("a".repeat(200), conv).length).toBe(128)
  })
})

describe("validateName", () => {
  it("empty name fails not-empty check", () => {
    const conv = makeConvention()
    const results = validateName("", conv, [seg("A", "x"), seg("B", "1")])
    expect(results[0].valid).toBe(false)
  })

  it("non-empty name passes not-empty check", () => {
    const conv = makeConvention()
    const results = validateName("x-1", conv, [seg("A", "x"), seg("B", "1")])
    expect(results[0].valid).toBe(true)
  })

  it("all segments filled passes", () => {
    const conv = makeConvention()
    const results = validateName("x-1", conv, [seg("A", "x"), seg("B", "1")])
    expect(results[1].valid).toBe(true)
  })

  it("one empty segment fails filled check", () => {
    const conv = makeConvention()
    const results = validateName("x-", conv, [seg("A", "x"), seg("B", "")])
    expect(results[1].valid).toBe(false)
  })

  it("whitespace-only segment fails filled check", () => {
    const conv = makeConvention()
    const results = validateName("x- ", conv, [seg("A", "x"), seg("B", "   ")])
    expect(results[1].valid).toBe(false)
  })

  it("length within maxLength passes", () => {
    const conv = makeConvention({ validation: { maxLength: 5 } as any })
    expect(validateName("abc", conv, [seg("A", "abc")])[2].valid).toBe(true)
  })

  it("length exceeding maxLength fails", () => {
    const conv = makeConvention({ validation: { maxLength: 5 } as any })
    expect(validateName("abcdef", conv, [seg("A", "abcdef")])[2].valid).toBe(false)
  })

  it("allowedPattern respected violation fails", () => {
    const conv = makeConvention({ validation: { allowedPattern: "^[A-Z]+$", maxLength: 20 } as any })
    expect(validateName("abc", conv, [seg("A", "abc")])[3].valid).toBe(false)
    expect(validateName("ABC", conv, [seg("A", "ABC")])[3].valid).toBe(true)
  })

  it("empty name bypasses allowedPattern", () => {
    const conv = makeConvention({ validation: { allowedPattern: "^[A-Z]+$", maxLength: 20 } as any })
    expect(validateName("", conv, [seg("A", "")])[3].valid).toBe(true)
  })

  it("lockedSegments present adds passing result", () => {
    const conv = makeConvention({ builder: { lockedSegments: ["Must"] } as any })
    const results = validateName("x", conv, [seg("Must", "v"), seg("A", "x")])
    expect(results.some((r) => r.label.includes("Must") && r.valid)).toBe(true)
  })

  it("lockedSegments absent adds failing result", () => {
    const conv = makeConvention({ builder: { lockedSegments: ["Must"] } as any })
    const results = validateName("x", conv, [seg("A", "x")])
    expect(results.some((r) => r.label.includes("Must") && !r.valid)).toBe(true)
  })

  it("recommendedSegments present and absent", () => {
    const conv = makeConvention({ builder: { recommendedSegments: ["Rec"] } as any })
    const pass = validateName("x", conv, [seg("Rec", "v")])
    const fail = validateName("x", conv, [seg("A", "x")])
    expect(pass.some((r) => r.label.includes("Rec") && r.valid)).toBe(true)
    expect(fail.some((r) => r.label.includes("Rec") && !r.valid)).toBe(true)
  })

  it("no locked or recommended produces base 4 results only", () => {
    const conv = makeConvention({ builder: { lockedSegments: [], recommendedSegments: [] } as any })
    const results = validateName("x-1", conv, [seg("A", "x"), seg("B", "1")])
    expect(results.length).toBe(4)
  })

  it("per-field allowedPattern: value with space fails the field row", () => {
    const conv = makeConvention({
      fields: [
        { name: "A", type: "text", allowedPattern: "^[^ ]+$" },
        { name: "B", values: ["1", "2"] },
      ],
    })
    const results = validateName("x y-1", conv, [seg("A", "x y"), seg("B", "1")])
    expect(results.length).toBe(5)
    const fieldRow = results.find((r) => r.label.includes("Segment A"))
    expect(fieldRow).toBeDefined()
    expect(fieldRow!.valid).toBe(false)
  })

  it("per-field allowedPattern: value without space passes the field row", () => {
    const conv = makeConvention({
      fields: [
        { name: "A", type: "text", allowedPattern: "^[^ ]+$" },
        { name: "B", values: ["1", "2"] },
      ],
    })
    const results = validateName("xy-1", conv, [seg("A", "xy"), seg("B", "1")])
    const fieldRow = results.find((r) => r.label.includes("Segment A"))
    expect(fieldRow).toBeDefined()
    expect(fieldRow!.valid).toBe(true)
  })

  it("per-field allowedPattern: empty segment value bypasses the field row", () => {
    const conv = makeConvention({
      fields: [{ name: "A", type: "text", allowedPattern: "^[^ ]+$" }],
    })
    const results = validateName("", conv, [seg("A", "")])
    const fieldRow = results.find((r) => r.label.includes("Segment A"))
    expect(fieldRow).toBeDefined()
    expect(fieldRow!.valid).toBe(true)
  })

  it("per-field allowedPattern: other rows unaffected (base rows at indices 0-3)", () => {
    const convWithPattern = makeConvention({
      fields: [{ name: "A", type: "text", allowedPattern: "^[^ ]+$" }],
    })
    const convWithout = makeConvention()
    const withResults = validateName("x-1", convWithPattern, [seg("A", "x"), seg("B", "1")])
    const withoutResults = validateName("x-1", convWithout, [seg("A", "x"), seg("B", "1")])
    expect(withResults.length).toBe(withoutResults.length + 1)
    expect(withResults.slice(0, 4)).toEqual(withoutResults)
  })

  it("convention without field patterns produces identical results to before (no extra rows)", () => {
    const conv = makeConvention()
    const results = validateName("x-1", conv, [seg("A", "x y"), seg("B", "1")])
    expect(results.length).toBe(4)
  })

  it("segment whose sourceName matches no field adds no field-pattern row", () => {
    const conv = makeConvention({
      fields: [{ name: "A", type: "text", allowedPattern: "^[^ ]+$" }],
    })
    const results = validateName("z-1", conv, [seg("Zed", "z"), seg("B", "1")])
    expect(results.length).toBe(4)
  })
})

describe("governanceScore", () => {
  it("empty results returns 0", () => {
    expect(governanceScore([])).toBe(0)
  })

  it("all valid returns 100", () => {
    expect(governanceScore([{ label: "a", valid: true }, { label: "b", valid: true }])).toBe(100)
  })

  it("one of two returns 50", () => {
    expect(governanceScore([{ label: "a", valid: true }, { label: "b", valid: false }])).toBe(50)
  })

  it("two of three returns 67", () => {
    expect(governanceScore([{ label: "a", valid: true }, { label: "b", valid: true }, { label: "c", valid: false }])).toBe(67)
  })

  it("single valid result returns 100", () => {
    expect(governanceScore([{ label: "a", valid: true }])).toBe(100)
  })

  it("single invalid result returns 0", () => {
    expect(governanceScore([{ label: "a", valid: false }])).toBe(0)
  })

  it("empty name scenario validates ratio correctly", () => {
    const conv = makeConvention()
    const results = validateName("", conv, [seg("A", ""), seg("B", "")])
    const score = governanceScore(results)
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThan(100)
  })
})

describe("isLocked helpers", () => {
  it("isLocked true when present", () => {
    const conv = makeConvention({ builder: { lockedSegments: ["A"] } as any })
    expect(isLocked(conv, "A")).toBe(true)
    expect(isLocked(conv, "B")).toBe(false)
  })

  it("isRecommended true when present", () => {
    const conv = makeConvention({ builder: { recommendedSegments: ["R"] } as any })
    expect(isRecommended(conv, "R")).toBe(true)
    expect(isRecommended(conv, "X")).toBe(false)
  })

  it("isFixedFirst true when present", () => {
    const conv = makeConvention({ builder: { fixedFirstSegments: ["F"] } as any })
    expect(isFixedFirst(conv, "F")).toBe(true)
    expect(isFixedFirst(conv, "G")).toBe(false)
  })

  it("isFixedLast true when present", () => {
    const conv = makeConvention({ builder: { fixedLastSegments: ["L"] } as any })
    expect(isFixedLast(conv, "L")).toBe(true)
    expect(isFixedLast(conv, "M")).toBe(false)
  })

  it("helpers return false when builder missing", () => {
    const conv = { id: "x", category: "t", name: "t", description: "", pattern: "[A]", fields: [] } as any
    expect(isLocked(conv, "A")).toBe(false)
    expect(isRecommended(conv, "A")).toBe(false)
    expect(isFixedFirst(conv, "A")).toBe(false)
    expect(isFixedLast(conv, "A")).toBe(false)
  })
})
