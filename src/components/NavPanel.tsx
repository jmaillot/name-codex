import { tl } from "../lib/i18n-utils";
import logo from "../assets/name-codex.svg";
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

export default function NavPanel({ categories, selectedCategory, categoryCounts, onSelectCategory }: NavPanelProps) {
  return (
    <aside className="nav-panel">
      <div className="brand-card">
        <img src={logo} alt="Name Codex" className="brand-logo" />
        <div className="brand-divider" />
        <div>
          <div className="brand-title">Name Codex</div>
          <div className="brand-subtitle">{tl("ui.appTagline", "Naming Governance App")}</div>
        </div>
        <div className="brand-divider" />
      </div>
      <div className="nav-section-title">{tl("ui.categories", "Categories")}</div>
      <div className="nav-list">
        {categories.map((c) => (
          <button key={c} className={`nav-item ${selectedCategory === c ? "active" : ""}`} onClick={() => onSelectCategory(c)}>
            <span className={`nav-icon ${getCategoryClass(c)}`}>{getCategoryIcon(c)}</span>
            <span className="nav-label">{c}</span>
            <span className="nav-count">{categoryCounts[c]}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}