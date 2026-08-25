import { tl } from "../lib/i18n-utils";
import CardTitle from "./CardTitle";

type ResultCardProps = {
  generatedName: string;
  actionFeedback: string | null;
  onCopyName: () => void;
  onCopyMarkdown: () => void;
  onAddFavorite: () => void;
  onResetBuilder: () => void;
};

export default function ResultCard({ generatedName, actionFeedback, onCopyName, onCopyMarkdown, onAddFavorite, onResetBuilder }: ResultCardProps) {
  return (
    <div className="glass-card result-card">
      <div className="card-header">
        <CardTitle title={tl("ui.livePreview", "Live Preview")} info={tl("ui.livePreviewInfo", "Generated name preview.")} />
      </div>
      <div className="generated-name">{generatedName || tl("ui.buildPlaceholder", "Build segments to generate a name...")}</div>
      <div className="action-row">
        <button className="ghost-button" onClick={onCopyName}>{tl("ui.copyName", "Copy Name")}</button>
        {actionFeedback === "copy" && <span className="action-success">{tl("ui.copied", "✓ Copied")}</span>}

        <button className="ghost-button" onClick={onCopyMarkdown}>{tl("ui.copyMarkdown", "Copy Markdown")}</button>
        {actionFeedback === "markdown" && <span className="action-success">{tl("ui.copied", "✓ Copied")}</span>}
        {actionFeedback === "copy-failed" && (
          <span className="action-warning">{tl("ui.copyFailed", "⚠ Copy failed — clipboard unavailable")}</span>
        )}

        <button className="ghost-button" onClick={onAddFavorite}>{tl("ui.addFavorite", "Add Favorite")}</button>
        {actionFeedback === "favorite" && <span className="action-success">{tl("ui.added", "★ Added")}</span>}

        <button className="ghost-button" onClick={onResetBuilder}>{tl("ui.resetBuilder", "Reset Builder")}</button>
        {actionFeedback === "reset" && <span className="action-success">{tl("ui.reset", "↺ Reset")}</span>}

        {actionFeedback === "segment-added" && (
          <span className="action-success">{tl("ui.segmentAdded", "✓ Segment added")}</span>
        )}

        {actionFeedback === "already-exists" && (
          <span className="action-success">{tl("ui.alreadyExists", "⚠ Segment already exists")}</span>
        )}

        {actionFeedback === "fixed-first" && (
          <span className="action-warning">{tl("ui.fixedFirstWarn", "📌 This segment must remain in that position")}</span>
        )}

        {actionFeedback === "fixed-last" && (
          <span className="action-warning">{tl("ui.fixedLastWarn", "📌 This segment must remain in last position")}</span>
        )}

        {actionFeedback === "locked" && (
          <span className="action-warning">{tl("ui.lockedWarn", "🔒 This segment is locked and cannot be moved")}</span>
        )}
      </div>
    </div>
  );
}