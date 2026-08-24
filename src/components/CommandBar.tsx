import { tl } from "../lib/i18n-utils";
import LangSwitcher from "./LangSwitcher";
import ThemeToggle from "./ThemeToggle";

/**
 * CommandBar — sticky header with the [theme][lang] control cluster
 * (Phase 09.1 LangSwitcher; Phase 12 adds ThemeToggle before it so the
 * cluster reads [theme] [EN/FR] per UI-SPEC Component Inventory).
 * Keeps configuration/menu on top of the grid.
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
      <ThemeToggle />
      <LangSwitcher language={language} onSelectLanguage={onSelectLanguage} />
    </header>
  );
}
