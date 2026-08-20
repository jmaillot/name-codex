import { useEffect, useRef, useState } from "react";
import { useAppState } from "./hooks/useAppState";
import { tl } from "./lib/i18n-utils";
import { conventionName, patternName } from "./lib/segments";
import { setLanguage } from "./i18n";
import SegmentEditor from "./components/SegmentEditor";
import logo from "./assets/name-codex.svg";
import iconAzure from "./assets/icons/azure.svg";
import iconEntraId from "./assets/icons/entra-id.svg";
import iconExchange from "./assets/icons/exchange.svg";
import iconGroups from "./assets/icons/groups.svg";
import iconIntune from "./assets/icons/intune.svg";
import iconConditionalAccess from "./assets/icons/conditional-access.svg";
import iconDefender from "./assets/icons/defender.svg";
import pkg from "../package.json";
import "./App.css";

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

    default:
      return "";
  }
}

function InfoIcon({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (e: PointerEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span
      ref={wrapperRef}
      className={`info-wrapper${open ? " open" : ""}`}
    >
      <button
        type="button"
        className="info-icon"
        aria-label={text}
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        i
      </button>
      <span className="tooltip" role="tooltip">{text}</span>
    </span>
  );
}

function CardTitle({ title, info }: { title: string; info: string }) {
  return (
    <div className="card-title-line">
      <h2>{title}</h2>
      <InfoIcon text={info} />
    </div>
  );
}

export default function App() {
  const {
    language,
    categories,
    selectedCategory,
    setSelectedCategory,
    categoryCounts,
    objectSearch,
    setObjectSearch,
    filteredConventions,
    selectedConvention,
    hasPatterns,
    activeFields,
    selectedPattern,
    setSelectedConventionId,
    setSelectedPatternId,
    activeDescriptionLabel,
    selectedExample,
    generatedName,
    actionFeedback,
    copyName,
    copyMarkdown,
    addFavorite,
    resetBuilder,
    patternModified,
    dynamicPattern,
    builderSegments,
    customSegmentName,
    setCustomSegmentName,
    addCustomSegment,
    updateSegmentValue,
    moveSegment,
    removeSegment,
    namingScore,
    validationResults,
    markdown,
    referenceEntries,
    favorites,
    clearFavorites,
    history,
    clearHistory,
  } = useAppState();

  if (!selectedConvention) return <div className="app-shell empty-state">{tl("ui.emptyRules", "No naming rules found.")}</div>;

  return (
    <div className="app-shell">
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
            <button key={c} className={`nav-item ${selectedCategory === c ? "active" : ""}`} onClick={() => setSelectedCategory(c)}>
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

      <main className="main-panel">
        <div className="lang-switcher" role="group" aria-label="Language">
          {[
            { code: "en", flag: "🇬🇧", title: "English" },
            { code: "fr", flag: "🇫🇷", title: "Français" },
          ].map(({ code, flag, title }) => (
            <button
              key={code}
              type="button"
              className={`lang-btn${language.startsWith(code) ? " active" : ""}`}
              onClick={() => setLanguage(code)}
              title={title}
              aria-label={title}
            >
              {flag}
            </button>
          ))}
        </div>
        <section className="workspace-stack">
          <div className="glass-card configure-card compact-config">
            <div className="card-header">
              <CardTitle
                title={tl("ui.configure", "Configure")}
                info={tl("ui.configureInfo", "Filter and select an object type from the current category.")}
              />
            </div>

            <div className={`compact-selector-grid ${ hasPatterns ? "has-patterns" : "no-patterns" }`}>
              <div className="field-block selector-filter">
                <label>{tl("ui.filter", "Filter")}</label>
                <div className="filter-field">
                  <input
                    value={objectSearch}
                    onChange={(e) => setObjectSearch(e.target.value)}
                    placeholder={tl("ui.filterPlaceholder", "Filter...")}
                  />

                  {objectSearch && (
                    <button
                      type="button"
                      className="filter-clear"
                      onClick={() => setObjectSearch("")}
                      aria-label={tl("ui.clearFilter", "Clear filter")}
                    >
                      ×
                    </button>
                  )}
                </div>
              </div>

              <div className="field-block selector-object">
                <label>{tl("ui.objectType", "Object Type")}</label>
                <select
                  value={selectedConvention.id}
                  onChange={(e) => setSelectedConventionId(e.target.value)}
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
                    onChange={(e) => setSelectedPatternId(e.target.value)}
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

          <div className="glass-card result-card">
            <div className="card-header">
              <CardTitle title={tl("ui.livePreview", "Live Preview")} info={tl("ui.livePreviewInfo", "Generated name preview.")} />
            </div>
            <div className="generated-name">{generatedName || tl("ui.buildPlaceholder", "Build segments to generate a name...")}</div>
            <div className="action-row">
              <button className="ghost-button" onClick={copyName}>{tl("ui.copyName", "Copy Name")}</button>
              {actionFeedback === "copy" && <span className="action-success">✓ {tl("ui.copied", "Copied")}</span>}

              <button className="ghost-button" onClick={copyMarkdown}>{tl("ui.copyMarkdown", "Copy Markdown")}</button>
              {actionFeedback === "markdown" && <span className="action-success">✓ {tl("ui.copied", "Copied")}</span>}

              <button className="ghost-button" onClick={addFavorite}>{tl("ui.addFavorite", "Add Favorite")}</button>
              {actionFeedback === "favorite" && <span className="action-success">★ {tl("ui.added", "Added")}</span>}

              <button className="ghost-button" onClick={resetBuilder}>{tl("ui.resetBuilder", "Reset Builder")}</button>
              {actionFeedback === "reset" && <span className="action-success">↺ {tl("ui.reset", "Reset")}</span>}

              {actionFeedback === "segment-added" && (
                <span className="action-success">
                  ✓ Segment added
                </span>
              )}

              {actionFeedback === "already-exists" && (
                <span className="action-success">
                  ⚠ {tl("ui.alreadyExists", "Segment already exists")}
                </span>
              )}

              {actionFeedback === "fixed-first" && (
                <span className="action-warning">
                  📌 {tl("ui.fixedFirstWarn", "This segment must remain in that position")}
                </span>
              )}

              {actionFeedback === "fixed-last" && (
                <span className="action-warning">
                  📌 {tl("ui.fixedLastWarn", "This segment must remain in last position")}
                </span>
              )}
            </div>
          </div>

          <div className="glass-card builder-card">
            <div className="card-header">
              <CardTitle
                title={selectedConvention.category === "Conditional Access Policy" ? tl("ui.caBuilder", "Conditional Access Policy Builder") : tl("ui.segmentBuilder", "Segment Builder")}
                info={tl("ui.builderInfo", "Reorder, remove, add predefined segments, or create a custom segment.")}
              />
            </div>
          <div className="pattern-box">
            <span>
              {tl("ui.pattern", "Pattern")}

              {patternModified && (
                <span className="pattern-modified">
                  {tl("ui.modified", "Modified")}
                </span>
              )}
            </span>

            <code>{dynamicPattern}</code>
          </div>


            {selectedConvention.category === "Conditional Access Policy" && (
              <div className="ca-example-inline">
                <label>{tl("ui.example", "Example")}</label>
                <div className="example-box">{selectedExample ?? generatedName ?? tl("ui.noExample", "No example defined")}</div>
              </div>
            )}
            <div className="builder-list">{builderSegments.map((s, i) => <SegmentEditor key={s.key} segment={s} index={i} convention={selectedConvention} fields={activeFields} segments={builderSegments} onUpdate={updateSegmentValue} onMove={moveSegment} onRemove={removeSegment} />)}</div>
            <div className="add-segment-row">
              <input
                value={customSegmentName}
                onChange={(e) => setCustomSegmentName(e.target.value)}
                placeholder={tl("ui.addCustomPlaceholder", "Add a custom segment...")}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                  addCustomSegment();
                  }
                }}                
                maxLength={40}
              />

              <button
                className="ghost-button"
                onClick={addCustomSegment}
                disabled={!customSegmentName.trim()}
              >
                {tl("ui.addSegment", "Add Segment")}
              </button>
            </div>
          </div>

          <details
            className="glass-card score-card"
            open={namingScore < 100 ? true : undefined}
          >
            <summary className="azure-summary">
              <CardTitle title={tl("ui.governanceScore", "Governance Score")} info={tl("ui.governanceScoreInfo", "Score based on locked segments, recommended segments, validation rules, length, and characters.")} />
              <span className="summary-actions">
                <span className="score-pill">{namingScore}/100</span>
                <span className="summary-chevron">⌄</span>
              </span>
            </summary>
            <div className="score-bar"><div style={{ width: `${namingScore}%` }} /></div>
            <ul className="check-list">
              {validationResults.map((r) => (
                <li key={r.label} className={r.valid ? "valid" : "invalid"}>
                  <span>{r.valid ? "✓" : "!"}</span>{r.label}
                </li>
              ))}
            </ul>
          </details>

          <details className="glass-card documentation-card">
            <summary className="azure-summary">
              <CardTitle title={tl("ui.markdownDoc", "Markdown Documentation")} info={tl("ui.markdownDocInfo", "Governance documentation generated from the current builder.")} />
              <span className="summary-chevron">⌄</span>
            </summary>
            <pre className="documentation-box">{markdown}</pre>
          </details>

          <details className="glass-card reference-card">
            <summary className="azure-summary">
              <CardTitle title={tl("ui.conventionRef", "Convention Reference")} info={tl("ui.conventionRefInfo", "Dictionary of values used by active segments.")} />
              <span className="summary-chevron">⌄</span>
            </summary>
            {referenceEntries.length === 0 ? (
              <p className="section-note reference-note">{tl("ui.noDictionary", "No predefined dictionary values.")}</p>
            ) : (
              <div className="reference-grid">
                {referenceEntries.map((item) => (
                  <div className="reference-group" key={item.segment.key}>
                    <h3>{item.segment.label}</h3>
                    <ul>
                      {item.entries.map((e) => (
                        <li key={`${item.segment.key}-${e.code}`}>
                          <code>{e.code}</code>
                          <span>{e.meaning}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </details>

          <details className="glass-card history-card">
            <summary className="azure-summary">
              <CardTitle title={tl("ui.favorites", "Favorites")} info={tl("ui.favoritesInfo", "Locally saved favorite generated names.")} />
              <span className="summary-actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    clearFavorites();
                  }}
                >
                  {tl("ui.clear", "Clear")}
                </button>
                <span className="summary-chevron">⌄</span>
              </span>
            </summary>
            {favorites.length === 0 ? <p className="section-note">{tl("ui.noFavorites", "No favorites yet.")}</p> : <ul>{favorites.map((item) => <li key={item}>{item}</li>)}</ul>}
          </details>

          <details className="glass-card history-card">
            <summary className="azure-summary">
              <CardTitle title={tl("ui.history", "History")} info={tl("ui.historyInfo", "Names copied recently from this browser session.")} />
              <span className="summary-actions">
                <button
                  type="button"
                  className="text-button"
                  onClick={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    clearHistory();
                  }}
                >
                  {tl("ui.clear", "Clear")}
                </button>
                <span className="summary-chevron">⌄</span>
              </span>
            </summary>
            {history.length === 0 ? <p className="section-note">{tl("ui.noHistory", "No names generated yet.")}</p> : <ul>{history.map((item) => <li key={item}>{item}</li>)}</ul>}
          </details>
        </section>
        <footer className="footer">{tl("ui.footer", "Name Codex · Microsoft 365 & Azure Naming Standards · by jmaillot")} · v{pkg.version}</footer>
      </main>
    </div>
  );
}