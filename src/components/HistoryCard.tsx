import { tl } from "../lib/i18n-utils";
import CardTitle from "./CardTitle";

type HistoryCardProps = { history: string[]; onClearHistory: () => void };

export default function HistoryCard({ history, onClearHistory }: HistoryCardProps) {
  return (
    <details className="glass-card history-card">
      <summary className="azure-summary">
        <CardTitle title={tl("ui.history", "History")} info={tl("ui.historyInfo", "Names copied recently from this browser session.")} />
        <span className="summary-actions">
          <button
            type="button"
            className="text-button"
            onClick={(e) => {
              e.stopPropagation();
              e.preventDefault();
              onClearHistory();
            }}
          >
            {tl("ui.clear", "Clear")}
          </button>
          <span className="summary-chevron">⌄</span>
        </span>
      </summary>
      {history.length === 0 ? <p className="section-note">{tl("ui.noHistory", "No names generated yet.")}</p> : <ul>{history.map((item) => <li key={item}>{item}</li>)}</ul>}
    </details>
  );
}