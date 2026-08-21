import { defaultValueForField, fieldByName, optionsForSegment, valuesForField } from "./segments"
import type { BuilderSegment } from "./segments"
import type { NamingField } from "../types/Rule"

function seg(name: string, value: string): BuilderSegment {
  return { key: `${name}-0`, sourceName: name, label: name, value }
}

describe("valuesForField", () => {
  it("returns field.values directly when present", () => {
    const field: NamingField = { name: "A", values: ["x", "y"] }
    expect(valuesForField(field)).toEqual(["x", "y"])
  })

  it("resolves library via getSegmentFile", () => {
    const field: NamingField = { name: "CA-Persona", library: "conditional-access/ca-persona" }
    const vals = valuesForField(field)
    expect(vals.length).toBeGreaterThan(0)
    const first = vals[0] as any
    expect(typeof (first.value ?? first)).toBe("string")
  })

  it("resolves generator via generateValues", () => {
    const field: NamingField = { name: "PolicyId", generator: "ca-emergency-policy-id" }
    const vals = valuesForField(field)
    expect(vals.length).toBe(1000)
    expect((vals[0] as any).value).toBe("EM000")
  })

  it("filters by allowedValues", () => {
    const field: NamingField = { name: "A", values: ["a", "b", "c"], allowedValues: ["a"] }
    expect(valuesForField(field)).toEqual(["a"])
  })

  it("allowedValues with object values filters by optionValue", () => {
    const field: NamingField = { name: "A", values: [{ value: "a" }, { value: "b" }], allowedValues: ["a"] }
    const result = valuesForField(field)
    expect(result.length).toBe(1)
    expect((result[0] as any).value).toBe("a")
  })

  it("returns empty for undefined field", () => {
    expect(valuesForField(undefined)).toEqual([])
  })

  it("returns empty for field with no values/library/generator", () => {
    const field: NamingField = { name: "Empty" }
    expect(valuesForField(field)).toEqual([])
  })

  it("returns empty for unknown library", () => {
    const field: NamingField = { name: "X", library: "nonexistent/library-that-does-not-exist" }
    expect(valuesForField(field)).toEqual([])
  })

  it("returns empty for unknown generator", () => {
    const field: NamingField = { name: "X", generator: "nonexistent-generator" }
    expect(valuesForField(field)).toEqual([])
  })
})

describe("optionsForSegment allowedValuesByField first-match", () => {
  it("filters by first matching depName US", () => {
    const field: NamingField = {
      name: "Env",
      values: ["a", "b", "c"],
      allowedValuesByField: { Region: { US: ["a"], EU: ["b"] } },
    }
    const segments = [seg("Region", "US")]
    expect(optionsForSegment(field, segments)).toEqual(["a"])
  })

  it("filters by EU when Region is EU", () => {
    const field: NamingField = {
      name: "Env",
      values: ["a", "b", "c"],
      allowedValuesByField: { Region: { US: ["a"], EU: ["b"] } },
    }
    expect(optionsForSegment(field, [seg("Region", "EU")])).toEqual(["b"])
  })

  it("returns unfiltered when no match", () => {
    const field: NamingField = {
      name: "Env",
      values: ["a", "b", "c"],
      allowedValuesByField: { Region: { US: ["a"] } },
    }
    expect(optionsForSegment(field, [seg("Region", "APAC")])).toEqual(["a", "b", "c"])
  })

  it("only first matching depName applies", () => {
    const field: NamingField = {
      name: "Env",
      values: ["a", "b", "c"],
      allowedValuesByField: {
        Region: { US: ["a"] },
        Env2: { X: ["b"] },
      },
    }
    const segments = [seg("Region", "US"), seg("Env2", "X")]
    expect(optionsForSegment(field, segments)).toEqual(["a"])
  })

  it("case-insensitive depValue matching uppercases", () => {
    const field: NamingField = {
      name: "Env",
      values: ["a", "B", "c"],
      allowedValuesByField: { Region: { US: ["a"] } },
    }
    expect(optionsForSegment(field, [seg("Region", "us")])).toEqual(["a"])
    expect(optionsForSegment(field, [seg("Region", "Us")])).toEqual(["a"])
  })

  it("returns unfiltered when dep segment missing", () => {
    const field: NamingField = {
      name: "Env",
      values: ["a", "b"],
      allowedValuesByField: { Region: { US: ["a"] } },
    }
    expect(optionsForSegment(field, [])).toEqual(["a", "b"])
  })

  it("returns unfiltered when field has no allowedValuesByField", () => {
    const field: NamingField = { name: "Env", values: ["a", "b"] }
    expect(optionsForSegment(field, [seg("Region", "US")])).toEqual(["a", "b"])
  })
})

describe("optionsForSegment persona-range path", () => {
  it("scopes ca-policy-id generator via personaRange", () => {
    const field: NamingField = { name: "PolicyId", generator: "ca-policy-id" }
    const segments = [seg("CA-Persona", "Employees")]
    const opts = optionsForSegment(field, segments)
    expect(opts.length).toBe(100)
    expect((opts[0] as any).value).toBe("CA200")
  })

  it("returns all options when persona missing", () => {
    const field: NamingField = { name: "PolicyId", generator: "ca-policy-id" }
    const opts = optionsForSegment(field, [])
    expect(opts.length).toBeGreaterThan(100)
  })

  it("returns all options for non-caPolicyId generator persona not scoped", () => {
    const field: NamingField = { name: "PolicyId", generator: "ca-emergency-policy-id" }
    const opts = optionsForSegment(field, [seg("CA-Persona", "Employees")])
    expect(opts.length).toBe(1000)
  })
})

describe("defaultValueForField", () => {
  it("returns defaultValue when present", () => {
    const field: NamingField = { name: "A", values: ["x", "y"], defaultValue: "y" }
    expect(defaultValueForField(field)).toBe("y")
  })

  it("returns first valuesForField value otherwise", () => {
    const field: NamingField = { name: "A", values: ["x", "y"] }
    expect(defaultValueForField(field)).toBe("x")
  })

  it("returns empty when no values", () => {
    const field: NamingField = { name: "Empty" }
    expect(defaultValueForField(field)).toBe("")
  })

  it("returns empty for undefined field", () => {
    expect(defaultValueForField(undefined)).toBe("")
  })

  it("handles dropdown object values", () => {
    const field: NamingField = { name: "A", values: [{ value: "first" }, { value: "second" }] }
    expect(defaultValueForField(field)).toBe("first")
  })
})

describe("fieldByName", () => {
  it("merges catalog and convention fields with convention precedence", () => {
    const convFields: NamingField[] = [{ name: "Region", values: ["custom"] }]
    const result = fieldByName(convFields, "Region")
    expect(result?.name).toBe("Region")
    expect(result?.values).toEqual(["custom"])
  })

  it("returns catalog field when convention has it not", () => {
    const result = fieldByName([], "Region")
    expect(result?.name).toBe("Region")
    expect(result?.library).toBe("core/region")
  })

  it("returns undefined when not in either", () => {
    expect(fieldByName([], "UnknownFieldXYZ123")).toBeUndefined()
  })

  it("returns convention field when not in catalog", () => {
    const convFields: NamingField[] = [{ name: "CustomOnly", values: ["a"] }]
    expect(fieldByName(convFields, "CustomOnly")?.values).toEqual(["a"])
  })
})
