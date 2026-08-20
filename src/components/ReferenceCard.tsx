import { tl } from "../lib/i18n-utils";
import type { BuilderSegment } from "../lib/segments";
import CardTitle from "./CardTitle";

type ReferenceEntry = {
  segment: BuilderSegment;
  entries: { code: string; meaning: string }[];
};

type ReferenceCardProps = {
  referenceEntries: ReferenceEntry[];
};

export default function ReferenceCard({ referenceEntries }: ReferenceCardProps) {
  return (
    <details className="glass-card reference-card">
      <summary className="azure-summary">
        <CardTitle title={tl("ui.conventionRef", "Convention Reference")} info={tl("ui.conventionRefInfo", "Dictionary of values used by active segments.")} />
        <span className="summary-chevron">⌄</span>
      </summary>
      {referenceEntries.length === 0 ? (
        <p className="section-note reference-note">{tl("ui.noDictionary", "No predefined dictionary values.")}</p>
      ) : (
        <div className="reference-grid">
          {referenceEntries.map((item) => (
            <div className="reference-group" key={item.segment.key}>
              <h3>{item.segment.label}</h3>
              <ul>
                {item.entries.map((e) => (
                  <li key={`${item.segment.key}-${e.code}`}>
                    <code>{e.code}</code>
                    <span>{e.meaning}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </details>
  );
}