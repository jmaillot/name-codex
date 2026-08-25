import { describe, it, expect } from "vitest"
import { allConventions } from "./data"
import { buildSegments, fieldByName, optionsForSegment } from "./segments"

/**
 * Integration regression tests for the Autopilot budget-aware macro behavior
 * (14-04 UAT gap closure). Unlike macros.test.ts these use the REAL rule JSON
 * and REAL segment library end-to-end — they guard the wiring between
 * intune-autopilot-device-name.json and segments.ts against regressions.
 */
describe("Autopilot rule JSON → segment pipeline (real data)", () => {
  const convention = allConventions.find((c) => c.id === "intune-autopilot-device-name")!
  const prefixRandom = convention.patterns!.find((p) => p.id === "prefix-random")!
  const fields = convention.fields ?? []

  it("prefix-random pattern carries fixedValues Macro=%RAND:12%", () => {
    expect(prefixRandom.fixedValues?.Macro).toBe("%RAND:12%")
  })

  it("Macro field carries maxLengthBudget { dependsOn: Prefix } through fieldByName", () => {
    const macro = fieldByName(fields, "Macro")
    expect(macro?.maxLengthBudget?.dependsOn).toBe("Prefix")
    expect(macro?.library).toBe("intune/autopilot-macros")
  })

  it("buildSegments with prefix-random fixedValues defaults Macro to %RAND:12%, not %SERIAL%", () => {
    const segments = buildSegments(convention, {
      defaultSegments: prefixRandom.defaultSegments,
      fixedValues: prefixRandom.fixedValues,
      fields,
    })
    expect(segments.map((s) => s.sourceName)).toEqual(["Prefix", "Macro"])
    expect(segments.find((s) => s.sourceName === "Prefix")!.value).toBe("DT-")
    expect(segments.find((s) => s.sourceName === "Macro")!.value).toBe("%RAND:12%")
  })

  it("buildSegments without fixedValues (prefix-serial) still defaults Macro to %SERIAL%", () => {
    const prefixSerial = convention.patterns!.find((p) => p.id === "prefix-serial")!
    const segments = buildSegments(convention, {
      defaultSegments: prefixSerial.defaultSegments,
      fixedValues: {},
      fields,
    })
    expect(segments.find((s) => s.sourceName === "Macro")!.value).toBe("%SERIAL%")
  })

  it("optionsForSegment filters RAND widths to the Prefix budget using the real library", () => {
    const macro = fieldByName(fields, "Macro")
    const segments = buildSegments(convention, {
      defaultSegments: ["Prefix", "Macro"],
      fixedValues: {},
      fields,
    }).map((s) => (s.sourceName === "Prefix" ? { ...s, value: "DT-" } : { ...s, value: "" }))

    const vals = optionsForSegment(macro, segments, convention).map((o) =>
      typeof o === "string" ? o : o.value
    )
    expect(vals).toHaveLength(13) // %SERIAL% + %RAND:1..12%
    expect(vals).toContain("%RAND:12%")
    expect(vals).toContain("%SERIAL%")
    expect(vals).not.toContain("%RAND:13%")
    expect(vals).not.toContain("%RAND:15%")
  })

  it("optionsForSegment keeps all RAND widths when Prefix is empty (real library)", () => {
    const macro = fieldByName(fields, "Macro")
    const segments = buildSegments(convention, {
      defaultSegments: ["Prefix", "Macro"],
      fixedValues: {},
      fields,
    }).map((s) => ({ ...s, value: "" }))

    const vals = optionsForSegment(macro, segments, convention).map((o) =>
      typeof o === "string" ? o : o.value
    )
    for (let i = 1; i <= 15; i++) {
      expect(vals).toContain(`%RAND:${i}%`)
    }
  })
})
