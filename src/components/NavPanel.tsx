import { useEffect, useRef, useState } from "react";
import { Menu, X } from "lucide-react";
import { tl } from "../lib/i18n-utils";
import logo from "../assets/name-codex.svg";
import LangSwitcher from "./LangSwitcher";
import ThemeToggle from "./ThemeToggle";
import iconAzure from "../assets/icons/azure.svg";
import iconEntraId from "../assets/icons/entra-id.svg";
import iconExchange from "../assets/icons/exchange.svg";
import iconGroups from "../assets/icons/groups.svg";
import iconIntune from "../assets/icons/intune.svg";
import iconConditionalAccess from "../assets/icons/conditional-access.svg";
import iconDefender from "../assets/icons/defender.svg";
import iconTeams from "../assets/icons/teams.svg";
import iconSharePoint from "../assets/icons/sharepoint.svg";
import iconPowerPlatform from "../assets/icons/power-platform.svg";
import iconPurview from "../assets/icons/purview.svg";

type NavPanelProps = {
  categories: string[];
  selectedCategory: string;
  categoryCounts: Record<string, number>;
  onSelectCategory: (category: string) => void;
  language: string;
  onSelectLanguage: (code: string) => void;
};

const CATEGORY_META: Record<string, { icon: string; cls: string }> = {
  Azure: { icon: iconAzure, cls: "azure-icon" },
  "Entra ID": { icon: iconEntraId, cls: "entra-icon" },
  Exchange: { icon: iconExchange, cls: "exchange-icon" },
  Groups: { icon: iconGroups, cls: "groups-icon" },
  Intune: { icon: iconIntune, cls: "intune-icon" },
  "Conditional Access": { icon: iconConditionalAccess, cls: "ca-icon" },
  Defender: { icon: iconDefender, cls: "defender-icon" },
  "Defender for M365": { icon: iconDefender, cls: "defender-icon" },
  Teams: { icon: iconTeams, cls: "teams-icon" },
  SharePoint: { icon: iconSharePoint, cls: "sharepoint-icon" },
  "Power Platform": { icon: iconPowerPlatform, cls: "power-platform-icon" },
  Purview: { icon: iconPurview, cls: "purview-icon" },
};

function getCategoryIcon(category: string) {
  const src = CATEGORY_META[category]?.icon ?? iconAzure;
  return <img src={src} alt="" className="category-icon" />;
}

function getCategoryClass(category: string): string {
  return CATEGORY_META[category]?.cls ?? "";
}

export default function NavPanel({ categories, selectedCategory, categoryCounts, onSelectCategory, language, onSelectLanguage }: NavPanelProps) {
  // Mobile drawer (≤1100px): categories collapse behind a hamburger toggle.
  // The list expands in normal flow (no fixed positioning, so app zoom can't clip it).
  const [drawerOpen, setDrawerOpen] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const navRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!drawerOpen) return;
    navRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDrawerOpen(false);
        toggleRef.current?.focus();
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [drawerOpen]);

  const handleSelect = (c: string) => {
    onSelectCategory(c);
    setDrawerOpen(false);
  };

  return (
    <aside className={`nav-panel nav-rail${drawerOpen ? " drawer-open" : ""}`} aria-label={tl("ui.categories", "Categories")}>
      <button
        ref={toggleRef}
        type="button"
        className="drawer-toggle"
        aria-label={tl("ui.toggleNav", "Toggle navigation")}
        aria-expanded={drawerOpen}
        aria-controls="category-nav"
        onClick={() => setDrawerOpen((v) => !v)}
      >
        {drawerOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
      </button>
      <div className="rail-brand">
        <img src={logo} alt="Name Codex" className="rail-logo" />
        <div className="rail-title">Name Codex</div>
        <div className="rail-subtitle">{tl("ui.appTagline", "Naming Governance App")}</div>
      </div>
      <div className="rail-controls">
        <ThemeToggle />
        <LangSwitcher language={language} onSelectLanguage={onSelectLanguage} />
      </div>
      <nav id="category-nav" ref={navRef} tabIndex={-1} className="nav-list" aria-label={tl("ui.categories", "Categories")}>
        {categories.map((c) => {
          const active = selectedCategory === c;
          return (
            <button
              key={c}
              className={`nav-item ${active ? "active" : ""}`}
              onClick={() => handleSelect(c)}
              title={`${c} (${categoryCounts[c] ?? 0})`}
              aria-label={`${c} (${categoryCounts[c] ?? 0})`}
              aria-current={active ? "page" : undefined}
            >
              <span className={`nav-icon ${getCategoryClass(c)}`}>{getCategoryIcon(c)}</span>
              <span className="nav-label" aria-hidden="true">{c}</span>
              <span className="nav-count" aria-hidden="true">{categoryCounts[c]}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}