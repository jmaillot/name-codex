import { ArrowDown, ArrowUp, GripVertical, Lock, Pin, Star, X } from "lucide-react";
import { tl } from "../lib/i18n-utils";
import { getGeneratorFile, getSegmentFile } from "../lib/data";
import { caPolicyIdFallbackRange, caPolicyIdRange, personaRangeKeyForField } from "../lib/generators";
import type { SegmentConstraints } from "../types/Rule";
import {
  fieldByName,
  fieldTip,
  optionLabel,
  optionValue,
  optionsForSegment,
  valueDescription,
} from "../lib/segments";
import {
  isFixedFirst,
  isFixedLast,
  isLocked,
  isRecommended,
} from "../lib/validation";
import type { BuilderSegment } from "../lib/segments";
import type { NamingConvention, NamingField } from "../types/Rule";
import InfoIcon from "./InfoIcon";
import EditableSuggestions from "./EditableSuggestions";

type SegmentEditorProps = {
  segment: BuilderSegment;
  index: number;
  convention: NamingConvention;
  fields: NamingField[];
  segments: BuilderSegment[];
  onUpdate: (key: string, value: string) => void;
  onMove: (index: number, direction: -1 | 1) => void;
  onRemove: (key: string) => void;
  onDragStart?: (index: number, e: React.DragEvent) => void;
  onDragEnd?: () => void;
  isDragging?: boolean;
  isGrabbed?: boolean;
  onHandleKeyDown?: (e: React.KeyboardEvent, index: number) => void;
};

export default function SegmentEditor({ segment, index, convention, fields, segments, onUpdate, onMove, onRemove, onDragStart, onDragEnd, isDragging, isGrabbed, onHandleKeyDown }: SegmentEditorProps) {
  const field = fieldByName(fields, segment.sourceName);
  const options = optionsForSegment(field, segments, convention);
  const constraints: SegmentConstraints | undefined =
    (field as unknown as { constraints?: SegmentConstraints })?.constraints ??
    (field?.library ? (getSegmentFile(field.library) as unknown as { constraints?: SegmentConstraints })?.constraints : undefined);

  const caRange = (() => {
    if (!field?.customOnly || !field.generator) return undefined;
    const rangeKey = personaRangeKeyForField(field, segments);
    const generatorFile = getGeneratorFile(field.generator);
    if (generatorFile?.type !== "caPolicyId") return undefined;
    if (rangeKey) return caPolicyIdRange(generatorFile, rangeKey);
    return caPolicyIdFallbackRange(generatorFile);
  })();
  const caPrefix = caRange?.prefix ?? "";
  const caDigits = caRange?.digits ?? 2;
  const caDefaultNumber = caRange?.defaultNumber ?? "01";

  const fixedFirst = isFixedFirst(convention, segment.sourceName);
  const fixedLast = isFixedLast(convention, segment.sourceName);
  const locked = isLocked(convention, segment.sourceName);
  const recommended = isRecommended(convention, segment.sourceName);

  const statusClass = fixedFirst
    ? "fixed-first"
    : fixedLast
      ? "fixed-last"
      : locked
        ? "locked"
        : recommended
          ? "recommended"
          : segment.custom
            ? "custom"
            : "optional";

  const protectedSegment = locked || fixedFirst || fixedLast;
  const isMovable = !(fixedFirst || fixedLast || locked);

  return (
    <div
      className={`builder-row ${statusClass} ${isDragging ? "dragging" : ""} ${isGrabbed ? "grabbing" : ""}`}
    >
      <div
        className={`builder-handle ${statusClass} ${isDragging ? "dragging" : ""} ${isGrabbed ? "grabbing" : ""}`}
        title={
          fixedFirst
            ? tl("ui.segFixed", "Fixed segment")
            : fixedLast
              ? tl("ui.segFixed", "Fixed segment")
              : locked
                ? tl("ui.segLocked", "Locked segment")
                : recommended
                  ? tl("ui.segRecommended", "Recommended segment")
                  : segment.custom
                    ? tl("ui.segCustom", "Custom segment")
                    : tl("ui.segOptional", "Optional segment")
        }
        draggable={isMovable}
        onDragStart={isMovable && onDragStart ? (e) => onDragStart(index, e) : undefined}
        onDragEnd={onDragEnd}
        aria-label={tl("ui.dragHandleLabel", "Drag to reorder {{label}}", { label: segment.label })}
        aria-grabbed={isGrabbed ? "true" : isMovable ? "false" : undefined}
        aria-pressed={isGrabbed ? "true" : undefined}
        role="button"
        tabIndex={isMovable ? 0 : -1}
        onKeyDown={onHandleKeyDown ? (e) => onHandleKeyDown(e, index) : undefined}
      >
        {fixedFirst ? (
          <Pin size={14} />
        ) : fixedLast ? (
          <Pin size={14} style={{ transform: "rotate(180deg)" }} />
        ) : locked ? (
          <Lock size={14} />
        ) : recommended ? (
          <Star size={14} />
        ) : isMovable ? (
          <GripVertical size={14} />
        ) : (
          index + 1
        )}
      </div>

      <div className="builder-label">
        {segment.label}
        {field?.tip && <InfoIcon text={fieldTip(field, field.tip, convention.id)} />}
      </div>

      <div className="builder-editor">
        {field?.multiSelect && options.length > 0 ? (
          (() => {
            const separator = field.multiSeparator ?? ".";
            const allValue = field.multiAllValue;
            const current = segment.value ? segment.value.split(separator) : [];
            const toggleMulti = (code: string) => {
              let next: string[];
              if (current.includes(code)) {
                next = current.filter((x) => x !== code);
              } else if (allValue && code === allValue) {
                next = [code];
              } else {
                let base = current.filter((x) => x !== allValue);
                const exclusionGroup = (field.multiExclusions ?? []).find((g) =>
                  g.includes(code)
                );
                if (exclusionGroup) {
                  base = base.filter((x) => !exclusionGroup.includes(x));
                }
                next = [...base, code];
              }
              onUpdate(segment.key, next.join(separator));
            };
            return (
              <div className="multi-select-editor">
                {options.map((v) => {
                  const code = optionValue(v);
                  const active = current.includes(code);
                  const description = valueDescription(field, v) || undefined;
                  return (
                    <button
                      key={code}
                      type="button"
                      className={`multi-select-chip ${active ? "active" : ""}`}
                      aria-pressed={active}
                      onClick={() => toggleMulti(code)}
                    >
                      {optionValue(v)}
                      {description ? (
                        <span className="chip-tooltip" role="tooltip">
                          {description}
                        </span>
                      ) : null}
                    </button>
                  );
                })}
              </div>
            );
          })()
        ) : field?.customOnly ? (
          caPrefix ? (
            <div className="policy-id-editor">
              <span className="policy-id-prefix">{caPrefix}</span>
              <input
                inputMode="numeric"
                value={
                  segment.value.startsWith(caPrefix)
                    ? segment.value.slice(caPrefix.length)
                    : segment.value
                }
                onChange={(e) => {
                  const digits = e.target.value.replace(/\D/g, "").slice(0, caDigits);
                  onUpdate(segment.key, caPrefix + digits);
                }}
                onBlur={() => {
                  const suffix = segment.value.startsWith(caPrefix)
                    ? segment.value.slice(caPrefix.length)
                    : segment.value;
                  const normalized = suffix
                    ? suffix.padStart(caDigits, "0")
                    : caDefaultNumber;
                  onUpdate(segment.key, caPrefix + normalized);
                }}
                placeholder={caDefaultNumber}
                aria-label={tl("ui.segmentNumber", `${segment.label} number`, { label: segment.label })}
              />
            </div>
          ) : (
            <input
              value={segment.value}
              maxLength={constraints?.maxLength}
              onChange={(e) => onUpdate(segment.key, e.target.value)}
              placeholder={
                field?.examples?.length
                  ? tl("ui.customExample", `e.g. ${field.examples.slice(0, 3).join(", ")}...`, { examples: field.examples.slice(0, 3).join(", ") })
                  : field?.placeholder ?? segment.label
              }
            />
          )
        ) : field?.allowCustomValue && options.length > 0 ? (
          <EditableSuggestions segment={segment} field={field} options={options} onUpdate={onUpdate} />
        ) : field?.type === "dropdown" || options.length > 0 ? (
          <select
            value={segment.value}
            onChange={(e) => onUpdate(segment.key, e.target.value)}
          >
            {options.some((o) => optionValue(o) === segment.value) ? null : (
              <option disabled value={segment.value}>
                {tl("ui.segmentStaleValue", segment.value)}
              </option>
            )}
            {options.map((v) => (
              <option key={optionValue(v)} value={optionValue(v)}>
                {optionLabel(v, field)}
              </option>
            ))}
          </select>
        ) : (
          <input
            value={segment.value}
            maxLength={constraints?.maxLength}
            onChange={(e) => onUpdate(segment.key, e.target.value)}
            placeholder={
              field?.examples?.length
                ? tl("ui.customExample", `e.g. ${field.examples.slice(0, 3).join(", ")}...`, { examples: field.examples.slice(0, 3).join(", ") })
                : field?.placeholder ?? segment.label
            }
          />
        )}
      </div>

      <div className="builder-actions">
        <button
          type="button"
          disabled={protectedSegment}
          onClick={() => onMove(index, -1)}
          title={tl("ui.moveUp", "Move up")}
        >
          <ArrowUp size={16} strokeWidth={2.2} />
        </button>

        <button
          type="button"
          disabled={protectedSegment}
          onClick={() => onMove(index, 1)}
          title={tl("ui.moveDown", "Move down")}
        >
          <ArrowDown size={16} strokeWidth={2.2} />
        </button>

        <button
          type="button"
          disabled={protectedSegment}
          onClick={() => onRemove(segment.key)}
          title={tl("ui.removeSegment", "Remove segment")}
        >
          <X size={16} strokeWidth={2.2} />
        </button>
      </div>
    </div>
  );
}
