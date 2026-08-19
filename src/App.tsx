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
import type { DropdownValue, NamingConvention, NamingField, NamingFieldOption } from "./types/Rule";
import segmentCatalogData from "./data/segment-catalog.json";
import validationRulesData from "./data/validation-rules.json";
import caNumberingRangesData from "./data/ca-numbering-ranges.json";
import pkg from "../package.json";
import i18n, { setLanguage } from "./i18n";
import "./App.css";

function tl(key: string, fallback: string, vars?: Record<string, string | number>): string {
  return i18n.t(key, { defaultValue: fallback, ...vars });
}

type SegmentValue = {
  value: string;
  description?: string;
};

type SegmentFile = {
  name: string;
  values?: SegmentValue[];
};

type SequenceGenerator = {
  name: string;
  type: "sequence";
  start: number;
  end: number;
  padding?: number;
  descriptionPrefix?: string;
};

type CaPolicyRange = {
  label: string;
  prefix: string;
  digits: number;
  defaultNumber?: string;
  min: number;
  max: number;
};

type CaPolicyIdGenerator = {
  name: string;
  type: "caPolicyId";
  ranges?: Record<string, CaPolicyRange>;
  personaRanges?: Record<string, string>;
  personaSource?: string;
  prefix?: string;
  digits?: number;
  defaultNumber?: string;
};

type SegmentGenerator = SequenceGenerator | CaPolicyIdGenerator;

type BuilderSegment = { key: string; sourceName: string; label: string; value: string; custom?: boolean };
type ValidationResult = { label: string; valid: boolean };

const segmentCatalog = segmentCatalogData as NamingField[];
const validationRules = validationRulesData as any;
const caNumberingRanges = caNumberingRangesData as Record<string, CaPolicyRange>;

const segmentModules = import.meta.glob("./data/segments/**/*.json", {
  eager: true,
  import: "default",
}) as Record<string, SegmentFile>;

const generatorModules = import.meta.glob("./data/generators/*.json", {
  eager: true,
  import: "default",
}) as Record<string, SegmentGenerator>;

function moduleKeyFromName(name: string): string {
  return name.trim().toLowerCase();
}

function getSegmentFile(libraryName: string): SegmentFile | undefined {
  const key = moduleKeyFromName(libraryName);

  const entry = Object.entries(segmentModules).find(([path]) =>
    path.toLowerCase().endsWith(`/segments/${key}.json`) ||
    path.toLowerCase().endsWith(`segments/${key}.json`)
  );

  return entry?.[1];
}

function getGeneratorFile(generatorName: string): SegmentGenerator | undefined {
  const key = moduleKeyFromName(generatorName);

  const entry = Object.entries(generatorModules).find(([path]) =>
    path.toLowerCase().endsWith(`/generators/${key}.json`) ||
    path.toLowerCase().endsWith(`generators/${key}.json`)
  );

  return entry?.[1];
}

function normalizeSegmentValues(values: SegmentValue[] = []): NamingFieldOption[] {
  return values.map((item) => ({
    value: item.value,
    description: item.description ?? "",
  }));
}

function generateSequence(generator: SequenceGenerator): NamingFieldOption[] {
  const padding = generator.padding ?? 0;

  return Array.from(
    { length: generator.end - generator.start + 1 },
    (_, index) => {
      const number = generator.start + index;
      const value = String(number).padStart(padding, "0");

      return {
        value,
        description: `${generator.descriptionPrefix ?? ""}${value}`.trim(),
      };
    }
  );
}

function generateCaPolicyIds(generator: CaPolicyIdGenerator): NamingFieldOption[] {
  const ranges = generator.ranges ?? caNumberingRanges;

  return Object.values(ranges).flatMap((range) =>
    Array.from(
      { length: range.max - range.min + 1 },
      (_, index) => {
        const number = range.min + index;
        const suffix = String(number).padStart(range.digits, "0");
        const value = `${range.prefix}${suffix}`;

        return {
          value,
          description: tl(`data.caRange.${range.label}`, range.label),
        };
      }
    )
  );
}

function generateValues(generator: SegmentGenerator): NamingFieldOption[] {
  if (generator.type === "sequence") {
    return generateSequence(generator);
  }

  if (generator.type === "caPolicyId") {
    return generateCaPolicyIds(generator);
  }

  return [];
}

function caPolicyIdRange(
  generator: CaPolicyIdGenerator,
  rangeKey: string
): CaPolicyRange | undefined {
  return (generator.ranges ?? caNumberingRanges)[rangeKey];
}

function caPolicyIdFallbackRange(
  generator: CaPolicyIdGenerator
): CaPolicyRange | undefined {
  if (!generator.prefix) return undefined;
  const digits = generator.digits ?? 3;
  return {
    label: generator.name ?? generator.prefix,
    prefix: generator.prefix,
    digits,
    defaultNumber: generator.defaultNumber ?? "001",
    min: 0,
    max: Math.pow(10, digits) - 1,
  };
}

function caPolicyIdOptionsForRange(
  generator: CaPolicyIdGenerator,
  rangeKey: string
): NamingFieldOption[] {
  const range = caPolicyIdRange(generator, rangeKey);
  if (!range) return [];

  return Array.from({ length: range.max - range.min + 1 }, (_, index) => {
    const number = range.min + index;
    const value = `${range.prefix}${String(number).padStart(range.digits, "0")}`;
    return { value, description: tl(`data.caRange.${range.label}`, range.label) };
  });
}

function caPolicyIdPersonaSource(field: NamingField | undefined): string {
  if (!field?.generator) return "Persona";

  const generatorFile = getGeneratorFile(field.generator);
  return generatorFile?.type === "caPolicyId"
    ? generatorFile.personaSource ?? "Persona"
    : "Persona";
}

function personaRangeKeyForField(
  field: NamingField | undefined,
  segments: BuilderSegment[]
): string | undefined {
  if (!field?.generator) return undefined;

  const generatorFile = getGeneratorFile(field.generator);
  if (generatorFile?.type !== "caPolicyId") return undefined;

  const personaName = caPolicyIdPersonaSource(field);
  const persona = segments.find((s) => s.sourceName === personaName)?.value;
  if (!persona) return undefined;

  const personaKey = persona.trim().toUpperCase();
  return generatorFile.personaRanges?.[personaKey];
}

function optionsForSegment(
  field: NamingField | undefined,
  segments: BuilderSegment[]
): NamingFieldOption[] {
  const options = valuesForField(field);

  const byField = field?.allowedValuesByField;
  if (byField) {
    for (const [depName, valueMap] of Object.entries(byField)) {
      const depValue = segments.find((s) => s.sourceName === depName)?.value;
      if (!depValue) continue;
      const key = depValue.trim().toUpperCase();
      const allowed = valueMap[key];
      if (!allowed) continue;
      const allowedSet = new Set(allowed.map((v) => v.toUpperCase()));
      return options.filter((o) => allowedSet.has(optionValue(o).toUpperCase()));
    }
  }

  const rangeKey = personaRangeKeyForField(field, segments);
  if (!rangeKey) return options;

  const generatorFile = field?.generator ? getGeneratorFile(field.generator) : undefined;
  if (!generatorFile || generatorFile.type !== "caPolicyId") return options;

  return caPolicyIdOptionsForRange(generatorFile, rangeKey);
}


const ruleModules = import.meta.glob("./rules/**/*.json", {
  eager: true,
  import: "default",
}) as Record<string, NamingConvention>;

const allConventions = Object.entries(ruleModules)
  .map(([path, convention]) => ({ ...convention, sourcePath: path }))
  .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

function isDropdownValue(value: NamingFieldOption): value is DropdownValue {
  return typeof value === "object" && value !== null && "value" in value;
}

function optionValue(value: NamingFieldOption): string {
  return isDropdownValue(value) ? value.value : value;
}

function optionLabel(value: NamingFieldOption, field?: NamingField): string {
  if (!isDropdownValue(value)) return value;
  const description = field
    ? valueDescription(field, value)
    : (value.description ?? "");
  return description ? `${value.value} - ${description}` : value.value;
}

function fieldLabel(field: NamingField | undefined, fallback: string): string {
  if (!field) return fallback;
  return tl(`data.field.${field.name}.label`, fallback);
}

function fieldTip(field: NamingField | undefined, fallback: string): string {
  if (!field?.tip) return fallback;
  return tl(`data.field.${field.name}.tip`, fallback);
}

function valueDescription(field: NamingField | undefined, value: NamingFieldOption): string {
  if (!isDropdownValue(value)) return "";
  const code = optionValue(value);
  const fallback = value.description ?? "";
  if (field?.library) return tl(`data.lib.${field.library}.${code}`, fallback);
  if (field?.name) return tl(`data.value.${field.name}.${code}`, fallback);
  return fallback;
}

function conventionName(convention: NamingConvention): string {
  return tl(`data.rule.${convention.id}.name`, convention.name);
}

function conventionDescription(convention: NamingConvention): string {
  return tl(`data.rule.${convention.id}.description`, convention.description);
}

function patternName(convention: NamingConvention, pattern: { id: string; name: string }): string {
  return tl(`data.rule.${convention.id}.pattern.${pattern.id}.name`, pattern.name);
}

function patternToSegments(pattern: string): string[] {
  return (pattern.match(/\[[^\]]+\]/g) ?? []).map((segment) => segment.slice(1, -1));
}

type PatternToken = { type: "literal" | "segment"; value: string };

function parsePattern(pattern: string): PatternToken[] {
  const tokens: PatternToken[] = [];
  const segmentRe = /\[[^\]]+\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = segmentRe.exec(pattern))) {
    if (match.index > lastIndex) {
      tokens.push({ type: "literal", value: pattern.slice(lastIndex, match.index) });
    }
    tokens.push({ type: "segment", value: match[0].slice(1, -1) });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < pattern.length) {
    tokens.push({ type: "literal", value: pattern.slice(lastIndex) });
  }
  return tokens;
}

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

function fieldByName(fields: NamingField[], name: string): NamingField | undefined {
  const conventionField = fields.find((field) => field.name === name);
  const catalogField = segmentCatalog.find((field) => field.name === name);

  if (!conventionField && !catalogField) {
    return undefined;
  }

  return {
    ...(catalogField ?? {}),
    ...(conventionField ?? {}),
  } as NamingField;
}

function valuesForField(field?: NamingField): NamingFieldOption[] {
  if (!field) return [];

  let options: NamingFieldOption[];

  if (field.values && field.values.length > 0) {
    options = field.values;
  } else if (field.library) {
    const segmentFile = getSegmentFile(field.library);

    options = segmentFile?.values?.length
      ? normalizeSegmentValues(segmentFile.values)
      : [];
  } else if (field.generator) {
    const generatorFile = getGeneratorFile(field.generator);

    options = generatorFile ? generateValues(generatorFile) : [];
  } else {
    options = [];
  }

  if (field.allowedValues?.length) {
    const allowed = new Set(field.allowedValues);
    options = options.filter((option) => allowed.has(optionValue(option)));
  }

  return options;
}

function defaultValueForField(field?: NamingField): string {
  if (!field) return "";

  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  const values = valuesForField(field);

  return values.length > 0
    ? optionValue(values[0])
    : "";
}

type BuildSegmentOptions = {
  defaultSegments?: string[];
  fixedValues?: Record<string, string>;
  pattern?: string;
  fields?: NamingField[];
};

function buildSegments(
  convention: NamingConvention,
  options?: BuildSegmentOptions
): BuilderSegment[] {
  const source =
    options?.defaultSegments ??
    convention.builder?.defaultSegments ??
    patternToSegments(options?.pattern ?? convention.pattern);

  const fixedValues = options?.fixedValues ?? {};
  const fields = options?.fields ?? convention.fields ?? [];

  return source.map((name, index) => {
    const field = fieldByName(fields, name);

    return {
      key: `${name}-${index}-${Date.now()}`,
      sourceName: name,
      label: fieldLabel(field, field?.label ?? name),
      value: fixedValues[name] ?? defaultValueForField(field),
      custom: !field,
    };
  });
}


function isLocked(convention: NamingConvention, name: string): boolean {
  return convention.builder?.lockedSegments?.includes(name) ?? false;
}

function isRecommended(convention: NamingConvention, name: string): boolean {
  return convention.builder?.recommendedSegments?.includes(name) ?? false;
}

function isFixedFirst(
  convention: NamingConvention,
  name: string
): boolean {
  return (
    convention.builder?.fixedFirstSegments?.includes(name) ??
    false
  );
}

function isFixedLast(convention: NamingConvention, name: string): boolean {
  return convention.builder?.fixedLastSegments?.includes(name) ?? false;
}

function normalizeName(name: string, convention: NamingConvention): string {
  const rule = validationRules?.[convention.category]?.[convention.name] ?? convention.validation ?? validationRules.default;
  if (!rule) return name;
  let n = name;
  if (rule.forceLowercase) n = n.toLowerCase();
  if (rule.removeCharacters) {
    rule.removeCharacters.forEach((c: string) => {
      n = n.split(c).join("");
    });
  }
  if (rule.maxLength) n = n.slice(0, rule.maxLength);
  return n;
}

function validateName(name: string, convention: NamingConvention, segments: BuilderSegment[]): ValidationResult[] {
  const rule = validationRules?.[convention.category]?.[convention.name] ?? convention.validation ?? validationRules.default;
  const names = segments.map((s) => s.sourceName);
  const results: ValidationResult[] = [
    { label: tl("ui.valEmpty", "Generated name is not empty"), valid: name.length > 0 },
    { label: tl("ui.valFilled", "All segments are filled"), valid: segments.every((s) => s.value.trim().length > 0) },
    { label: tl("ui.valLength", `Length is ${rule.maxLength ?? 128} characters or less`, { max: rule.maxLength ?? 128 }), valid: name.length <= (rule.maxLength ?? 128) },
    {
      label: tl("ui.valAllowed", "Allowed characters are respected"),
      valid: new RegExp(rule.allowedPattern ?? "^[A-Za-z0-9_.-]+$").test(name) || name.length === 0,
    },
  ];

  (convention.builder?.lockedSegments ?? []).forEach((s: string) =>
    results.push({ label: tl("ui.valLockedPresent", `Locked segment present: ${s}`, { name: s }), valid: names.includes(s) }),
  );

  (convention.builder?.recommendedSegments ?? []).forEach((s: string) =>
    results.push({ label: tl("ui.valRecommendedPresent", `Recommended segment present: ${s}`, { name: s }), valid: names.includes(s) }),
  );

  return results;
}

function governanceScore(results: ValidationResult[]): number {
  if (results.length === 0) return 0;
  return Math.round((results.filter((r) => r.valid).length / results.length) * 100);
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
