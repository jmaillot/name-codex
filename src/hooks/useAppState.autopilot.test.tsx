import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { useAppState } from "./useAppState"
import { fieldByName, optionsForSegment } from "../lib/segments"
import "../i18n"

/**
 * Hook-level integration regression test for the 14-04 UAT issues:
 * 1. Selecting PREFIX+RANDOM must rebuild builderSegments with Macro=%RAND:12%.
 * 2. Macro dropdown options must be filtered by the Prefix budget.
 * 3. Editing Prefix must live-clamp an oversized RAND macro.
 * Drives the real hook with the real rule JSON — no mocks.
 */

type State = ReturnType<typeof useAppState>

const stateRef: { current: State | null } = { current: null }

function Harness() {
  const state = useAppState()
  stateRef.current = state
  return null
}

let host: HTMLDivElement
let root: Root

const s = () => stateRef.current!

describe("useAppState Autopilot variant wiring", () => {
  beforeAll(async () => {
    ;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true
    host = document.createElement("div")
    document.body.appendChild(host)
    root = createRoot(host)
    await act(async () => {
      root.render(<Harness />)
    })
    await act(async () => {
      s().setSelectedCategory("Intune")
    })
    await act(async () => {
      s().setSelectedConventionId("intune-autopilot-device-name")
    })
  })

  afterAll(() => {
    act(() => {
      root.unmount()
    })
    host.remove()
  })

  it("defaults to prefix-serial with Macro=%SERIAL%", () => {
    expect(s().selectedConvention.id).toBe("intune-autopilot-device-name")
    expect(s().selectedPattern!.id).toBe("prefix-serial")
    expect(s().builderSegments.find((x) => x.sourceName === "Macro")!.value).toBe("%SERIAL%")
  })

  it("ISSUE 1 REGRESSION: selecting PREFIX+RANDOM shows %RAND:12%, not %SERIAL%", async () => {
    await act(async () => {
      s().setSelectedPatternId("prefix-random")
    })
    expect(s().selectedPattern!.id).toBe("prefix-random")
    expect(s().builderSegments.find((x) => x.sourceName === "Macro")!.value).toBe("%RAND:12%")
  })

  it("ISSUE 2 REGRESSION: Macro options are budget-filtered while Prefix is DT-", () => {
    const vals = macroOptionValues()
    expect(vals).toContain("%RAND:12%")
    expect(vals).toContain("%SERIAL%")
    expect(vals).not.toContain("%RAND:13%")
    expect(vals).not.toContain("%RAND:14%")
    expect(vals).not.toContain("%RAND:15%")
  })

  it("editing Prefix to WKSHPREFX- live-clamps Macro to %RAND:5% and refilters options", async () => {
    const prefixKey = s().builderSegments.find((x) => x.sourceName === "Prefix")!.key
    await act(async () => {
      s().updateSegmentValue(prefixKey, "WKSHPREFX-")
    })
    expect(s().builderSegments.find((x) => x.sourceName === "Macro")!.value).toBe("%RAND:5%")

    const vals = macroOptionValues()
    expect(vals).toContain("%RAND:5%")
    expect(vals).not.toContain("%RAND:6%")
  })

  it("switching back to PREFIX+SERIAL restores Macro=%SERIAL%", async () => {
    await act(async () => {
      s().setSelectedPatternId("prefix-serial")
    })
    expect(s().builderSegments.find((x) => x.sourceName === "Macro")!.value).toBe("%SERIAL%")
  })
})

function macroOptionValues(): string[] {
  return optionsForSegment(
    fieldByName(s().activeFields, "Macro"),
    s().builderSegments,
    s().selectedConvention
  ).map((o) => (typeof o === "string" ? o : o.value))
}
