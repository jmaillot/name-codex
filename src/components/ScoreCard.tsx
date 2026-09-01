import { tl } from "../lib/i18n-utils";
import type { ValidationResult } from "../lib/validation";
import { getValidationHint } from "../lib/validation";
import type { BuilderSegment } from "../lib/segments";
import type { NamingConvention, NamingField } from "../types/Rule";
import CardTitle from "./CardTitle";

type ScoreCardProps = {
  namingScore: number;
  validationResults: ValidationResult[];
  segments?: BuilderSegment[];
  fields?: NamingField[];
  convention?: NamingConvention;
  generatedName?: string;
  onNavigateToSegment?: (name: string) => void;
};

export default function ScoreCard({ namingScore, validationResults, segments, fields, convention, generatedName, onNavigateToSegment }: ScoreCardProps) {
  return (
    <details
      className="glass-card score-card"
      open={namingScore < 100 ? true : undefined}
    >
      <summary className="azure-summary">
        <CardTitle title={tl("ui.governanceScore", "Governance Score")} info={tl("ui.governanceScoreInfo", "Score based on locked segments, recommended segments, validation rules, length, and characters.")} />
        <span className="summary-actions">
          <span className="score-pill">{namingScore}/100</span>
          <span className="summary-chevron">⌄</span>
        </span>
      </summary>
      <div className="score-bar"><div style={{ width: `${namingScore}%` }} /></div>
      <ul className="check-list">
        {validationResults.map((r) => {
          const hint = !r.valid ? getValidationHint(r, { segments: segments ?? [], fields: fields ?? [], convention: convention as NamingConvention, generatedName: generatedName ?? "" }) : null;
          const segName = r.label.match(/Segment (\w+)/)?.[1] ?? r.label.match(/:\s*(\w+)/)?.[1];
          const hasHint = !!hint;
          return (
            <li key={r.label} className={`${r.valid ? "valid" : "invalid"}${hasHint ? " has-hint" : ""}`}>
              <span>{r.valid ? "✓" : "!"}</span>{r.label}
              {hint && (
                <span
                  className={`validation-hint${segName ? " hint-clickable" : ""}`}
                  onClick={() => {
                    if (!segName) return;
                    if (onNavigateToSegment) onNavigateToSegment(segName);
                    else document.querySelector(`[data-segment="${segName}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                  }}
                  role={segName ? "button" : undefined}
                  tabIndex={segName ? 0 : undefined}
                  onKeyDown={(e) => {
                    if (!segName) return;
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault();
                      if (onNavigateToSegment) onNavigateToSegment(segName);
                      else document.querySelector(`[data-segment="${segName}"]`)?.scrollIntoView({ behavior: "smooth", block: "center" });
                    }
                  }}
                >
                  {hint}
                </span>
              )}
            </li>
          );
        })}
      </ul>
    </details>
  );
}