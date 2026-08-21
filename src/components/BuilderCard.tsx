import { tl } from "../lib/i18n-utils";
import type { NamingConvention, NamingField } from "../types/Rule";
import type { BuilderSegment } from "../lib/segments";
import CardTitle from "./CardTitle";
import SegmentEditor from "./SegmentEditor";

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
}: BuilderCardProps) {
  void category;
  void selectedExample;
  void generatedName;
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

      <div className="builder-list">{segments.map((s, i) => <SegmentEditor key={s.key} segment={s} index={i} convention={convention} fields={fields} segments={segments} onUpdate={onUpdateSegment} onMove={onMoveSegment} onRemove={onRemoveSegment} />)}</div>
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