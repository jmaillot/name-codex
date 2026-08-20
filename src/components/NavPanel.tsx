import { tl } from "../lib/i18n-utils";
import logo from "../assets/name-codex.svg";
import iconAzure from "../assets/icons/azure.svg";
import iconEntraId from "../assets/icons/entra-id.svg";
import iconExchange from "../assets/icons/exchange.svg";
import iconGroups from "../assets/icons/groups.svg";
import iconIntune from "../assets/icons/intune.svg";
import iconConditionalAccess from "../assets/icons/conditional-access.svg";
import iconDefender from "../assets/icons/defender.svg";

type NavPanelProps = {
  categories: string[];
  selectedCategory: string;
  categoryCounts: Record<string, number>;
  onSelectCategory: (category: string) => void;
};

function getCategoryIcon(category: string) {
  const icons: Record<string, string> = {
    Azure: iconAzure,
    "Entra ID": iconEntraId,
    Exchange: iconExchange,
    Groups: iconGroups,
    Intune: iconIntune,
    "Conditional Access": iconConditionalAccess,
    "Conditional Access Policy": iconConditionalAccess,
    Defender: iconDefender,
    "Defender for M365": iconDefender,
  };
  const src = icons[category] ?? iconAzure;
  return <img src={src} alt="" className="category-icon" />;
}

function getCategoryClass(category: string): string {
  switch (category) {
    case "Azure":
      return "azure-icon";

    case "Entra ID":
      return "entra-icon";

    case "Exchange":
      return "exchange-icon";

    case "Groups":
      return "groups-icon";

    case "Intune":
      return "intune-icon";

    case "Conditional Access":
    case "Conditional Access Policy":
      return "ca-icon";

    case "Defender":
    case "Defender for M365":
      return "defender-icon";

    default:
      return "";
  }
}

export default function NavPanel({ categories, selectedCategory, categoryCounts, onSelectCategory }: NavPanelProps) {
  return (
    <aside className="nav-panel">
      <div className="brand-card">
        <img src={logo} alt="Name Codex" />
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
            <span
              className={`nav-icon ${getCategoryClass(c)}`}
            >
              {getCategoryIcon(c)}
            </span>
            <span className="nav-label">{c}</span>
            <span className="nav-count">{categoryCounts[c]}</span>
          </button>
        ))}
      </div>
    </aside>
  );
}