import { tl } from "../lib/i18n-utils";
import LangSwitcher from "./LangSwitcher";

/**
 * CommandBar — language-only sticky header (Phase 09.1).
 * Keeps configuration/menu on top of the grid; only LangSwitcher remains.
 * Token-only styling: background var(--surface-panel), border var(--border-subtle).
 */

export type CommandBarProps = {
  language: string;
  onSelectLanguage: (code: string) => void;
};

export default function CommandBar({ language, onSelectLanguage }: CommandBarProps) {
  return (
    <header
      className="command-bar command-bar--lang-only"
      role="banner"
      aria-label={tl("ui.commandBarLabel", "Command bar")}
    >
      <LangSwitcher language={language} onSelectLanguage={onSelectLanguage} />
    </header>
  );
}
