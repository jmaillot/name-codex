import { tl } from "../lib/i18n-utils";
import CardTitle from "./CardTitle";

type DocumentationCardProps = { markdown: string };

export default function DocumentationCard({ markdown }: DocumentationCardProps) {
  return (
    <details className="glass-card documentation-card">
      <summary className="azure-summary">
        <CardTitle title={tl("ui.markdownDoc", "Markdown Documentation")} info={tl("ui.markdownDocInfo", "Governance documentation generated from the current builder.")} />
        <span className="summary-chevron">⌄</span>
      </summary>
      <pre className="documentation-box">{markdown}</pre>
    </details>
  );
}