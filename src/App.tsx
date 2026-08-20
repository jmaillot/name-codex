import { useAppState } from "./hooks/useAppState";
import { tl } from "./lib/i18n-utils";
import { setLanguage } from "./i18n";
import NavPanel from "./components/NavPanel";
import LangSwitcher from "./components/LangSwitcher";
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

  if (!selectedConvention) {
    return <div className="app-shell empty-state">{tl("ui.emptyRules", "No naming rules found.")}</div>;
  }

  return (
    <div className="app-shell">
      <NavPanel
        categories={categories}
        selectedCategory={selectedCategory}
        categoryCounts={categoryCounts}
        onSelectCategory={setSelectedCategory}
      />
      <main className="main-panel">
        <LangSwitcher language={language} onSelectLanguage={setLanguage} />
        <section className="workspace-stack">
          <ConfigureCard
            objectSearch={objectSearch}
            onObjectSearchChange={setObjectSearch}
            filteredConventions={filteredConventions}
            selectedConvention={selectedConvention}
            hasPatterns={hasPatterns}
            selectedPattern={selectedPattern}
            onSelectConvention={setSelectedConventionId}
            onSelectPattern={setSelectedPatternId}
            activeDescriptionLabel={activeDescriptionLabel}
            selectedExample={selectedExample}
            generatedName={generatedName}
          />
          <ResultCard
            generatedName={generatedName}
            actionFeedback={actionFeedback}
            onCopyName={copyName}
            onCopyMarkdown={copyMarkdown}
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
          <ScoreCard namingScore={namingScore} validationResults={validationResults} />
          <DocumentationCard markdown={markdown} />
          <ReferenceCard referenceEntries={referenceEntries} />
          <FavoritesCard favorites={favorites} onClearFavorites={clearFavorites} />
          <HistoryCard history={history} onClearHistory={clearHistory} />
        </section>
        <footer className="footer">{tl("ui.footer", "Name Codex · Microsoft 365 & Azure Naming Standards · by jmaillot")} · v{pkg.version}</footer>
      </main>
    </div>
  );
}