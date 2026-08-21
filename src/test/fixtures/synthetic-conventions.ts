import type { NamingConvention } from "../../types/Rule"

export function makeConvention(overrides: Partial<NamingConvention> = {}): NamingConvention {
  const base: NamingConvention = {
    id: "test-conv",
    category: "test",
    name: "Test",
    description: "Test convention",
    pattern: "[A]-[B]",
    fields: [
      { name: "A", values: ["x", "y"] },
      { name: "B", values: ["1", "2"] },
    ],
    builder: {
      defaultSegments: ["A", "B"],
      lockedSegments: [],
      recommendedSegments: [],
      fixedFirstSegments: [],
      fixedLastSegments: [],
    },
    validation: {
      maxLength: 20,
      allowedPattern: "^[A-Za-z0-9-]+$",
    },
  }
  return {
    ...base,
    ...overrides,
    builder: { ...base.builder, ...(overrides.builder ?? {}) } as NamingConvention["builder"],
    validation: overrides.validation !== undefined ? overrides.validation : base.validation,
    fields: overrides.fields ?? base.fields,
  } as NamingConvention
}

export function makeCaPersonaFixture() {
  return {
    personaRanges: {
      ALLUSERS: "Global",
      EMPLOYEES: "Internals",
      ADMINS: "Admins",
    },
    ranges: {
      Global: { label: "Global", prefix: "CA0", digits: 2, min: 1, max: 99 },
      Internals: { label: "Internals", prefix: "CA2", digits: 2, min: 0, max: 99 },
      Admins: { label: "Admins", prefix: "CA1", digits: 2, min: 0, max: 99 },
    },
  }
}
