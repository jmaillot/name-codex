import { tl } from "../lib/i18n-utils";
import LangSwitcher from "./LangSwitcher";
import ThemeToggle from "./ThemeToggle";

/**
 * CommandBar — language-only sticky header (Phase 09.1).
 * Keeps configuration/menu on top of the grid; only LangSwitcher remains.
 * Phase 12: adds the ThemeToggle pill before LangSwitcher so the cluster
 * reads [theme] [EN/FR] (UI-SPEC Component Inventory).
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
