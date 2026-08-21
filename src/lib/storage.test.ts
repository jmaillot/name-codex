import { loadJSONArray, loadJSON, loadJSONRecord } from "./storage"

describe("loadJSONArray", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("returns parsed array for valid string array", () => {
    localStorage.setItem("k1", JSON.stringify(["a", "b"]))
    expect(loadJSONArray("k1")).toEqual(["a", "b"])
  })

  it("returns null for array with numeric elements [123]", () => {
    localStorage.setItem("k1", JSON.stringify([123]))
    expect(loadJSONArray("k1")).toBeNull()
  })

  it("returns null for mixed string and number", () => {
    localStorage.setItem("k1", JSON.stringify(["a", 123]))
    expect(loadJSONArray("k1")).toBeNull()
  })

  it("returns null for invalid json", () => {
    localStorage.setItem("k1", "not-json")
    expect(loadJSONArray("k1")).toBeNull()
  })

  it("returns null for missing key", () => {
    expect(loadJSONArray("missing")).toBeNull()
  })

  it("returns null for object value", () => {
    localStorage.setItem("k1", JSON.stringify({ a: "b" }))
    expect(loadJSONArray("k1")).toBeNull()
  })

  it("returns null for empty string value", () => {
    localStorage.setItem("k1", "")
    expect(loadJSONArray("k1")).toBeNull()
  })

  it("does not leak between tests", () => {
    expect(loadJSONArray("k1")).toBeNull()
    localStorage.setItem("k2", JSON.stringify(["x"]))
    expect(loadJSONArray("k2")).toEqual(["x"])
    expect(loadJSONArray("k1")).toBeNull()
  })
})

describe("loadJSONRecord", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("returns parsed record for valid string values", () => {
    localStorage.setItem("k1", JSON.stringify({ k: "v" }))
    expect(loadJSONRecord("k1")).toEqual({ k: "v" })
  })

  it("returns null for numeric value", () => {
    localStorage.setItem("k1", JSON.stringify({ k: 123 }))
    expect(loadJSONRecord("k1")).toBeNull()
  })

  it("returns null for array value", () => {
    localStorage.setItem("k1", JSON.stringify([]))
    expect(loadJSONRecord("k1")).toBeNull()
  })

  it("returns null for null value", () => {
    localStorage.setItem("k1", JSON.stringify(null))
    expect(loadJSONRecord("k1")).toBeNull()
  })

  it("returns null for invalid json", () => {
    localStorage.setItem("k1", "not-json")
    expect(loadJSONRecord("k1")).toBeNull()
  })

  it("returns null for mixed valid and invalid values", () => {
    localStorage.setItem("k1", JSON.stringify({ a: "ok", b: 123 }))
    expect(loadJSONRecord("k1")).toBeNull()
  })

  it("returns null for missing key", () => {
    expect(loadJSONRecord("missing")).toBeNull()
  })
})

describe("loadJSON", () => {
  beforeEach(() => {
    localStorage.clear()
    vi.clearAllMocks()
  })

  it("returns parsed value for valid json", () => {
    localStorage.setItem("k1", JSON.stringify({ a: 1 }))
    expect(loadJSON("k1")).toEqual({ a: 1 })
  })

  it("returns null for corrupt json", () => {
    localStorage.setItem("k1", "{bad")
    expect(loadJSON("k1")).toBeNull()
  })

  it("returns null when getItem throws SecurityError", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError")
    })
    expect(loadJSON("any")).toBeNull()
  })

  it("loadJSONArray returns null when getItem throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError")
    })
    expect(loadJSONArray("any")).toBeNull()
  })

  it("loadJSONRecord returns null when getItem throws", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError")
    })
    expect(loadJSONRecord("any")).toBeNull()
  })

  it("returns null for missing key via null raw", () => {
    expect(loadJSON("missing")).toBeNull()
  })
})
