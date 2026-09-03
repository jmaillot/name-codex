import { useAppState } from "./hooks/useAppState";
import { allConventions } from "./lib/data";
import { tl } from "./lib/i18n-utils";
import { setLanguage } from "./i18n";
import NavPanel from "./components/NavPanel";
import CommandBar from "./components/CommandBar";
import ConfigureCard from "./components/ConfigureCard";
import ResultCard from "./components/ResultCard";
import BuilderCard from "./components/BuilderCard";
import ScoreCard from "./components/ScoreCard";
import DocumentationCard from "./components/DocumentationCard";
import ReferenceCard from "./components/ReferenceCard";
import FavoritesCard from "./components/FavoritesCard";
import HistoryCard from "./components/HistoryCard";
import pkg from "../package.json";
import "./App.css";

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
    copyJson,
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
    reorderSegments,
    restoreSegments,
    showFeedback,
    removeSegment,
    namingScore,
    validationResults,
    markdown,
    jsonExport,
    referenceEntries,
    favorites,
    clearFavorites,
    history,
    clearHistory,
  } = useAppState();

  if (!selectedConvention) {
    return <div className="app-shell empty-state">{tl("ui.emptyRules", "No naming rules found.")}</div>;
  }

  const handleSelectConvention = (id: string) => {
    const match = allConventions.find((c) => c.id === id);
    if (match && match.category !== selectedCategory) {
      setSelectedCategory(match.category);
    }
    setSelectedConventionId(id);
  };

  return (
    <>
      <CommandBar language={language} onSelectLanguage={setLanguage} />
      <div className="app-shell">
        <NavPanel
          categories={categories}
          selectedCategory={selectedCategory}
          categoryCounts={categoryCounts}
          onSelectCategory={setSelectedCategory}
        />
        <main className="main-panel">
        <section className="workspace-stack">
          <ConfigureCard
            filteredConventions={filteredConventions}
            selectedConvention={selectedConvention}
            hasPatterns={hasPatterns}
            selectedPattern={selectedPattern}
            onSelectConvention={handleSelectConvention}
            onSelectPattern={setSelectedPatternId}
            activeDescriptionLabel={activeDescriptionLabel}
            selectedExample={selectedExample}
            generatedName={generatedName}
            objectSearch={objectSearch}
            onObjectSearchChange={setObjectSearch}
          />
          <ResultCard
            generatedName={generatedName}
            actionFeedback={actionFeedback}
            onCopyName={copyName}
            onCopyMarkdown={copyMarkdown}
            onCopyJson={copyJson}
            onAddFavorite={addFavorite}
            onResetBuilder={resetBuilder}
          />
          <BuilderCard
            category={selectedConvention.category}
            patternModified={patternModified}
            dynamicPattern={dynamicPattern}
            selectedExample={selectedExample}
            generatedName={generatedName}
            segments={builderSegments}
            fields={activeFields}
            convention={selectedConvention}
            customSegmentName={customSegmentName}
            onCustomSegmentNameChange={setCustomSegmentName}
            onAddCustomSegment={addCustomSegment}
            onUpdateSegment={updateSegmentValue}
            onMoveSegment={moveSegment}
            onRemoveSegment={removeSegment}
            onReorder={reorderSegments}
            onRestoreSegments={restoreSegments}
            onShowFeedback={showFeedback}
          />
          <ScoreCard namingScore={namingScore} validationResults={validationResults} segments={builderSegments} fields={activeFields} convention={selectedConvention} generatedName={generatedName} onNavigateToSegment={(name) => { const el = document.querySelector(`[data-segment="${name}"]`); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); }} />
          <DocumentationCard markdown={markdown} jsonExport={jsonExport} />
          <ReferenceCard referenceEntries={referenceEntries} />
          <FavoritesCard favorites={favorites} onClearFavorites={clearFavorites} />
          <HistoryCard history={history} onClearHistory={clearHistory} />
        </section>
        <footer className="footer">{tl("ui.footer", "Name Codex · Microsoft 365 & Azure Naming Standards")} · v{pkg.version} · <a href="https://github.com/jmaillot/name-codex" target="_blank" rel="noopener noreferrer" aria-label="GitHub"><svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.3 3.44 9.79 8.21 11.38.6.11.82-.26.82-.58v-2.03c-3.34.73-4.04-1.61-4.04-1.61-.55-1.39-1.33-1.76-1.33-1.76-1.09-.74.08-.73.08-.73 1.2.09 1.84 1.23 1.84 1.23 1.07 1.83 2.8 1.3 3.49.99.11-.78.42-1.3.76-1.6-2.67-.3-5.47-1.34-5.47-5.95 0-1.32.47-2.39 1.24-3.23-.12-.3-.54-1.52.12-3.17 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 016 0c2.29-1.55 3.3-1.23 3.3-1.23.66 1.65.24 2.87.12 3.17.77.84 1.23 1.91 1.23 3.23 0 4.62-2.8 5.65-5.47 5.95.43.37.81 1.1.81 2.22v3.29c0 .32.22.7.82.58C20.56 21.79 24 17.3 24 12c0-6.63-5.37-12-12-12z"/></svg></a></footer>
        </main>
      </div>
    </>
  );
}