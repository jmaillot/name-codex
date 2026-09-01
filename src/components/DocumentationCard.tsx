import { tl } from "../lib/i18n-utils";
import CardTitle from "./CardTitle";

type DocumentationCardProps = { markdown: string; jsonExport?: string };

export default function DocumentationCard({ markdown, jsonExport }: DocumentationCardProps) {
  return (
    <>
      <details className="glass-card documentation-card">
        <summary className="azure-summary">
          <CardTitle title={tl("ui.markdownDoc", "Markdown Documentation")} info={tl("ui.markdownDocInfo", "Governance documentation generated from the current builder.")} />
          <span className="summary-chevron">⌄</span>
        </summary>
        <pre className="documentation-box">{markdown}</pre>
      </details>
      {jsonExport && (
        <details className="glass-card documentation-card">
          <summary className="azure-summary">
            <CardTitle title="JSON Policy" info={tl("ui.copyJson", "Copy JSON")} />
            <span className="summary-chevron">⌄</span>
          </summary>
          <pre className="json-export-box documentation-box" data-testid="json-export">{jsonExport}</pre>
        </details>
      )}
    </>
  );
}