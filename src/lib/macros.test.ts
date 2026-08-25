import { describe, it, expect } from "vitest"
import { expandedLength, randWidth } from "./macros"
import { optionsForSegment } from "./segments"
import { validateName } from "./validation"
import type { BuilderSegment } from "./segments"
import type { NamingConvention, NamingField } from "../types/Rule"

function seg(name: string, value: string): BuilderSegment {
  return { key: `${name}-0`, sourceName: name, label: name, value }
}

function macroOptions(): NamingField["values"] {
  return [
    "%SERIAL%",
    ...Array.from({ length: 15 }, (_, i) => `%RAND:${i + 1}%`),
  ]
}

describe("expandedLength", () => {
  it("counts prefix + RAND expansion (DT-%RAND:4% = 6)", () => {
    expect(expandedLength("DT-%RAND:4%")).toBe(7)
  })

  it("returns null for non-RAND macro (%SERIAL%)", () => {
    expect(expandedLength("%SERIAL%")).toBeNull()
  })

  it("counts DT- + 12 randoms as exactly 15", () => {
    expect(expandedLength("DT-%RAND:12%")).toBe(15)
  })

  it("counts plain text as typed length", () => {
    expect(expandedLength("ABC")).toBe(3)
  })

  it("sums multiple RAND macros", () => {
    expect(expandedLength("%RAND:2%%RAND:3%")).toBe(5)
  })
})

describe("randWidth", () => {
  it("extracts width from %RAND:12%", () => {
    expect(randWidth("%RAND:12%")).toBe(12)
  })

  it("returns null for %SERIAL%", () => {
    expect(randWidth("%SERIAL%")).toBeNull()
  })

  it("returns null for plain text", () => {
    expect(randWidth("DT")).toBeNull()
  })
})

describe("optionsForSegment maxLengthBudget filtering", () => {
  const convention: NamingConvention = {
    id: "test",
    category: "Test",
    name: "Test",
    description: "",
    pattern: "[Prefix][Macro]",
    fields: [],
    validation: { maxLength: 15 },
  }

  function macroField(): NamingField {
    return {
      name: "Macro",
      values: macroOptions(),
      maxLengthBudget: { dependsOn: "Prefix" },
    }
  }

  it("keeps %RAND:12%, drops 13-15 and keeps %SERIAL% when Prefix is DT-", () => {
    const options = optionsForSegment(
      macroField(),
      [seg("Prefix", "DT-"), seg("Macro", "")],
      convention
    )
    const vals = options.map((o) => (typeof o === "string" ? o : o.value))
    expect(vals).toContain("%RAND:12%")
    expect(vals).not.toContain("%RAND:13%")
    expect(vals).not.toContain("%RAND:14%")
    expect(vals).not.toContain("%RAND:15%")
    expect(vals).toContain("%SERIAL%")
  })

  it("keeps all RAND widths when Prefix is empty", () => {
    const options = optionsForSegment(
      macroField(),
      [seg("Prefix", ""), seg("Macro", "")],
      convention
    )
    const vals = options.map((o) => (typeof o === "string" ? o : o.value))
    for (let i = 1; i <= 15; i++) {
      expect(vals).toContain(`%RAND:${i}%`)
    }
  })

  it("leaves options unchanged when field has no maxLengthBudget", () => {
    const field: NamingField = { name: "Macro", values: macroOptions() }
    const options = optionsForSegment(
      field,
      [seg("Prefix", "DT-"), seg("Macro", "")],
      convention
    )
    expect(options.length).toBe(16)
  })
})

describe("validateName expansion-aware macro length row", () => {
  const autopilotConvention: NamingConvention = {
    id: "intune-autopilot-device-name",
    category: "Intune",
    name: "Autopilot Device Name",
    description: "",
    pattern: "[Prefix][Macro]",
    fields: [],
    validation: { maxLength: 15, allowedPattern: "^[A-Za-z0-9%:-]+$" },
  }

  it("flags over-budget expansion even though typed length fits", () => {
    const segments = [seg("Prefix", "DT-"), seg("Macro", "%RAND:13%")]
    const results = validateName("DT-%RAND:13%", autopilotConvention, segments)
    const macroRow = results.find((r) => r.label.includes("expand") || r.label.includes("Expanded"))
    expect(macroRow).toBeDefined()
    expect(macroRow!.valid).toBe(false)
  })

  it("marks the expansion row valid when the expansion fits", () => {
    const segments = [seg("Prefix", "DT-"), seg("Macro", "%RAND:12%")]
    const results = validateName("DT-%RAND:12%", autopilotConvention, segments)
    const macroRow = results.find((r) => r.label.includes("expand") || r.label.includes("Expanded"))
    expect(macroRow).toBeDefined()
    expect(macroRow!.valid).toBe(true)
  })

  it("adds no extra row when the name has no RAND macro", () => {
    const segments = [seg("Prefix", "DT-"), seg("Macro", "%SERIAL%")]
    const withSerial = validateName("DT-%SERIAL%", autopilotConvention, segments)
    expect(withSerial.some((r) => r.label.includes("expand") || r.label.includes("Expanded"))).toBe(false)

    const plain: NamingConvention = {
      id: "plain",
      category: "Intune",
      name: "Plain",
      description: "",
      pattern: "[Prefix]",
      fields: [],
      validation: { maxLength: 15 },
    }
    const plainResults = validateName("ABCDEF", plain, [seg("Prefix", "ABCDEF")])
    expect(plainResults.some((r) => r.label.includes("expand") || r.label.includes("Expanded"))).toBe(false)
  })
})
