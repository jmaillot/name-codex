import { getValidationHint, type ValidationResult } from './validation'
import { makeConvention } from "../test/fixtures/synthetic-conventions"
import type { BuilderSegment } from "./segments"

function result(label: string): ValidationResult {
  return { label, valid: false }
}

function seg(name: string, value: string): BuilderSegment {
  return { key: `${name}-0`, sourceName: name, label: name, value }
}

describe("getValidationHint", () => {
  it("returns null for passing results", () => {
    expect(getValidationHint({ label: "Generated name is not empty", valid: true })).toBeNull()
  })

  it("hints at adding segments for an empty name", () => {
    expect(getValidationHint(result("Generated name is not empty"))).toBe("Add segments to generate a name")
  })

  it("names the first empty segment when segments are unfilled", () => {
    const segments = [seg("Env", ""), seg("App", "api")]
    expect(getValidationHint(result("All segments are filled"), { segments })).toBe("Add Env")
  })

  it("falls back to a generic fill hint when nothing is empty", () => {
    const segments = [seg("Env", "prod")]
    expect(getValidationHint(result("All segments are filled"), { segments })).toBe("Fill all empty segments")
  })

  it("reports the convention max length for length failures", () => {
    const convention = makeConvention({ validation: { maxLength: 20 } as any })
    expect(getValidationHint(result("Length is 20 characters or less"), { convention })).toBe(
      "Shorten name — exceeds 20 characters"
    )
  })

  it("hints at reducing macro width for expanded-macro failures", () => {
    expect(getValidationHint(result("Expanded macros fit within 20 characters"))).toBe(
      "Reduce macro width — expanded length exceeds limit"
    )
  })

  it("detects double hyphens in allowed-character failures", () => {
    expect(
      getValidationHint(result("Allowed characters are respected"), { generatedName: "a--b" })
    ).toBe("Fix double hyphen — remove consecutive hyphens")
  })

  it("falls back to a generic character hint otherwise", () => {
    expect(
      getValidationHint(result("Allowed characters are respected"), { generatedName: "a b" })
    ).toBe("Remove invalid characters")
  })

  it("names the segment for field pattern failures", () => {
    expect(getValidationHint(result("Segment Env respects its allowed characters"))).toBe(
      "Fix Env — matches required pattern"
    )
    expect(getValidationHint(result("Segment Env matches required pattern"))).toBe(
      "Fix Env — matches required pattern"
    )
  })

  it("hints at min and max constraint lengths", () => {
    expect(getValidationHint(result("Segment Env is at least 3 characters"))).toBe(
      "Add characters to Env — too short"
    )
    expect(getValidationHint(result("Segment Env is at most 10 characters"))).toBe(
      "Shorten Env — too long"
    )
  })

  it("names locked and recommended segments", () => {
    expect(getValidationHint(result("Locked segment present: Env"))).toBe("Add locked segment: Env")
    expect(getValidationHint(result("Recommended segment present: App"))).toBe("Add recommended segment: App")
  })

  it("falls back to a generic hint for unknown failures", () => {
    expect(getValidationHint(result("Something entirely unexpected"))).toBe("Fix this rule to improve score")
  })
})
