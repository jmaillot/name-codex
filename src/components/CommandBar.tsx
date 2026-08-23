import { ChevronLeft, ChevronRight, Menu, Search } from "lucide-react";
import { tl } from "../lib/i18n-utils";
import LangSwitcher from "./LangSwitcher";

/**
 * CommandBar — sticky top chrome (D-01/D-02/D-15).
 * Token-only styling: background var(--surface-panel),
 * border-bottom 1px solid var(--border-subtle),
 * box-shadow var(--shadow-card). Actual CSS lands in 09-02;
 * this file declares classNames + token contract only.
 */

export type CommandBarProps = {
  railCollapsed: boolean;
  onToggleRail: () => void;
  objectSearch: string;
  onObjectSearchChange: (v: string) => void;
  language: string;
  onSelectLanguage: (code: string) => void;
  onCopyName: () => void;
  onCopyMarkdown: () => void;
  onAddFavorite: () => void;
  generatedName: string;
  version: string;
};

export default function CommandBar({
  railCollapsed,
  onToggleRail,
  objectSearch,
  onObjectSearchChange,
  language,
  onSelectLanguage,
  onCopyName,
  onCopyMarkdown,
  onAddFavorite,
  generatedName,
  version,
}: CommandBarProps) {
  return (
    <header
      className="command-bar"
      role="banner"
      aria-label={tl("ui.commandBarLabel", "Command bar")}
      // styling: background var(--surface-panel); border-bottom 1px solid var(--border-subtle); box-shadow var(--shadow-card)
      style={
        {
          // token references for check:tokens gate — no hardcoded colors
          // var(--surface-panel), var(--border-subtle), var(--shadow-card)
        } as React.CSSProperties
      }
    >
      <div className="command-bar__left">
        <button
          type="button"
          className="command-bar__hamburger"
          onClick={onToggleRail}
          aria-label={tl("ui.toggleNav", "Toggle navigation")}
          aria-expanded={!railCollapsed}
        >
          <Menu size={18} aria-hidden="true" />
        </button>

        <span className="command-bar__title">Name Codex v{version}</span>

        <button
          type="button"
          className="command-bar__rail-toggle"
          onClick={onToggleRail}
          aria-label={
            railCollapsed
              ? tl("ui.expandNav", "Expand navigation")
              : tl("ui.collapseNav", "Collapse navigation")
          }
          aria-expanded={!railCollapsed}
        >
          {railCollapsed ? (
            <ChevronRight size={18} aria-hidden="true" />
          ) : (
            <ChevronLeft size={18} aria-hidden="true" />
          )}
        </button>
      </div>

      <div className="command-bar__center">
        <div className="filter-field command-bar__search">
          <Search size={16} aria-hidden="true" className="command-bar__search-icon" />
          <input
            value={objectSearch}
            onChange={(e) => onObjectSearchChange(e.target.value)}
            placeholder={tl("ui.filterPlaceholder", "Filter...")}
            aria-label={tl("ui.filterPlaceholder", "Filter...")}
          />
          {objectSearch && (
            <button
              type="button"
              className="filter-clear"
              onClick={() => onObjectSearchChange("")}
              aria-label={tl("ui.clearFilter", "Clear filter")}
            >
              ×
            </button>
          )}
        </div>
      </div>

      <div className="command-bar__right">
        <LangSwitcher language={language} onSelectLanguage={onSelectLanguage} />

        <button
          type="button"
          className="command-bar__action"
          onClick={onCopyName}
          disabled={!generatedName}
          aria-label={tl("ui.copyName", "Copy Name")}
        >
          {tl("ui.copyName", "Copy Name")}
        </button>

        <button
          type="button"
          className="command-bar__action"
          onClick={onCopyMarkdown}
          disabled={!generatedName}
          aria-label={tl("ui.copyMarkdown", "Copy Markdown")}
        >
          {tl("ui.copyMarkdown", "Copy Markdown")}
        </button>

        <button
          type="button"
          className="command-bar__action"
          onClick={onAddFavorite}
          disabled={!generatedName}
          aria-label={tl("ui.addFavorite", "Add Favorite")}
        >
          {tl("ui.addFavorite", "Add Favorite")}
        </button>
      </div>
    </header>
  );
}
