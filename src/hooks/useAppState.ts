import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { allConventions, getGeneratorFile } from "../lib/data";
import { tl } from "../lib/i18n-utils";
import { parsePattern, patternToSegments } from "../lib/parse";
import {
  buildSegments,
  conventionDescription,
  conventionName,
  fieldByName,
  optionValue,
  optionsForSegment,
  valueDescription,
} from "../lib/segments";
import {
  caPolicyIdPersonaSource,
  caPolicyIdRange,
  personaRangeKeyForField,
} from "../lib/generators";
import {
  governanceScore,
  isFixedFirst,
  isFixedLast,
  isLocked,
  isRecommended,
  normalizeName,
  validateName,
} from "../lib/validation";
import type { BuilderSegment } from "../lib/segments";
import { loadJSONArray, loadJSONRecord, saveJSON, STORAGE_KEYS } from "../lib/storage";

async function writeClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      textarea.setAttribute("readonly", "");
      document.body.appendChild(textarea);
      try {
        textarea.select();
        textarea.setSelectionRange(0, text.length);
        return document.execCommand("copy");
      } finally {
        textarea.remove();
      }
    } catch {
      return false;
    }
  }
}

export function useAppState() {
  const { i18n } = useTranslation();
  const [history, setHistory] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [lastObjectByCategory, setLastObjectByCategory] = useState<Record<string, string>>({});
  const [builderSegments, setBuilderSegments] = useState<BuilderSegment[]>([]);
  const [customSegmentName, setCustomSegmentName] = useState("");
  const [objectSearch, setObjectSearch] = useState("");
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const feedbackTimer = useRef<number | null>(null);

  const showFeedback = (value: string) => {
    if (feedbackTimer.current !== null) {
      window.clearTimeout(feedbackTimer.current);
    }
    setActionFeedback(value);
    feedbackTimer.current = window.setTimeout(() => {
      setActionFeedback(null);
      feedbackTimer.current = null;
    }, 2000);
  };

  const categories = useMemo(() => Array.from(new Set(allConventions.map((item) => item.category))), []);
  const [selectedCategory, setSelectedCategory] = useState(categories[0] ?? "");
  const [selectedConventionId, setSelectedConventionId] = useState(allConventions[0]?.id ?? "");
  const [selectedPatternId, setSelectedPatternId] = useState("");

  const conventionsForCategory = useMemo(
    () => allConventions.filter((item) => item.category === selectedCategory),
    [selectedCategory],
  );

  const filteredConventions = useMemo(() => {
    const query = objectSearch.trim().toLowerCase();
    if (!query) return conventionsForCategory;

    return conventionsForCategory.filter(
      (item) =>
        conventionName(item).toLowerCase().includes(query) ||
        conventionDescription(item).toLowerCase().includes(query) ||
        item.id.toLowerCase().includes(query) ||
        (item.pattern ?? "").toLowerCase().includes(query)
    );
  }, [conventionsForCategory, objectSearch, i18n.language]);

  const selectedConvention =
    conventionsForCategory.find((item) => item.id === selectedConventionId) ??
    filteredConventions[0] ??
    conventionsForCategory[0] ??
    allConventions[0];

  const hasPatterns = (selectedConvention.patterns?.length ?? 0) > 0;

  const selectedPattern =
    selectedConvention?.patterns?.find((pattern) => pattern.id === selectedPatternId) ??
    selectedConvention?.patterns?.[0];

  const activeDescription =
    selectedPattern?.description ?? selectedConvention.description;
  const activeDescriptionLabel = tl(`data.rule.${selectedConvention.id}.description`, activeDescription);

  const activeFields = useMemo(
    () =>
      selectedPattern?.fields ??
      selectedConvention.fields ??
      [],
    [selectedPattern, selectedConvention]
  );

  const activePattern = selectedPattern?.pattern ?? selectedConvention.pattern;

  const activeDefaultSegments = useMemo(
    () =>
      selectedPattern?.defaultSegments ??
      (selectedPattern
        ? patternToSegments(activePattern)
        : selectedConvention.builder?.defaultSegments ?? patternToSegments(activePattern)),
    [selectedPattern, selectedConvention, activePattern]
  );

  const activeFixedValues = useMemo(
    () => selectedPattern?.fixedValues ?? {},
    [selectedPattern]
  );

  useEffect(() => {
    const onScroll = () => {
      document.body.classList.toggle("scrolled", window.scrollY > 8);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      document.body.classList.remove("scrolled");
    };
  }, []);

  useEffect(() => {
    if (!selectedConvention?.patterns?.length) {
      setSelectedPatternId((current) =>
        current === "" ? current : ""
      );
      return;
    }

    const firstPatternId = selectedConvention.patterns[0].id;

    setSelectedPatternId((current) =>
      current === firstPatternId ? current : firstPatternId
    );
  }, [selectedConvention]);

  useEffect(() => {
    const parsedByCategory = loadJSONRecord(STORAGE_KEYS.lastObjectByCategory) ?? {};
    const lastForCategory = parsedByCategory[selectedCategory];
    const firstConvention = allConventions.find((item) => item.category === selectedCategory);
    const restoredConvention = allConventions.find((item) => item.category === selectedCategory && item.id === lastForCategory);

    setSelectedConventionId((restoredConvention ?? firstConvention)?.id ?? "");
    setObjectSearch("");
  }, [selectedCategory]);

  useEffect(() => {
    if (!selectedConvention) return;
    setLastObjectByCategory((prev) => ({
      ...prev,
      [selectedConvention.category]: selectedConvention.id,
    }));
  }, [selectedConvention]);

  useEffect(() => {
    if (lastObjectByCategory && Object.keys(lastObjectByCategory).length > 0) {
      saveJSON(STORAGE_KEYS.lastObjectByCategory, lastObjectByCategory);
    }
  }, [lastObjectByCategory]);

  useEffect(() => {
    if (!selectedConvention) return;

    setBuilderSegments(
      buildSegments(selectedConvention, {
        defaultSegments: activeDefaultSegments,
        fixedValues: activeFixedValues,
        fields: activeFields,
      })
    );
  }, [
    selectedConvention,
    activeDefaultSegments,
    activeFields,
    activeFixedValues,
    i18n.language,
  ]);

  useEffect(() => {
    const h = loadJSONArray(STORAGE_KEYS.history);
    if (h) setHistory(h);

    const f = loadJSONArray(STORAGE_KEYS.favorites);
    if (f) setFavorites(f);

    const l = loadJSONRecord(STORAGE_KEYS.lastObjectByCategory);
    if (l) setLastObjectByCategory(l);

    localStorage.removeItem("name-codex-recent-objects-v11-5");
  }, []);

  const selectedPolicyId = builderSegments.find((segment) => segment.sourceName === "PolicyId")?.value;
  const selectedExample =
    selectedPolicyId && selectedConvention.policyExamples?.[selectedPolicyId]
      ? selectedConvention.policyExamples[selectedPolicyId]
      : selectedPattern?.examples?.[0] ??
        selectedConvention.examples?.[0];
  const separator = selectedConvention.builder?.separator ?? "-";

  const patternTokens = parsePattern(activePattern);
  const literalPrefixes = new Map<string, string>();
  const patternSegmentOrder: string[] = [];
  let pendingLiteral = "";
  for (const token of patternTokens) {
    if (token.type === "literal") {
      pendingLiteral += token.value;
    } else {
      literalPrefixes.set(token.value, pendingLiteral);
      patternSegmentOrder.push(token.value);
      pendingLiteral = "";
    }
  }
  const patternSuffix = pendingLiteral;
  const lastPatternSegment = patternSegmentOrder[patternSegmentOrder.length - 1];

  const rawName = normalizeName(
    patternTokens
      .map((token) => {
        if (token.type === "literal") return token.value;
        const seg = builderSegments.find((s) => s.sourceName === token.value);
        return seg?.value.trim().toUpperCase() ?? "";
      })
      .join("")
      .replace(/^[-.\s]+/, "")
      .replace(/[-.\s]+$/, "")
      .replace(/([-.\s])\1+/g, "$1"),
    selectedConvention
  );

  const generatedName = normalizeName(rawName, selectedConvention);

  const dynamicPattern = builderSegments
    .map((segment, index) => {
      const prefix = literalPrefixes.get(segment.sourceName) ?? separator;
      const suffix =
        index === builderSegments.length - 1 &&
        segment.sourceName === lastPatternSegment
          ? patternSuffix
          : "";
      return `${prefix}[${segment.sourceName}]${suffix}`;
    })
    .join("");

  const patternModified = dynamicPattern !== activePattern;

  const validationResults = validateName(generatedName, selectedConvention, builderSegments);
  const namingScore = governanceScore(validationResults);

  const markdown = [
    `# ${conventionName(selectedConvention)}`,
    "",
    `## ${tl("ui.mdGeneratedName", "Generated name")}`,
    generatedName || tl("ui.mdNotGenerated", "Not generated"),
    "",
    `## ${tl("ui.mdPattern", "Pattern")}`,
    activePattern,
    "",
    `## ${tl("ui.mdExample", "Example")}`,
    selectedExample ?? tl("ui.mdNoExample", "No example defined"),
    "",
    `## ${tl("ui.mdSegments", "Segments")}`,
    `| ${tl("ui.mdSegmentCol", "Segment")} | ${tl("ui.mdValueCol", "Value")} | ${tl("ui.mdStatusCol", "Status")} |`,
    "|---|---|---|",
    ...builderSegments.map(
      (s) =>
        `| ${s.label} | ${s.value || tl("ui.mdEmpty", "<empty>")} | ${
          isFixedFirst(selectedConvention, s.sourceName)
            ? tl("ui.mdFixed", "Fixed")
            : isFixedLast(selectedConvention, s.sourceName)
              ? tl("ui.mdFixed", "Fixed")
              : isLocked(selectedConvention, s.sourceName)
                ? tl("ui.mdLocked", "Locked")
                : isRecommended(selectedConvention, s.sourceName)
                  ? tl("ui.mdRecommended", "Recommended")
                  : s.custom
                    ? tl("ui.mdCustom", "Custom")
                    : tl("ui.mdOptional", "Optional")
        } |`,
    ),
    "",
    `## ${tl("ui.mdValidation", "Validation")}`,
    ...validationResults.map((r) => `- ${r.valid ? tl("ui.mdOk", "OK") : tl("ui.mdWarn", "WARN")} ${r.label}`),
  ].join("\n");

  const referenceEntries = builderSegments
    .map((segment) => {
      const field = fieldByName(activeFields, segment.sourceName);
      const valuesFromField = optionsForSegment(field, builderSegments);
      return {
        segment,
        entries: valuesFromField.map((value) => {
          const code = optionValue(value);
          return {
            code,
            meaning: valueDescription(field, value),
          };
        }),
      };
    })
    .filter((item) => item.entries.length > 0);

  const updateSegmentValue = (key: string, value: string) =>
    setBuilderSegments((prev) => {
      const changed = prev.find((s) => s.key === key);
      const next = prev.map((s) => (s.key === key ? { ...s, value } : s));
      const policyField = fieldByName(activeFields, "PolicyId");
      const policy = next.find((s) => s.sourceName === "PolicyId");

      if (policy && changed?.sourceName === caPolicyIdPersonaSource(policyField)) {
        if (policy) {
          const rangeKey = personaRangeKeyForField(policyField, next);
          const generatorFile = policyField?.generator ? getGeneratorFile(policyField.generator) : undefined;
          const range = rangeKey && generatorFile && generatorFile.type === "caPolicyId"
            ? caPolicyIdRange(generatorFile, rangeKey)
            : undefined;

          if (range && !policy.value.startsWith(range.prefix)) {
            return next.map((s) =>
              s.key === policy.key
                ? { ...s, value: `${range.prefix}${range.defaultNumber ?? ""}` }
                : s
            );
          }
        }
      }

      return next;
    });

  const moveSegment = (index: number, direction: -1 | 1) =>
    setBuilderSegments((prev) => {
      const current = prev[index];

      if (isFixedFirst(selectedConvention, current.sourceName)) {
        showFeedback("fixed-first");
        return prev;
      }

      if (isFixedLast(selectedConvention, current.sourceName)) {
        showFeedback("fixed-last");
        return prev;
      }

      if (isLocked(selectedConvention, current.sourceName)) {
        return prev;
      }

      const target = index + direction;

      if (target < 0 || target >= prev.length) {
        return prev;
      }

      const targetSegment = prev[target];

      if (
        direction === -1 &&
        isFixedFirst(selectedConvention, targetSegment.sourceName)
      ) {
        showFeedback("fixed-first");
        return prev;
      }

      if (
        direction === 1 &&
        isFixedLast(selectedConvention, targetSegment.sourceName)
      ) {
        showFeedback("fixed-last");
        return prev;
      }

      const next = [...prev];

      [next[index], next[target]] = [
        next[target],
        next[index],
      ];

      return next;
    });

  const removeSegment = (key: string) =>
    setBuilderSegments((prev) =>
      prev.filter((s) => {
        if (s.key !== key) return true;

        return (
          isLocked(selectedConvention, s.sourceName) ||
          isFixedFirst(selectedConvention, s.sourceName) ||
          isFixedLast(selectedConvention, s.sourceName)
        );
      })
    );

  const addCustomSegment = () => {
    const name = customSegmentName.trim();
    if (!name) return;
    const exists = builderSegments.some(
      (s) => s.sourceName.toLowerCase() === name.toLowerCase()
    );
    if (exists) {
      showFeedback("already-exists");
      return;
    }
    setBuilderSegments((prev) => {
      const newSegment: BuilderSegment = {
        key: `${name}-${Date.now()}-${prev.length}`,
        sourceName: name,
        label: name,
        value: "",
        custom: true,
      };
      const fixedLastIndex = prev.findIndex((segment) =>
        isFixedLast(selectedConvention, segment.sourceName)
      );
      if (fixedLastIndex === -1) {
        return [...prev, newSegment];
      }
      const next = [...prev];
      next.splice(fixedLastIndex, 0, newSegment);
      return next;
    });

    setCustomSegmentName("");
    showFeedback("segment-added");
  };

  const resetBuilder = () => {
    setBuilderSegments(
      buildSegments(selectedConvention, {
        defaultSegments: activeDefaultSegments,
        fixedValues: activeFixedValues,
        fields: activeFields,
      })
    );
    showFeedback("reset");
  };

  const copyName = async () => {
    if (!generatedName) return;
    const ok = await writeClipboard(generatedName);
    if (ok) {
      const next = [generatedName, ...history].filter((v, i, a) => a.indexOf(v) === i).slice(0, 12);
      setHistory(next);
      saveJSON(STORAGE_KEYS.history, next);
      showFeedback("copy");
    }
  };

  const copyMarkdown = async () => {
    await writeClipboard(markdown);
    showFeedback("markdown");
  };

  const addFavorite = () => {
    if (!generatedName) return;
    const next = [generatedName, ...favorites].filter((v, i, a) => a.indexOf(v) === i).slice(0, 20);
    setFavorites(next);
    saveJSON(STORAGE_KEYS.favorites, next);
    showFeedback("favorite");
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem(STORAGE_KEYS.history);
  };

  const clearFavorites = () => {
    setFavorites([]);
    localStorage.removeItem(STORAGE_KEYS.favorites);
  };

  const categoryCounts = categories.reduce<Record<string, number>>((acc, category) => {
    acc[category] = allConventions.filter((item) => item.category === category).length;
    return acc;
  }, {});

  return {
    language: i18n.language,
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
  };
}