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
          />
          <ScoreCard namingScore={namingScore} validationResults={validationResults} segments={builderSegments} fields={activeFields} convention={selectedConvention} generatedName={generatedName} onNavigateToSegment={(name) => { const el = document.querySelector(`[data-segment="${name}"]`); if (el) el.scrollIntoView({ behavior: "smooth", block: "center" }); }} />
          <DocumentationCard markdown={markdown} jsonExport={jsonExport} />
          <ReferenceCard referenceEntries={referenceEntries} />
          <FavoritesCard favorites={favorites} onClearFavorites={clearFavorites} />
          <HistoryCard history={history} onClearHistory={clearHistory} />
        </section>
        <footer className="footer">{tl("ui.footer", "Name Codex · Microsoft 365 & Azure Naming Standards · by jmaillot")} · v{pkg.version}</footer>
        </main>
      </div>
    </>
  );
}