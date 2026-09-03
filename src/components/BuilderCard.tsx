import { useState, useRef, useCallback, useEffect } from "react";
import { tl } from "../lib/i18n-utils";
import type { NamingConvention, NamingField } from "../types/Rule";
import type { BuilderSegment } from "../lib/segments";
import CardTitle from "./CardTitle";
import SegmentEditor from "./SegmentEditor";
import { isFixedFirst, isFixedLast, isLocked } from "../lib/validation";

type BuilderCardProps = {
  category: string;
  patternModified: boolean;
  dynamicPattern: string;
  selectedExample?: string;
  generatedName: string;
  segments: BuilderSegment[];
  fields: NamingField[];
  convention: NamingConvention;
  customSegmentName: string;
  onCustomSegmentNameChange: (value: string) => void;
  onAddCustomSegment: () => void;
  onUpdateSegment: (key: string, value: string) => void;
  onMoveSegment: (index: number, direction: -1 | 1) => void;
  onRemoveSegment: (key: string) => void;
  onReorder?: (from: number, to: number) => void;
  onRestoreSegments?: (snapshot: BuilderSegment[]) => void;
  onShowFeedback?: (key: string) => void;
};

export default function BuilderCard({
  category,
  patternModified,
  dynamicPattern,
  selectedExample,
  generatedName,
  segments,
  fields,
  convention,
  customSegmentName,
  onCustomSegmentNameChange,
  onAddCustomSegment,
  onUpdateSegment,
  onMoveSegment,
  onRemoveSegment,
  onReorder,
  onRestoreSegments,
  onShowFeedback,
}: BuilderCardProps) {
  void category;
  void selectedExample;
  void generatedName;

  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [internalDropIndex, setInternalDropIndex] = useState<number | null>(null);
  const [kbGrabbedIndex, setKbGrabbedIndex] = useState<number | null>(null);
  const [kbDropIndex, setKbDropIndex] = useState<number | null>(null);
  const [kbSnapshot, setKbSnapshot] = useState<BuilderSegment[] | null>(null);
  const [liveMessage, setLiveMessage] = useState("");
  const listRef = useRef<HTMLDivElement>(null);

  const isKeyboardGrabbed = kbGrabbedIndex !== null;
  // When keyboard grabbed, use kbDropIndex for insertion line parity; otherwise mouse internalDropIndex
  const displayDropIndex = isKeyboardGrabbed ? kbDropIndex : internalDropIndex;
  const displayGrabbedIndex = kbGrabbedIndex;

  const isPinned = useCallback(
    (name: string) => isFixedFirst(convention, name) || isFixedLast(convention, name) || isLocked(convention, name),
    [convention]
  );

  const isLegalInsertion = useCallback(
    (insertionIndex: number, fromIdx: number | null) => {
      const n = segments.length;
      if (insertionIndex < 0 || insertionIndex > n) return false;
      if (fromIdx === null) return false;
      const nextWithout = [...segments.slice(0, fromIdx), ...segments.slice(fromIdx + 1)];
      if (insertionIndex > nextWithout.length) return false;
      const targetOriginalIndex = insertionIndex;
      const start = Math.min(fromIdx, targetOriginalIndex);
      const end = Math.max(fromIdx, targetOriginalIndex);
      for (let i = start; i <= end; i++) {
        if (i === fromIdx) continue;
        const seg = segments[i];
        if (seg && isPinned(seg.sourceName)) return false;
      }
      const targetNeighbor = nextWithout[insertionIndex];
      if (targetNeighbor && isPinned(targetNeighbor.sourceName)) return false;
      if (nextWithout.length > 0 && isFixedLast(convention, nextWithout[nextWithout.length - 1].sourceName) && insertionIndex === nextWithout.length) return false;
      if (nextWithout.length > 0 && isFixedFirst(convention, nextWithout[0].sourceName) && insertionIndex === 0) return false;
      return true;
    },
    [segments, convention, isPinned]
  );

  const findNearestLegal = useCallback(
    (rawIndex: number, fromIdx: number | null): number | null => {
      if (fromIdx === null) return null;
      if (isLegalInsertion(rawIndex, fromIdx)) return rawIndex;
      const n = segments.length;
      for (let offset = 1; offset <= n; offset++) {
        const up = rawIndex + offset;
        const down = rawIndex - offset;
        if (up <= n && isLegalInsertion(up, fromIdx)) return up;
        if (down >= 0 && isLegalInsertion(down, fromIdx)) return down;
      }
      return null;
    },
    [segments.length, isLegalInsertion]
  );

  const focusHandle = useCallback((segmentName: string) => {
    // Focus the handle of the segment with given sourceName
    const container = document.getElementById(`segment-${segmentName}`);
    if (!container) return;
    const handle = container.querySelector<HTMLElement>(".builder-handle");
    if (handle) handle.focus();
  }, []);

  // Reset keyboard grab if segments change externally without commit (e.g., pattern switch)
  useEffect(() => {
    if (kbSnapshot && kbGrabbedIndex !== null) {
      // If segments length changed drastically, clear grab
      if (segments.length !== kbSnapshot.length) {
        setKbGrabbedIndex(null);
        setKbDropIndex(null);
        setKbSnapshot(null);
      }
    }
  }, [segments.length, kbSnapshot, kbGrabbedIndex]);

  const handleDragStart = (index: number, e: React.DragEvent) => {
    if (isKeyboardGrabbed) {
      e.preventDefault();
      return;
    }
    const seg = segments[index];
    if (!seg) return;
    if (isPinned(seg.sourceName)) {
      e.preventDefault();
      return;
    }
    setDraggedIndex(index);
    setInternalDropIndex(null);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", String(index));
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setInternalDropIndex(null);
  };

  const handleDragOver = (e: React.DragEvent) => {
    if (draggedIndex === null || isKeyboardGrabbed) return;
    const container = listRef.current;
    if (!container) return;
    const rows = Array.from(container.querySelectorAll<HTMLDivElement>("[data-segment]"));
    if (rows.length === 0) {
      const legal = findNearestLegal(0, draggedIndex);
      if (legal !== null) {
        e.preventDefault();
        setInternalDropIndex(legal);
      }
      return;
    }
    const y = e.clientY;
    let rawIndex = rows.length;
    for (let i = 0; i < rows.length; i++) {
      const rect = rows[i].getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      if (y < mid) {
        rawIndex = i;
        break;
      }
    }
    let insertionIndex: number;
    if (draggedIndex !== null && rawIndex > draggedIndex) {
      insertionIndex = rawIndex - 1;
      if (rawIndex === rows.length) insertionIndex = segments.length - 1;
    } else {
      insertionIndex = rawIndex;
    }
    let nextInsertion = insertionIndex;
    if (nextInsertion < 0) nextInsertion = 0;
    if (nextInsertion > segments.length - 1) nextInsertion = segments.length - 1;
    if (rawIndex === rows.length) {
      nextInsertion = segments.length - 1;
      const nextWithout = [...segments.slice(0, draggedIndex), ...segments.slice(draggedIndex + 1)];
      if (nextWithout.length > 0 && !isFixedLast(convention, nextWithout[nextWithout.length - 1]?.sourceName ?? "")) {
        nextInsertion = nextWithout.length;
      }
    }
    const legal = findNearestLegal(nextInsertion, draggedIndex);
    if (legal !== null) {
      e.preventDefault();
      setInternalDropIndex(legal);
    } else {
      setInternalDropIndex(null);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const container = listRef.current;
    if (!container) return;
    const related = e.relatedTarget as Node | null;
    if (related && container.contains(related)) return;
    setInternalDropIndex(null);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (draggedIndex === null || isKeyboardGrabbed) return;
    const target = internalDropIndex;
    setInternalDropIndex(null);
    const from = draggedIndex;
    setDraggedIndex(null);
    if (target === null || target === from) return;
    if (!isLegalInsertion(target, from)) return;
    onReorder?.(from, target);
  };

  const handleKeyDown = (e: React.KeyboardEvent, index: number) => {
    const seg = segments[index];
    if (!seg) return;
    const isMovable = !isPinned(seg.sourceName);
    // Not grabbed: Space/Enter to grab
    if (kbGrabbedIndex === null) {
      if (e.key === " " || e.key === "Enter") {
        e.preventDefault();
        if (!isMovable) {
          if (isFixedFirst(convention, seg.sourceName)) onShowFeedback?.("fixed-first");
          else if (isFixedLast(convention, seg.sourceName)) onShowFeedback?.("fixed-last");
          else if (isLocked(convention, seg.sourceName)) onShowFeedback?.("locked");
          const reason = isFixedFirst(convention, seg.sourceName) ? tl("ui.fixedFirstWarn", "📌 This segment must remain in that position") : isFixedLast(convention, seg.sourceName) ? tl("ui.fixedLastWarn", "📌 This segment must remain in last position") : tl("ui.lockedWarn", "🔒 This segment is locked and cannot be moved");
          setLiveMessage(tl("ui.liveBlocked", "Cannot move {{label}} — {{reason}}", { label: seg.label, reason }));
          return;
        }
        setKbSnapshot([...segments]);
        setKbGrabbedIndex(index);
        setKbDropIndex(index);
        setLiveMessage(tl("ui.liveGrab", "Grabbed {{label}} at position {{pos}}", { label: seg.label, pos: index + 1 }));
      }
      return;
    }
    // Grabbed state
    const grabbedIdx = kbGrabbedIndex;
    const currentDrop = kbDropIndex ?? grabbedIdx;
    const grabbedSeg = segments[grabbedIdx] ? segments[grabbedIdx] : seg;
    // Use snapshot's grabbed segment label for announcements (grabbedSeg may have moved in UI after pending moves? But segments hasn't changed until drop)
    const label = grabbedSeg?.label ?? seg.label;

    if (e.key === "Escape") {
      e.preventDefault();
      if (kbSnapshot) {
        onRestoreSegments?.(kbSnapshot);
      }
      const restoredName = kbSnapshot?.[grabbedIdx]?.sourceName ?? seg.sourceName;
      setKbGrabbedIndex(null);
      setKbDropIndex(null);
      setKbSnapshot(null);
      setLiveMessage(tl("ui.liveCancel", "Reorder cancelled"));
      // Focus retained on original segment
      setTimeout(() => focusHandle(restoredName), 0);
      return;
    }
    if (e.key === " " || e.key === "Enter") {
      e.preventDefault();
      const from = grabbedIdx;
      const to = currentDrop;
      setKbGrabbedIndex(null);
      setKbDropIndex(null);
      setKbSnapshot(null);
      if (to !== null && from !== to && isLegalInsertion(to, from)) {
        onReorder?.(from, to);
        setLiveMessage(tl("ui.liveDrop", "Dropped {{label}} at position {{pos}}", { label, pos: to + 1 }));
        // Focus retained on moved segment
        setTimeout(() => focusHandle(grabbedSeg.sourceName), 0);
      } else if (to !== null && from === to) {
        setLiveMessage(tl("ui.liveDrop", "Dropped {{label}} at position {{pos}}", { label, pos: to + 1 }));
        setTimeout(() => focusHandle(grabbedSeg.sourceName), 0);
      } else {
        setLiveMessage(tl("ui.liveCancel", "Reorder cancelled"));
      }
      return;
    }
    if (e.key === "ArrowUp" || e.key === "ArrowDown") {
      e.preventDefault();
      const dir = e.key === "ArrowUp" ? -1 : 1;
      let next = currentDrop + dir;
      // Skip pinned barriers: find next legal index in direction
      let attempts = 0;
      while (attempts < segments.length) {
        if (next < 0 || next >= segments.length) {
          // Out of bounds
          setLiveMessage(tl("ui.liveBlocked", "Cannot move {{label}} — {{reason}}", { label, reason: "blocked" }));
          if (next < 0) onShowFeedback?.("fixed-first");
          else onShowFeedback?.("fixed-last");
          return;
        }
        if (isLegalInsertion(next, grabbedIdx)) {
          break;
        }
        // If not legal, try next in same direction (skip barrier)
        // Check if barrier is pinned at next position
        const movingPast = segments[next];
        if (movingPast && isPinned(movingPast.sourceName)) {
          // Need to skip this pinned
          next += dir;
          attempts++;
          continue;
        }
        // Check crossing barrier
        const start = Math.min(grabbedIdx, next);
        const end = Math.max(grabbedIdx, next);
        let hasBarrier = false;
        for (let i = start; i <= end; i++) {
          if (i === grabbedIdx) continue;
          const s = segments[i];
          if (s && isPinned(s.sourceName)) {
            hasBarrier = true;
            break;
          }
        }
        if (hasBarrier) {
          next += dir;
          attempts++;
          continue;
        }
        break;
      }
      if (next < 0 || next >= segments.length || !isLegalInsertion(next, grabbedIdx)) {
        // Blocked
        const neighbor = segments[next];
        if (neighbor && isPinned(neighbor.sourceName)) {
          if (isFixedFirst(convention, neighbor.sourceName)) onShowFeedback?.("fixed-first");
          else if (isFixedLast(convention, neighbor.sourceName)) onShowFeedback?.("fixed-last");
          else onShowFeedback?.("locked");
        } else {
          onShowFeedback?.("locked");
        }
        setLiveMessage(tl("ui.liveBlocked", "Cannot move {{label}} — {{reason}}", { label, reason: tl("ui.lockedWarn", "🔒 This segment is locked and cannot be moved") }));
        return;
      }
      setKbDropIndex(next);
      setLiveMessage(tl("ui.liveMove", "Moved {{label}} to position {{pos}} of {{total}}", { label, pos: next + 1, total: segments.length }));
      return;
    }
  };

  const renderInsertionLine = (atIndex: number) => (
    <div key={`insertion-${atIndex}`} className="insertion-line" aria-hidden="true" />
  );

  return (
    <div className="glass-card builder-card">
      <div className="card-header">
        <CardTitle
          title={tl("ui.segmentBuilder", "Segment Builder")}
          info={tl("ui.builderInfo", "Reorder, remove, add predefined segments, or create a custom segment.")}
        />
      </div>
      <div className="pattern-box">
        <span>
          {tl("ui.pattern", "Pattern")}

          {patternModified && (
            <span className="pattern-modified">
              {tl("ui.modified", "Modified")}
            </span>
          )}
        </span>

        <code>{dynamicPattern}</code>
      </div>

      <div
        className="builder-list"
        ref={listRef}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {segments.map((s, i) => {
          const isDragging = draggedIndex === i;
          const isGrabbed = displayGrabbedIndex === i;
          const showLineBefore = displayDropIndex === i && displayDropIndex !== null;
          // When keyboard grabbed, show line before pending position, even if draggedIndex equals line?
          return (
            <div key={s.key} data-segment={s.sourceName} id={`segment-${s.sourceName}`}>
              {showLineBefore ? renderInsertionLine(i) : null}
              <SegmentEditor
                segment={s}
                index={i}
                convention={convention}
                fields={fields}
                segments={segments}
                onUpdate={onUpdateSegment}
                onMove={onMoveSegment}
                onRemove={onRemoveSegment}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                isDragging={isDragging || isGrabbed}
                isGrabbed={isGrabbed}
                onHandleKeyDown={handleKeyDown}
              />
            </div>
          );
        })}
        {displayDropIndex !== null && displayDropIndex >= segments.length ? renderInsertionLine(segments.length) : null}
        {/* Live region for screen readers */}
        <div aria-live="polite" aria-atomic="true" className="sr-only" role="status">
          {liveMessage}
        </div>
      </div>
      <div className="add-segment-row">
        <input
          value={customSegmentName}
          onChange={(e) => onCustomSegmentNameChange(e.target.value)}
          placeholder={tl("ui.addCustomPlaceholder", "Add a custom segment...")}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              onAddCustomSegment();
            }
          }}
          maxLength={40}
        />

        <button
          className="ghost-button"
          onClick={onAddCustomSegment}
          disabled={!customSegmentName.trim()}
        >
          {tl("ui.addSegment", "Add Segment")}
        </button>
      </div>
    </div>
  );
}
