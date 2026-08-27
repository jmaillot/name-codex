import { describe, it, expect, beforeAll, afterAll } from "vitest"
import { act } from "react"
import { createRoot, type Root } from "react-dom/client"
import { useAppState } from "./useAppState"
import "../i18n"

/**
 * CR-01 regression: conventions declaring `"caseMode": "preserve"` must keep
 * the user's mixed-case segment values through segment-driven assembly
 * (assembleRawName). Before the fix, useAppState coerced every non-"lower"
 * caseMode to "upper", generating e.g. PRJ-ATLAS-FINANCE instead of
 * PRJ-Atlas-Finance. Uses m365-group-naming-policy (the remaining preserve
 * convention after Teams migration to TEAM-[Type]-[Name] upper).
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
      s().setSelectedConventionId("m365-group-naming-policy")
    })
  })

  afterAll(() => {
    act(() => {
      root.unmount()
    })
    host.remove()
  })

  it("CR-01 REGRESSION: preserve convention keeps mixed case in generatedName", async () => {
    expect(s().selectedConvention.id).toBe("m365-group-naming-policy")
    expect(s().selectedConvention.validation?.caseMode).toBe("preserve")

    const groupNameKey = s().builderSegments.find((x) => x.sourceName === "GroupName")!.key

    await act(async () => {
      s().updateSegmentValue(groupNameKey, "Atlas")
    })

    // GRP_[GroupName]_[Department] with preserve must keep Atlas, not ATLAS
    expect(s().generatedName).toBe("GRP_Atlas_[Department]")
  })
})
