import { parsePattern, patternToSegments } from './parse'

describe("parsePattern", () => {
  it("returns empty array for empty string", () => {
    expect(parsePattern("")).toEqual([])
  })

  it("parses two segments with literal separator", () => {
    expect(parsePattern("[A]-[B]")).toEqual([
      { type: "segment", value: "A" },
      { type: "literal", value: "-" },
      { type: "segment", value: "B" },
    ])
  })

  it("splits prefix literal and suffix literal around a segment", () => {
    expect(parsePattern("prefix[B]suffix")).toEqual([
      { type: "literal", value: "prefix" },
      { type: "segment", value: "B" },
      { type: "literal", value: "suffix" },
    ])
  })

  it("treats pattern with no brackets as single literal", () => {
    expect(parsePattern("hello")).toEqual([{ type: "literal", value: "hello" }])
  })

  it("handles trailing literal after segment", () => {
    expect(parsePattern("[A]suffix")).toEqual([
      { type: "segment", value: "A" },
      { type: "literal", value: "suffix" },
    ])
  })

  it("handles leading literal before segment", () => {
    expect(parsePattern("prefix[A]")).toEqual([
      { type: "literal", value: "prefix" },
      { type: "segment", value: "A" },
    ])
  })

  it("treats empty brackets as literal since regex requires content", () => {
    expect(parsePattern("[]")).toEqual([{ type: "literal", value: "[]" }])
  })

  it("treats empty brackets inside pattern as literal", () => {
    expect(parsePattern("a[]b")).toEqual([{ type: "literal", value: "a[]b" }])
  })

  it("parses three segments with literals", () => {
    expect(parsePattern("[A]-[B]-[C]")).toEqual([
      { type: "segment", value: "A" },
      { type: "literal", value: "-" },
      { type: "segment", value: "B" },
      { type: "literal", value: "-" },
      { type: "segment", value: "C" },
    ])
  })

  it("handles adjacent segments without literal", () => {
    expect(parsePattern("[A][B]")).toEqual([
      { type: "segment", value: "A" },
      { type: "segment", value: "B" },
    ])
  })

  it("handles only literals with no segments", () => {
    expect(parsePattern("---")).toEqual([{ type: "literal", value: "---" }])
  })

  it("preserves token order for complex pattern", () => {
    const tokens = parsePattern("pre[A]mid[B]post")
    expect(tokens.map((t) => t.value)).toEqual(["pre", "A", "mid", "B", "post"])
    expect(tokens.map((t) => t.type)).toEqual(["literal", "segment", "literal", "segment", "literal"])
  })
})

describe("patternToSegments", () => {
  it("extracts segment names from bracket pattern", () => {
    expect(patternToSegments("[A]-[B]-[C]")).toEqual(["A", "B", "C"])
  })

  it("returns empty array when no brackets present", () => {
    expect(patternToSegments("hello")).toEqual([])
  })

  it("preserves order of segments", () => {
    expect(patternToSegments("[Z]-[A]-[M]")).toEqual(["Z", "A", "M"])
  })

  it("returns empty for empty string", () => {
    expect(patternToSegments("")).toEqual([])
  })

  it("handles single segment", () => {
    expect(patternToSegments("[Only]")).toEqual(["Only"])
  })

  it("handles adjacent brackets", () => {
    expect(patternToSegments("[A][B][C]")).toEqual(["A", "B", "C"])
  })

  it("ignores literals between segments", () => {
    expect(patternToSegments("pre[A]mid[B]post")).toEqual(["A", "B"])
  })
})
