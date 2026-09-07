import { applyThemeToDocument, currentDocumentTheme, storeTheme, THEME_STORAGE_KEY, toggleTheme } from './theme'

beforeEach(() => {
  localStorage.clear()
  document.documentElement.removeAttribute("data-theme")
})

describe("toggleTheme", () => {
  it("flips light to dark", () => {
    expect(toggleTheme("light")).toBe("dark")
  })

  it("flips dark to light", () => {
    expect(toggleTheme("dark")).toBe("light")
  })
})

describe("storeTheme", () => {
  it("persists the chosen theme under the storage key", () => {
    storeTheme("dark")
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("dark")
    storeTheme("light")
    expect(localStorage.getItem(THEME_STORAGE_KEY)).toBe("light")
  })

  it("never throws when storage is unavailable", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("denied")
    })
    expect(() => storeTheme("dark")).not.toThrow()
    spy.mockRestore()
  })
})

describe("currentDocumentTheme", () => {
  it("resolves a missing attribute to dark", () => {
    expect(currentDocumentTheme()).toBe("dark")
  })

  it("resolves an unexpected value to dark", () => {
    document.documentElement.setAttribute("data-theme", "sepia")
    expect(currentDocumentTheme()).toBe("dark")
  })

  it("resolves light and dark attributes", () => {
    document.documentElement.setAttribute("data-theme", "light")
    expect(currentDocumentTheme()).toBe("light")
    document.documentElement.setAttribute("data-theme", "dark")
    expect(currentDocumentTheme()).toBe("dark")
  })
})

describe("applyThemeToDocument", () => {
  it("sets the data-theme attribute", () => {
    applyThemeToDocument("light")
    expect(document.documentElement.getAttribute("data-theme")).toBe("light")
    applyThemeToDocument("dark")
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark")
  })
})
