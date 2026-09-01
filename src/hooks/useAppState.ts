import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { allConventions, getGeneratorFile, getSegmentFile, validationRules } from "../lib/data";
import type { SegmentConstraints } from "../types/Rule";
import { tl } from "../lib/i18n-utils";
import { parsePattern, patternToSegments } from "../lib/parse";
import { randWidth } from "../lib/macros";
import {
  assembleRawName,
  buildSegments,
  conventionDescription,
  conventionName,
  fieldByName,
  fieldLabel,
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
    // i18n.language is not referenced directly but IS required: conventionName/
    // conventionDescription resolve translations at call time via tl().
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conventionsForCategory, objectSearch, i18n.language]);

  const selectedConvention =
    filteredConventions.find((item) => item.id === selectedConventionId) ??
    filteredConventions[0] ??
    conventionsForCategory.find((item) => item.id === selectedConventionId) ??
    conventionsForCategory[0] ??
    allConventions[0];

  const hasPatterns = (selectedConvention.patterns?.length ?? 0) > 0;

  const selectedPattern =
    selectedConvention?.patterns?.find((pattern) => pattern.id === selectedPatternId) ??
    selectedConvention?.patterns?.[0];

  const activeDescription =
    selectedPattern?.description ?? selectedConvention.description;
  const activeDescriptionLabel = selectedPattern
    ? tl(`data.rule.${selectedConvention.id}.pattern.${selectedPattern.id}.description`, activeDescription)
    : tl(`data.rule.${selectedConvention.id}.description`, activeDescription);

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
  }, [selectedConvention, activeDefaultSegments, activeFields, activeFixedValues]);

  // WR-01: a language switch must only refresh segment labels, not rebuild
  // every segment from its default (which wipes user-edited values).
  useEffect(() => {
    setBuilderSegments((prev) =>
      prev.map((s) => {
        const field = fieldByName(activeFields, s.sourceName);
        return { ...s, label: fieldLabel(field, field?.label ?? s.sourceName) };
      })
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  useEffect(() => {
    const h = loadJSONArray(STORAGE_KEYS.history);
    if (h) setHistory(h);

    const f = loadJSONArray(STORAGE_KEYS.favorites);
    if (f) setFavorites(f);

    const l = loadJSONRecord(STORAGE_KEYS.lastObjectByCategory);
    if (l) setLastObjectByCategory(l);

    localStorage.removeItem("name-codex-recent-objects-v11-5");
  }, []);

  const selectedExample =
    selectedPattern?.examples?.[0] ?? selectedConvention.examples?.[0];
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

  const rawAssembled = assembleRawName(builderSegments, {
    literalPrefixes,
    patternSuffix,
    lastPatternSegment,
    separator,
    // Only force casing when explicitly configured; "preserve"/unset must
    // leave segment value casing untouched (assembleRawName no-ops then).
    caseMode:
      selectedConvention.validation?.caseMode === "lower"
        ? "lower"
        : selectedConvention.validation?.caseMode === "upper"
          ? "upper"
          : undefined,
  });

  // CR-01: validation runs on the normalized-but-UNTRUNCATED assembly so the
  // length row can actually fail and a truncated %RAND:n% macro fragment is
  // still visible to (and flagged by) the macro-expansion check. The second
  // normalizeName call below applies truncation for display/copy only.
  const validatedName = normalizeName(rawAssembled, selectedConvention, {
    truncate: false,
  });

  const generatedName = normalizeName(validatedName, selectedConvention);

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

  const validationResults = validateName(validatedName, selectedConvention, builderSegments, activeFields);
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
    `## ${tl("ui.mdScore", "Governance Score")}`,
    `${namingScore}/100`,
    "",
    `## ${tl("ui.mdValidation", "Validation")}`,
    ...validationResults.map((r) => `- ${r.valid ? tl("ui.mdOk", "OK") : tl("ui.mdWarn", "WARN")} ${r.label}`),
  ].join("\n");

  const jsonExport = JSON.stringify(
    {
      conventionId: selectedConvention.id,
      conventionName: conventionName(selectedConvention),
      pattern: activePattern,
      dynamicPattern,
      segments: builderSegments.map((s) => ({
        name: s.sourceName,
        label: s.label,
        value: s.value,
        custom: !!s.custom,
        status: isFixedFirst(selectedConvention, s.sourceName)
          ? "Fixed"
          : isFixedLast(selectedConvention, s.sourceName)
            ? "Fixed"
            : isLocked(selectedConvention, s.sourceName)
              ? "Locked"
              : isRecommended(selectedConvention, s.sourceName)
                ? "Recommended"
                : s.custom
                  ? "Custom"
                  : "Optional",
      })),
      validation: (selectedConvention.validation as unknown) ?? (validationRules as Record<string, Record<string, unknown>>)[selectedConvention.category]?.[selectedConvention.name] ?? (validationRules as Record<string, unknown>).default ?? null,
      fields: activeFields.map((f) => ({ name: f.name, label: fieldLabel(f, f.name) })),
      generatedName,
      namingScore,
      validationResults,
    },
    null,
    2,
  );

  const referenceEntries = useMemo(() => builderSegments
    .map((segment) => {
      const field = fieldByName(activeFields, segment.sourceName);
      const valuesFromField = optionsForSegment(field, builderSegments, selectedConvention);
      let entriesToShow = valuesFromField;
      if (entriesToShow.length > 100 && field?.generator) {
        entriesToShow = entriesToShow.slice(0, 100);
      }
      return {
        segment,
        entries: entriesToShow.map((value) => {
          const code = optionValue(value);
          return {
            code,
            meaning: valueDescription(field, value),
          };
        }),
      };
    })
    .filter((item) => item.entries.length > 0),
    // i18n.language drives re-memoization: valueDescription translates at call time via tl().
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [builderSegments, activeFields, selectedConvention, i18n.language]);

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

      // maxLengthBudget clamp (mirrors the caPolicyId reactive reset above):
      // when a segment referenced by some field's maxLengthBudget.dependsOn
      // changes, shrink an oversized dependent RAND macro to the largest
      // width that still fits within the convention budget. If nothing fits
      // (remaining < 1), leave the value — validation flags it instead.
      const maxLen = selectedConvention.validation?.maxLength;
      if (maxLen !== undefined) {
        const dependentFields = activeFields.filter(
          (f) => f.maxLengthBudget?.dependsOn === changed?.sourceName
        );
        if (dependentFields.length > 0) {
          const depValue =
            next.find((d) => d.sourceName === changed?.sourceName)?.value.trim() ?? "";
          const remaining = maxLen - depValue.length;
          return next.map((s) => {
            if (!dependentFields.some((f) => f.name === s.sourceName)) return s;
            const width = randWidth(s.value);
            if (width !== null && remaining >= 1 && width > remaining) {
              return { ...s, value: `%RAND:${remaining}%` };
            }
            return s;
          });
        }
      }

      // allowedValuesByField dependency: when Type changes, reset Name if stale
      // e.g. SPT Type DEPT->PRJ should switch Name HR->M365MIGRATION, CUS->"" (custom input)
      let mutated = false;
      let mutatedNext = next;
      if (changed?.sourceName) {
        for (const field of activeFields) {
          const byField = field.allowedValuesByField;
          if (!byField || !(changed.sourceName in byField)) continue;
          const depSeg = mutatedNext.find((s) => s.sourceName === field.name);
          if (!depSeg) continue;
          const newTypeVal = mutatedNext.find((s) => s.sourceName === changed.sourceName)?.value.trim() ?? "";
          const map = byField[changed.sourceName] as Record<string, string[]>;
          // case-insensitive lookup (optionsForSegment uppercases)
          let allowed: string[] | undefined;
          if (newTypeVal in map) allowed = map[newTypeVal];
          else {
            const upper = newTypeVal.toUpperCase();
            for (const [k, v] of Object.entries(map)) {
              if (k.toUpperCase() === upper) {
                allowed = v;
                break;
              }
            }
          }
          if (allowed === undefined) continue;
          const currentUpper = depSeg.value.trim().toUpperCase();
          const allowedSet = new Set(allowed.map((v) => v.toUpperCase()));
          if (allowed.length === 0) {
            if (depSeg.value !== "") {
              mutatedNext = mutatedNext.map((s) =>
                s.sourceName === field.name ? { ...s, value: "" } : s
              );
              mutated = true;
            }
          } else if (!allowedSet.has(currentUpper)) {
            const newVal = allowed[0] ?? "";
            mutatedNext = mutatedNext.map((s) =>
              s.sourceName === field.name ? { ...s, value: newVal } : s
            );
            mutated = true;
          }
        }
      }

      // Constraint maxLength clamp (Phase 19, WIRE-01) — display-only safety-net.
      // Browser maxLength attr caps keystrokes natively (SegmentEditor), this guards paste/programmatic sets.
      // Clamped value is what is stored/displayed/copied; validation still flags pre-clamp only via maxLength attr prevents over-type.
      // minLength is validate-only, never padded. Validation for constraints lives in validateName.
      const targetField = fieldByName(activeFields, changed?.sourceName ?? "") as unknown as { constraints?: SegmentConstraints; library?: string; type?: string; allowCustomValue?: boolean; customOnly?: boolean } | undefined;
      const cForClamp: SegmentConstraints | undefined =
        targetField?.constraints ??
        (targetField?.library ? (getSegmentFile(targetField.library) as unknown as { constraints?: SegmentConstraints })?.constraints : undefined);
      if (cForClamp?.maxLength !== undefined && typeof value === "string" && value.length > cForClamp.maxLength) {
        const isTextLike = targetField?.type === "text" || targetField?.allowCustomValue || targetField?.customOnly;
        if (isTextLike) {
          const clamped = value.slice(0, cForClamp.maxLength);
          const applyClamp = (arr: BuilderSegment[]) => arr.map((s) => (s.key === key ? { ...s, value: clamped } : s));
          if (mutated) return applyClamp(mutatedNext);
          return applyClamp(next);
        }
      }

      if (mutated) return mutatedNext;
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

      // WR-02: the swap would displace a locked target segment — guard it
      // symmetrically with the source-segment lock check above.
      if (isLocked(selectedConvention, targetSegment.sourceName)) {
        showFeedback("locked");
        return prev;
      }

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
        key: `${name}-custom-${prev.length}`,
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
    // WR-03: mirror copyName — only report success when the clipboard write
    // actually succeeded; surface a failure feedback key otherwise.
    const ok = await writeClipboard(markdown);
    if (ok) showFeedback("markdown");
    else showFeedback("copy-failed");
  };

  const copyJson = async () => {
    const ok = await writeClipboard(jsonExport);
    if (ok) showFeedback("json");
    else showFeedback("copy-failed");
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
    jsonExport,
    copyJson,
    referenceEntries,
    favorites,
    clearFavorites,
    history,
    clearHistory,
  };
}