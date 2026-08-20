import { tl } from "../lib/i18n-utils";
import type { ValidationResult } from "../lib/validation";
import CardTitle from "./CardTitle";

type ScoreCardProps = {
  namingScore: number;
  validationResults: ValidationResult[];
};

export default function ScoreCard({ namingScore, validationResults }: ScoreCardProps) {
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
        {validationResults.map((r) => (
          <li key={r.label} className={r.valid ? "valid" : "invalid"}>
            <span>{r.valid ? "✓" : "!"}</span>{r.label}
          </li>
        ))}
      </ul>
    </details>
  );
}