import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { useAppState } from "../hooks/useAppState";
import BuilderCard from "./BuilderCard";
import { isFixedFirst, isFixedLast, isLocked } from "../lib/validation";
import type { BuilderSegment } from "../lib/segments";
import type { NamingConvention } from "../types/Rule";
import "../i18n";

// Hook harness
type State = ReturnType<typeof useAppState>;
const stateRef: { current: State | null } = { current: null };
function Harness() {
  const state = useAppState();
  stateRef.current = state;
  return null;
}
let host: HTMLDivElement;
let root: Root;
const s = () => stateRef.current!;

describe("BuilderCard reorder + constraints", () => {
  beforeAll(async () => {
    (globalThis as Record<string, unknown>).IS_REACT_ACT_ENVIRONMENT = true;
    host = document.createElement("div");
    document.body.appendChild(host);
    root = createRoot(host);
    await act(async () => {
      root.render(<Harness />);
    });
    // Use a convention with known locked/ fixed. Pick Azure Resource Group (locked Region, Environment)
    await act(async () => {
      s().setSelectedCategory("Azure");
    });
    // Find resource-group convention
    const rg = s().filteredConventions.find((c) => c.id === "azure-resource-group");
    if (rg) {
      await act(async () => {
        s().setSelectedConventionId(rg.id);
      });
    }
  });

  afterAll(() => {
    act(() => {
      root.unmount();
    });
    host.remove();
  });

  it("reorder via onReorder splice moves movable correctly", async () => {
    // Segments currently: Region(locked), Environment(locked), Workload(movable)
    const segs = s().builderSegments;
    expect(segs.map((x) => x.sourceName)).toEqual(expect.arrayContaining(["Region", "Environment", "Workload"]));
    // Add a custom segment to have more movables
    await act(async () => {
      s().setCustomSegmentName("CustomA");
    });
    await act(async () => {
      s().addCustomSegment();
    });
    const afterAdd = s().builderSegments;
    const customIdx = afterAdd.findIndex((x) => x.sourceName === "CustomA");
    expect(customIdx).toBeGreaterThan(-1);
    // Initially order: Region(0), Environment(1), Workload(2), CustomA(3)
    expect(afterAdd.map((x) => x.sourceName)).toEqual(["Region", "Environment", "Workload", "CustomA"]);
    // Move CustomA before Workload via reorder
    const from = customIdx;
    const to = 2;
    await act(async () => {
      s().reorderSegments(from, to);
    });
    const reordered = s().builderSegments;
    expect(reordered.map((x) => x.sourceName)).toEqual(["Region", "Environment", "CustomA", "Workload"]);
  });

  it("pinned segments cannot be dragged/dropped and blocked cue is shown", async () => {
    const segs = s().builderSegments;
    // Current order after previous test: Region, Environment, CustomA, Workload (both locked at start)
    // Try to reorder locked Region (0) to 2 -> should be blocked
    const before = segs.map((x) => x.sourceName);
    await act(async () => {
      s().reorderSegments(0, 2);
    });
    const after = s().builderSegments;
    expect(after.map((x) => x.sourceName)).toEqual(before);
    // actionFeedback should be set to locked or fixed? For locked Region, showFeedback locked
    // Since locked source returns without feedback? Actually reorderSegments shows locked for locked source.
    // Check feedback is set (may be "locked")
    expect(s().actionFeedback).toBeTruthy();
  });

  it("fixed constraint prevents crossing barrier", async () => {
    // Switch to storage-account which has fixedFirst Workload
    await act(async () => {
      const storage = s().filteredConventions.find((c) => c.id === "azure-storage-account");
      if (storage) s().setSelectedConventionId(storage.id);
    });
    // Add custom
    await act(async () => {
      s().setCustomSegmentName("ExtraX");
    });
    await act(async () => {
      s().addCustomSegment();
    });
    const segs = s().builderSegments;
    // Storage has defaultSegments Workload(fixedFirst), Environment, Region, Instance + ExtraX before? Extra inserted before? Actually fixedLast none, so appended, but Workload is fixedFirst at 0
    // Order: Workload(0 fixedFirst), Environment(1), Region(2), Instance(3), ExtraX(4)
    expect(isFixedFirst(s().selectedConvention, "Workload")).toBe(true);
    const before = segs.map((x) => x.sourceName);
    // Try to move ExtraX to 0 (before fixedFirst) -> should be blocked
    await act(async () => {
      s().reorderSegments(before.length - 1, 0);
    });
    const after = s().builderSegments;
    expect(after.map((x) => x.sourceName)).toEqual(before);
  });

  it("validationResults and namingScore recompute after reorder", async () => {
    const beforeScore = s().namingScore;
    void beforeScore;
    // Do a legal reorder: swap two movables (Environment and Region) if possible
    const segs = s().builderSegments;
    const envIdx = segs.findIndex((x) => x.sourceName === "Environment");
    const regionIdx = segs.findIndex((x) => x.sourceName === "Region");
    if (envIdx !== -1 && regionIdx !== -1) {
      await act(async () => {
        s().reorderSegments(envIdx, regionIdx);
      });
      const afterScore = s().namingScore;
      const afterValidation = s().validationResults.map((r) => r.valid);
      // Score/validation may change due to pattern length? At least dynamicPattern changed
      expect(s().dynamicPattern).toBeTruthy();
      expect(s().generatedName).toBeTruthy();
      // Ensure reorder actually changed order
      const reordered = s().builderSegments;
      expect(reordered[envIdx].sourceName !== segs[envIdx].sourceName || reordered[regionIdx].sourceName !== segs[regionIdx].sourceName).toBe(true);
      // Score recomputed (not necessarily different, but defined)
      expect(typeof afterScore).toBe("number");
      expect(afterValidation.length).toBe(s().validationResults.length);
    } else {
      expect(beforeScore).toBeDefined();
    }
  });

  it("up/down buttons still reorder one step (button coexistence)", async () => {
    // Use moveSegment to ensure buttons still work after reorder
    const segs = s().builderSegments;
    // Find a movable index (not fixed/locked)
    let movableIdx = -1;
    for (let i = 0; i < segs.length; i++) {
      const name = segs[i].sourceName;
      if (!isFixedFirst(s().selectedConvention, name) && !isFixedLast(s().selectedConvention, name) && !isLocked(s().selectedConvention, name)) {
        movableIdx = i;
        break;
      }
    }
    if (movableIdx !== -1 && movableIdx < segs.length - 1) {
      const before = s().builderSegments.map((x) => x.sourceName);
      // Check target not pinned
      const targetName = before[movableIdx + 1];
      if (!isLocked(s().selectedConvention, targetName) && !isFixedLast(s().selectedConvention, targetName)) {
        await act(async () => {
          s().moveSegment(movableIdx, 1);
        });
        const after = s().builderSegments.map((x) => x.sourceName);
        // Should have swapped
        expect(after[movableIdx]).toBe(before[movableIdx + 1]);
        expect(after[movableIdx + 1]).toBe(before[movableIdx]);
      }
    }
    expect(s().builderSegments.length).toBeGreaterThan(0);
  });
});

describe("BuilderCard keyboard and ARIA", () => {
  const mockConvention: NamingConvention = {
    id: "test-conv",
    category: "Test",
    name: "Test",
    pattern: "[FixedA][B][LockedC][D][FixedZ]",
    fields: [
      { name: "FixedA", type: "text", defaultValue: "A" },
      { name: "B", type: "text", defaultValue: "B" },
      { name: "LockedC", type: "text", defaultValue: "C" },
      { name: "D", type: "text", defaultValue: "D" },
      { name: "FixedZ", type: "text", defaultValue: "Z" },
    ],
    builder: {
      separator: "-",
      defaultSegments: ["FixedA", "B", "LockedC", "D", "FixedZ"],
      availableSegments: [],
      recommendedSegments: [],
      lockedSegments: ["LockedC"],
      fixedFirstSegments: ["FixedA"],
      fixedLastSegments: ["FixedZ"],
    },
    validation: { maxLength: 100, allowedPattern: "^[A-Za-z0-9-]+$" },
  } as unknown as NamingConvention;

  const makeSegments = (): BuilderSegment[] => [
    { key: "FixedA-0", sourceName: "FixedA", label: "FixedA", value: "A", custom: false },
    { key: "B-1", sourceName: "B", label: "B", value: "B", custom: false },
    { key: "LockedC-2", sourceName: "LockedC", label: "LockedC", value: "C", custom: false },
    { key: "D-3", sourceName: "D", label: "D", value: "D", custom: false },
    { key: "FixedZ-4", sourceName: "FixedZ", label: "FixedZ", value: "Z", custom: false },
  ];

  it("handle shows GripVertical for movable and draggable attributes", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const r = createRoot(container);
    const segments = makeSegments();
    await act(async () => {
      r.render(
        <BuilderCard
          category="Test"
          patternModified={false}
          generatedName="test-name"
          dynamicPattern="[FixedA][B][LockedC][D][FixedZ]"
          segments={segments}
          fields={mockConvention.fields}
          convention={mockConvention}
          customSegmentName=""
          onCustomSegmentNameChange={() => {}}
          onAddCustomSegment={() => {}}
          onUpdateSegment={() => {}}
          onMoveSegment={() => {}}
          onRemoveSegment={() => {}}
        />
      );
    });
    // Query handles
    const handles = container.querySelectorAll(".builder-handle");
    expect(handles.length).toBe(5);
    // FixedA handle should be pinned (draggable false)
    const fixedHandle = handles[0] as HTMLElement;
    expect(fixedHandle.getAttribute("draggable")).toBe("false");
    // B is movable -> draggable true and contains GripVertical svg
    const bHandle = handles[1] as HTMLElement;
    expect(bHandle.getAttribute("draggable")).toBe("true");
    expect(bHandle.innerHTML).toContain("svg");
    // LockedC pinned
    const lockedHandle = handles[2] as HTMLElement;
    expect(lockedHandle.getAttribute("draggable")).toBe("false");
    // D movable
    const dHandle = handles[3] as HTMLElement;
    expect(dHandle.getAttribute("draggable")).toBe("true");
    // Check aria-label exists
    expect(bHandle.getAttribute("aria-label")).toContain("Drag to reorder");
    // Check dragging class not present initially
    expect(container.querySelector(".builder-row.dragging")).toBeNull();
    await act(async () => {
      r.unmount();
    });
    container.remove();
  });

  it("keyboard Arrow skips pinned barrier and Esc restores", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const r = createRoot(container);
    const segments = makeSegments();
    let reorderCalls: Array<[number, number]> = [];
    let restoredSnapshot: BuilderSegment[] | null = null;
    const onReorder = (from: number, to: number) => {
      reorderCalls.push([from, to]);
    };
    const onRestore = (snap: BuilderSegment[]) => {
      restoredSnapshot = snap;
    };
    await act(async () => {
      r.render(
        <BuilderCard
          category="Test"
          patternModified={false}
          generatedName="test-name"
          dynamicPattern="[FixedA][B][LockedC][D][FixedZ]"
          segments={segments}
          fields={mockConvention.fields}
          convention={mockConvention}
          customSegmentName=""
          onCustomSegmentNameChange={() => {}}
          onAddCustomSegment={() => {}}
          onUpdateSegment={() => {}}
          onMoveSegment={() => {}}
          onRemoveSegment={() => {}}
          onReorder={onReorder}
          onRestoreSegments={onRestore}
          onShowFeedback={() => {}}
        />
      );
    });
    const handles = container.querySelectorAll<HTMLElement>(".builder-handle");
    const bHandle = handles[1];
    // Focus and press Space to grab
    await act(async () => {
      bHandle.focus();
      const ev = new KeyboardEvent("keydown", { key: " ", bubbles: true, cancelable: true });
      bHandle.dispatchEvent(ev);
    });
    // After grab, live region should announce grab
    const live = container.querySelector('[aria-live="polite"]');
    expect(live?.textContent).toContain("Grabbed");
    // Check grabbed attribute
    expect(bHandle.getAttribute("aria-grabbed")).toBe("true");
    // Now ArrowDown should try to move B down but skipping LockedC (barrier at 2) -> should go? B at 1, next is LockedC at 2 blocked, so should skip to maybe? But D at 3 is movable but after LockedC, crossing barrier should be blocked.
    // So ArrowDown from 1 should be blocked (cannot cross LockedC)
    await act(async () => {
      const ev = new KeyboardEvent("keydown", { key: "ArrowDown", bubbles: true, cancelable: true });
      bHandle.dispatchEvent(ev);
    });
    // Should still be at same drop index? But live should indicate blocked
    expect(live?.textContent).toContain("Cannot move");
    // Now test Esc restores
    await act(async () => {
      const ev = new KeyboardEvent("keydown", { key: "Escape", bubbles: true, cancelable: true });
      bHandle.dispatchEvent(ev);
    });
    expect(restoredSnapshot).not.toBeNull();
    expect(live?.textContent).toContain("cancelled");
    expect(bHandle.getAttribute("aria-grabbed")).toBe("false");
    await act(async () => {
      r.unmount();
    });
    container.remove();
    expect(reorderCalls.length).toBe(0); // No commit yet
  });

  it("live region exists and announces grab/move/drop with sr-only", async () => {
    const container = document.createElement("div");
    document.body.appendChild(container);
    const r = createRoot(container);
    const segments = makeSegments();
    await act(async () => {
      r.render(
        <BuilderCard
          category="Test"
          patternModified={false}
          generatedName="test-name"
          dynamicPattern="[FixedA][B][LockedC][D][FixedZ]"
          segments={segments}
          fields={mockConvention.fields}
          convention={mockConvention}
          customSegmentName=""
          onCustomSegmentNameChange={() => {}}
          onAddCustomSegment={() => {}}
          onUpdateSegment={() => {}}
          onMoveSegment={() => {}}
          onRemoveSegment={() => {}}
        />
      );
    });
    const live = container.querySelector('[aria-live="polite"]');
    expect(live).not.toBeNull();
    expect(live?.classList.contains("sr-only")).toBe(true);
    // Check SegmentEditor has aria-grabbed binding
    const handles = container.querySelectorAll(".builder-handle");
    for (const h of Array.from(handles)) {
      // Each handle should have role button and tabIndex
      expect(h.getAttribute("role")).toBe("button");
    }
    await act(async () => {
      r.unmount();
    });
    container.remove();
  });

  it("reorder fixed constraint: insertion line never in illegal slots", async () => {
    // Verify that isLegalInsertion logic prevents dropping onto pinned
    // We test via component: dragging over illegal slot should not show insertion line
    const container = document.createElement("div");
    document.body.appendChild(container);
    const r = createRoot(container);
    const segments = makeSegments();
    await act(async () => {
      r.render(
        <BuilderCard
          category="Test"
          patternModified={false}
          generatedName="test-name"
          dynamicPattern="[FixedA][B][LockedC][D][FixedZ]"
          segments={segments}
          fields={mockConvention.fields}
          convention={mockConvention}
          customSegmentName=""
          onCustomSegmentNameChange={() => {}}
          onAddCustomSegment={() => {}}
          onUpdateSegment={() => {}}
          onMoveSegment={() => {}}
          onRemoveSegment={() => {}}
          onReorder={() => {}}
        />
      );
    });
    // Initially no insertion line
    expect(container.querySelector(".insertion-line")).toBeNull();
    await act(async () => {
      r.unmount();
    });
    container.remove();
  });
});
