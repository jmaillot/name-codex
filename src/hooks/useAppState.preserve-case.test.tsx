import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { useAppState } from "./useAppState"
import "../i18n"

/**
 * CR-01 regression: conventions declaring `"caseMode": "preserve"` must keep
 * the user's mixed-case segment values through segment-driven assembly
 * (assembleRawName). Before the fix, useAppState coerced every non-"lower"
 * caseMode to "upper", generating PRJ-ATLAS-FINANCE instead of the documented
 * PRJ-Atlas-Finance example (teams/team-project.json).
 * Self-contained harness — no shared state with other suites.
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

describe("useAppState caseMode preserve wiring", () => {
  beforeAll(async () => {
    ;(globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true
    host = document.createElement("div")
    document.body.appendChild(host)
    root = createRoot(host)
    await act(async () => {
      root.render(<Harness />)
    })
    await act(async () => {
      s().setSelectedCategory("Teams")
    })
    await act(async () => {
      s().setSelectedConventionId("teams-project-team")
    })
  })

  afterAll(() => {
    act(() => {
      root.unmount()
    })
    host.remove()
  })

  it("CR-01 REGRESSION: preserve convention keeps mixed case in generatedName", async () => {
    expect(s().selectedConvention.id).toBe("teams-project-team")
    expect(s().selectedConvention.validation?.caseMode).toBe("preserve")

    const workloadKey = s().builderSegments.find((x) => x.sourceName === "Workload")!.key
    const functionKey = s().builderSegments.find((x) => x.sourceName === "Function")!.key

    await act(async () => {
      s().updateSegmentValue(workloadKey, "Atlas")
    })
    await act(async () => {
      s().updateSegmentValue(functionKey, "Finance")
    })

    // Documented example from team-project.json — must not be uppercased.
    expect(s().generatedName).toBe("PRJ-Atlas-Finance")
  })
})
