import { Search } from "lucide-react";
import { tl } from "../lib/i18n-utils";
import { conventionName, patternName } from "../lib/segments";
import type { NamingConvention, NamingPatternOption } from "../types/Rule";
import CardTitle from "./CardTitle";

type ConfigureCardProps = {
  filteredConventions: NamingConvention[];
  selectedConvention: NamingConvention;
  hasPatterns: boolean;
  selectedPattern?: NamingPatternOption;
  onSelectConvention: (id: string) => void;
  onSelectPattern: (id: string) => void;
  activeDescriptionLabel: string;
  selectedExample?: string;
  generatedName: string;
  objectSearch?: string;
  onObjectSearchChange?: (v: string) => void;
};

export default function ConfigureCard({
  filteredConventions,
  selectedConvention,
  hasPatterns,
  selectedPattern,
  onSelectConvention,
  onSelectPattern,
  activeDescriptionLabel,
  selectedExample,
  generatedName,
  objectSearch = "",
  onObjectSearchChange,
}: ConfigureCardProps) {
  return (
    <div className="glass-card configure-card compact-config">
      <div className="card-header">
        <CardTitle
          title={tl("ui.configure", "Configure")}
          info={tl("ui.configureInfo", "Filter and select an object type from the current category.")}
        />
      </div>

      {onObjectSearchChange && (
        <div className="filter-field configure-filter">
          <Search size={14} aria-hidden="true" className="configure-filter__icon" />
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
      )}

      {filteredConventions.length === 0 && objectSearch.trim().length > 0 && (
        <div className="filter-empty" role="status" aria-live="polite">
          {tl("ui.noSearchResults", "No conventions match your search.")}
        </div>
      )}

      <div className={`compact-selector-grid ${ hasPatterns ? "has-patterns" : "no-patterns" }`}>
        <div className="field-block selector-object">
          <label>{tl("ui.objectType", "Object Type")}</label>
          <select
            value={selectedConvention.id}
            onChange={(e) => onSelectConvention(e.target.value)}
          >
            {filteredConventions.map((c) => (
              <option key={c.id} value={c.id}>
                {conventionName(c)}
              </option>
            ))}
          </select>
        </div>

        {hasPatterns && (
          <div className="field-block selector-pattern">
            <label>{tl("ui.pattern", "Pattern")}</label>

            <select
              value={selectedPattern?.id ?? ""}
              onChange={(e) => onSelectPattern(e.target.value)}
            >
              {selectedConvention.patterns!.map((pattern) => (
                <option key={pattern.id} value={pattern.id}>
                  {patternName(selectedConvention, pattern)}
                </option>
              ))}
            </select>
          </div>
        )}

        <div className="selector-meta">
          <div className="selector-description">
            <span>{tl("ui.description", "Description:")}</span>
            {activeDescriptionLabel}
          </div>

          <div className="selector-example">
            <span>{tl("ui.example", "Example:")}</span>
            {selectedExample ?? selectedConvention.examples?.[0] ?? generatedName ?? tl("ui.noExample", "No example defined")}
          </div>
        </div>
      </div>
    </div>
  );
}