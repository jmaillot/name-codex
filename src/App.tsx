import { useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ArrowUp, ArrowDown, X, Pin, Lock, Star } from "lucide-react";
import logo from "./assets/name-codex.svg";
import iconAzure from "./assets/icons/azure.svg";
import iconEntraId from "./assets/icons/entra-id.svg";
import iconExchange from "./assets/icons/exchange.svg";
import iconGroups from "./assets/icons/groups.svg";
import iconIntune from "./assets/icons/intune.svg";
import iconConditionalAccess from "./assets/icons/conditional-access.svg";
import iconDefender from "./assets/icons/defender.svg";
import type { NamingField, NamingFieldOption } from "./types/Rule";
import { allConventions, getGeneratorFile } from "./lib/data";
import { tl } from "./lib/i18n-utils";
import { parsePattern, patternToSegments } from "./lib/parse";
import {
  buildSegments,
  conventionDescription,
  conventionName,
  fieldByName,
  fieldTip,
  optionLabel,
  optionValue,
  optionsForSegment,
  patternName,
  valueDescription,
} from "./lib/segments";
import {
  caPolicyIdFallbackRange,
  caPolicyIdPersonaSource,
  caPolicyIdRange,
  personaRangeKeyForField,
} from "./lib/generators";
import {
  governanceScore,
  isFixedFirst,
  isFixedLast,
  isLocked,
  isRecommended,
  normalizeName,
  validateName,
} from "./lib/validation";
import type { BuilderSegment } from "./lib/segments";
import pkg from "../package.json";
import { setLanguage } from "./i18n";
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
  const { i18n } = useTranslation();
  const [history, setHistory] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [lastObjectByCategory, setLastObjectByCategory] = useState<Record<string, string>>({});
  const [builderSegments, setBuilderSegments] = useState<BuilderSegment[]>([]);
  const [customSegmentName, setCustomSegmentName] = useState("");
  const [objectSearch, setObjectSearch] = useState("");
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const showFeedback = (value: string) => {
    setActionFeedback(value);
    window.setTimeout(() => setActionFeedback(null), 2000);
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
    const storedByCategory = localStorage.getItem("name-codex-last-object-by-category-v11-6");
    const parsedByCategory = storedByCategory ? (JSON.parse(storedByCategory) as Record<string, string>) : {};
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
      localStorage.setItem("name-codex-last-object-by-category-v11-6", JSON.stringify(lastObjectByCategory));
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
    const h = localStorage.getItem("name-codex-history-v11-6");
    if (h) setHistory(JSON.parse(h));

    const f = localStorage.getItem("name-codex-favorites-v11-6");
    if (f) setFavorites(JSON.parse(f));

    const l = localStorage.getItem("name-codex-last-object-by-category-v11-6");
    if (l) setLastObjectByCategory(JSON.parse(l));

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
    await navigator.clipboard.writeText(generatedName);
    const next = [generatedName, ...history].filter((v, i, a) => a.indexOf(v) === i).slice(0, 12);
    setHistory(next);
    localStorage.setItem("name-codex-history-v11-6", JSON.stringify(next));
    showFeedback("copy");
  };

  const copyMarkdown = async () => {
    await navigator.clipboard.writeText(markdown);
    showFeedback("markdown");
  };

  const addFavorite = () => {
    if (!generatedName) return;
    const next = [generatedName, ...favorites].filter((v, i, a) => a.indexOf(v) === i).slice(0, 20);
    setFavorites(next);
    localStorage.setItem("name-codex-favorites-v11-6", JSON.stringify(next));
    showFeedback("favorite");
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("name-codex-history-v11-6");
  };

  const clearFavorites = () => {
    setFavorites([]);
    localStorage.removeItem("name-codex-favorites-v11-6");
  };

  const renderEditableSuggestions = (
    segment: BuilderSegment,
    field: NamingField,
    options: NamingFieldOption[]
  ) => {
    const availableValues = options.map(optionValue);

    const isCustomValue =
      segment.value === "" ||
      !availableValues.includes(segment.value);

    return (
      <div
        className={`custom-dropdown-editor ${
          isCustomValue ? "custom-mode" : "preset-mode"
        }`}
      >
        <select
          value={isCustomValue ? "__CUSTOM__" : segment.value}
          onChange={(e) => {
            const value = e.target.value;

            if (value === "__CUSTOM__") {
              updateSegmentValue(segment.key, "");
            } else {
              updateSegmentValue(segment.key, value);
            }
          }}
        >
          {options.map((v) => (
            <option
              key={optionValue(v)}
              value={optionValue(v)}
            >
              {optionLabel(v, field)}
            </option>
          ))}

          <option value="__CUSTOM__">
            {tl("ui.customOption", "Custom...")}
          </option>
        </select>

        <div className="custom-input-wrapper">
          <input
            value={segment.value}
            onChange={(e) =>
              updateSegmentValue(segment.key, e.target.value)
            }
            placeholder={
              isCustomValue && field.examples?.length
                ? tl("ui.customExample", `e.g. ${field.examples.slice(0, 2).join(", ")}...`, { examples: field.examples.slice(0, 2).join(", ") })
                : field.placeholder ?? segment.label
            }
            disabled={!isCustomValue}
          />
        </div>
      </div>
    );
  };

  const renderSegmentEditor = (segment: BuilderSegment, index: number) => {
    const field = fieldByName(activeFields, segment.sourceName);
    const options = optionsForSegment(field, builderSegments);

    const caRange = (() => {
      if (!field?.customOnly || !field.generator) return undefined;
      const rangeKey = personaRangeKeyForField(field, builderSegments);
      const generatorFile = getGeneratorFile(field.generator);
      if (generatorFile?.type !== "caPolicyId") return undefined;
      if (rangeKey) return caPolicyIdRange(generatorFile, rangeKey);
      return caPolicyIdFallbackRange(generatorFile);
    })();
    const caPrefix = caRange?.prefix ?? "";
    const caDigits = caRange?.digits ?? 2;
    const caDefaultNumber = caRange?.defaultNumber ?? "01";

    const fixedFirst = isFixedFirst(selectedConvention, segment.sourceName);
    const fixedLast = isFixedLast(selectedConvention, segment.sourceName);
    const locked = isLocked(selectedConvention, segment.sourceName);
    const recommended = isRecommended(selectedConvention, segment.sourceName);

    const statusClass = fixedFirst
      ? "fixed-first"
      : fixedLast
        ? "fixed-last"
        : locked
          ? "locked"
          : recommended
            ? "recommended"
            : segment.custom
              ? "custom"
              : "optional";

    const protectedSegment = locked || fixedFirst || fixedLast;

    return (
      <div
        className={`builder-row ${statusClass}`}
        key={segment.key}
      >
        <div
          className={`builder-handle ${statusClass}`}
          title={
            fixedFirst
              ? tl("ui.segFixed", "Fixed segment")
              : fixedLast
                ? tl("ui.segFixed", "Fixed segment")
                : locked
                  ? tl("ui.segLocked", "Locked segment")
                  : recommended
                    ? tl("ui.segRecommended", "Recommended segment")
                    : segment.custom
                      ? tl("ui.segCustom", "Custom segment")
                      : tl("ui.segOptional", "Optional segment")
          }
        >
          {fixedFirst ? (
            <Pin size={14} />
          ) : fixedLast ? (
            <Pin size={14} style={{ transform: "rotate(180deg)" }} />
          ) : locked ? (
            <Lock size={14} />
          ) : recommended ? (
            <Star size={14} />
          ) : (
            index + 1
          )}
        </div>

        <div className="builder-label">
          {segment.label}
          {field?.tip && <InfoIcon text={fieldTip(field, field.tip)} />}
        </div>

        <div className="builder-editor">
          {field?.multiSelect && options.length > 0 ? (
            (() => {
              const separator = field.multiSeparator ?? ".";
              const allValue = field.multiAllValue;
              const current = segment.value ? segment.value.split(separator) : [];
              const toggleMulti = (code: string) => {
                let next: string[];
                if (current.includes(code)) {
                  next = current.filter((x) => x !== code);
                } else if (allValue && code === allValue) {
                  next = [code];
                } else {
                  let base = current.filter((x) => x !== allValue);
                  const exclusionGroup = (field.multiExclusions ?? []).find((g) =>
                    g.includes(code)
                  );
                  if (exclusionGroup) {
                    base = base.filter((x) => !exclusionGroup.includes(x));
                  }
                  next = [...base, code];
                }
                updateSegmentValue(segment.key, next.join(separator));
              };
              return (
                <div className="multi-select-editor">
                  {options.map((v) => {
                    const code = optionValue(v);
                    const active = current.includes(code);
                    const description = valueDescription(field, v) || undefined;
                    return (
                      <button
                        key={code}
                        type="button"
                        className={`multi-select-chip ${active ? "active" : ""}`}
                        aria-pressed={active}
                        onClick={() => toggleMulti(code)}
                      >
                        {optionValue(v)}
                        {description ? (
                          <span className="chip-tooltip" role="tooltip">
                            {description}
                          </span>
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              );
            })()
          ) : field?.customOnly ? (
            caPrefix ? (
              <div className="policy-id-editor">
                <span className="policy-id-prefix">{caPrefix}</span>
                <input
                  inputMode="numeric"
                  value={
                    (segment.value.startsWith(caPrefix)
                      ? segment.value.slice(caPrefix.length)
                      : segment.value) || caDefaultNumber
                  }
                  onChange={(e) => {
                    const digits = e.target.value.replace(/\D/g, "").slice(0, caDigits);
                    updateSegmentValue(segment.key, caPrefix + digits);
                  }}
                  onBlur={() => {
                    const suffix = segment.value.startsWith(caPrefix)
                      ? segment.value.slice(caPrefix.length)
                      : segment.value;
                    const normalized = suffix
                      ? suffix.padStart(caDigits, "0")
                      : caDefaultNumber;
                    updateSegmentValue(segment.key, caPrefix + normalized);
                  }}
                  placeholder={caDefaultNumber}
                  aria-label={tl("ui.segmentNumber", `${segment.label} number`, { label: segment.label })}
                />
              </div>
            ) : (
              <input
                value={segment.value}
                onChange={(e) => updateSegmentValue(segment.key, e.target.value)}
                placeholder={
                  field?.examples?.length
                    ? tl("ui.customExample", `e.g. ${field.examples.slice(0, 3).join(", ")}...`, { examples: field.examples.slice(0, 3).join(", ") })
                    : field?.placeholder ?? segment.label
                }
              />
            )
          ) : field?.allowCustomValue && options.length > 0 ? (
            renderEditableSuggestions(segment, field, options)
          ) : field?.type === "dropdown" || options.length > 0 ? (
            <select
              value={segment.value}
              onChange={(e) => updateSegmentValue(segment.key, e.target.value)}
            >
              {options.map((v) => (
                <option key={optionValue(v)} value={optionValue(v)}>
                  {optionLabel(v, field)}
                </option>
              ))}
            </select>
          ) : (
            <input
              value={segment.value}
              onChange={(e) => updateSegmentValue(segment.key, e.target.value)}
              placeholder={
                field?.examples?.length
                  ? tl("ui.customExample", `e.g. ${field.examples.slice(0, 3).join(", ")}...`, { examples: field.examples.slice(0, 3).join(", ") })
                  : field?.placeholder ?? segment.label
              }
            />
          )}
        </div>

        <div className="builder-actions">
          <button
            type="button"
            disabled={protectedSegment}
            onClick={() => moveSegment(index, -1)}
            title={tl("ui.moveUp", "Move up")}
          >
            <ArrowUp size={16} strokeWidth={2.2} />
          </button>

          <button
            type="button"
            disabled={protectedSegment}
            onClick={() => moveSegment(index, 1)}
            title={tl("ui.moveDown", "Move down")}
          >
            <ArrowDown size={16} strokeWidth={2.2} />
          </button>

          <button
            type="button"
            disabled={protectedSegment}
            onClick={() => removeSegment(segment.key)}
            title={tl("ui.removeSegment", "Remove segment")}
          >
            <X size={16} strokeWidth={2.2} />
          </button>
        </div>
      </div>
    );
  };


  const categoryCounts = categories.reduce<Record<string, number>>((acc, category) => {
    acc[category] = allConventions.filter((item) => item.category === category).length;
    return acc;
  }, {});

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
              className={`lang-btn${i18n.language.startsWith(code) ? " active" : ""}`}
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
            <div className="builder-list">{builderSegments.map((s, i) => renderSegmentEditor(s, i))}</div>
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
