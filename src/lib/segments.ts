import { tl } from "./i18n-utils";
import { getGeneratorFile, getSegmentFile, segmentCatalog } from "./data";
import { caPolicyIdOptionsForRange, generateValues, normalizeSegmentValues, personaRangeKeyForField } from "./generators";
import { expandedLength } from "./macros";
import { patternToSegments } from "./parse";
import type { DropdownValue, NamingConvention, NamingField, NamingFieldOption } from "../types/Rule";

export type SegmentValue = {
  value: string;
  description?: string;
};

export type SegmentFile = {
  name: string;
  values?: SegmentValue[];
};

export type BuilderSegment = { key: string; sourceName: string; label: string; value: string; custom?: boolean };

export function assembleRawName(
  segments: BuilderSegment[],
  opts: {
    literalPrefixes: Map<string, string>;
    patternSuffix: string;
    lastPatternSegment?: string;
    separator: string;
    caseMode?: "upper" | "lower";
  }
): string {
  const cased = (v: string) =>
    opts.caseMode === "lower" ? v.toLowerCase()
    : opts.caseMode === "upper" ? v.toUpperCase()
    : v;
  return segments
    .map((segment, index) => {
      const prefix = opts.literalPrefixes.get(segment.sourceName) ?? opts.separator;
      const suffix =
        index === segments.length - 1 && segment.sourceName === opts.lastPatternSegment
          ? opts.patternSuffix
          : "";
      return `${prefix}${cased(segment.value.trim())}${suffix}`;
    })
    .join("")
    .replace(/^[-.\s]+/, "")
    .replace(/[-.\s]+$/, "")
    .replace(/([-.\s])\1+/g, "$1");
}

export function isDropdownValue(value: NamingFieldOption): value is DropdownValue {
  return typeof value === "object" && value !== null && "value" in value;
}

export function optionValue(value: NamingFieldOption): string {
  return isDropdownValue(value) ? value.value : value;
}

export function optionLabel(value: NamingFieldOption, field?: NamingField): string {
  if (!isDropdownValue(value)) return value;
  const description = field
    ? valueDescription(field, value)
    : (value.description ?? "");
  return description ? `${value.value} - ${description}` : value.value;
}

export function fieldLabel(field: NamingField | undefined, fallback: string): string {
  if (!field) return fallback;
  return tl(`data.field.${field.name}.label`, fallback);
}

export function fieldTip(
  field: NamingField | undefined,
  fallback: string,
  conventionId?: string
): string {
  if (!field?.tip) return fallback;
  // Rule-scoped keys win so a rule-specific tip can never be silently
  // overridden by another rule gaining a same-named field (IN-01).
  if (conventionId) {
    const scoped = tl(`data.rule.${conventionId}.field.${field.name}.tip`, "");
    if (scoped) return scoped;
  }
  return tl(`data.field.${field.name}.tip`, fallback);
}

export function valueDescription(field: NamingField | undefined, value: NamingFieldOption): string {
  if (!isDropdownValue(value)) return "";
  const code = optionValue(value);
  const fallback = value.description ?? "";
  if (field?.library) return tl(`data.lib.${field.library}.${code}`, fallback);
  if (field?.name) return tl(`data.value.${field.name}.${code}`, fallback);
  return fallback;
}

export function conventionName(convention: NamingConvention): string {
  return tl(`data.rule.${convention.id}.name`, convention.name);
}

export function conventionDescription(convention: NamingConvention): string {
  return tl(`data.rule.${convention.id}.description`, convention.description);
}

export function patternName(convention: NamingConvention, pattern: { id: string; name: string }): string {
  return tl(`data.rule.${convention.id}.pattern.${pattern.id}.name`, pattern.name);
}

export function fieldByName(fields: NamingField[], name: string): NamingField | undefined {
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

export function valuesForField(field?: NamingField): NamingFieldOption[] {
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

export function defaultValueForField(field?: NamingField): string {
  if (!field) return "";

  if (field.defaultValue !== undefined) {
    return field.defaultValue;
  }

  const values = valuesForField(field);

  return values.length > 0
    ? optionValue(values[0])
    : "";
}

export type BuildSegmentOptions = {
  defaultSegments?: string[];
  fixedValues?: Record<string, string>;
  pattern?: string;
  fields?: NamingField[];
};

export function buildSegments(
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
      key: `${name}-${index}`,
      sourceName: name,
      label: fieldLabel(field, field?.label ?? name),
      value: fixedValues[name] ?? defaultValueForField(field),
      custom: !field,
    };
  });
}

export function optionsForSegment(
  field: NamingField | undefined,
  segments: BuilderSegment[],
  convention?: NamingConvention
): NamingFieldOption[] {
  let options = valuesForField(field);

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
  const generatorFile = field?.generator ? getGeneratorFile(field.generator) : undefined;
  if (rangeKey && generatorFile && generatorFile.type === "caPolicyId") {
    options = caPolicyIdOptionsForRange(generatorFile, rangeKey);
  }

  // maxLengthBudget: cap macro widths so prefix + expansion stays within the
  // convention's maxLength (e.g. Autopilot DT- caps %RAND:n% at n <= 12).
  // Unknowable expansions (%SERIAL%) are kept — validation flags over-budget
  // RAND templates instead (T-14-04-02).
  const budget = field?.maxLengthBudget;
  const maxLen = convention?.validation?.maxLength;
  if (budget && maxLen) {
    const depVal = segments.find((s) => s.sourceName === budget.dependsOn)?.value.trim() ?? "";
    const remaining = maxLen - depVal.length;
    options = options.filter((o) => {
      const el = expandedLength(optionValue(o));
      return el === null || el <= remaining; // %SERIAL% unknowable → keep
    });
  }

  return options;
}