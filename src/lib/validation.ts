import { tl } from "./i18n-utils";
import { getSegmentFile, validationRules } from "./data";
import { expandedLength } from "./macros";
import type { NamingConvention, NamingField, SegmentConstraints } from "../types/Rule";
import type { BuilderSegment } from "./segments";

export type ValidationResult = { label: string; valid: boolean };

export function isLocked(convention: NamingConvention, name: string): boolean {
  return convention.builder?.lockedSegments?.includes(name) ?? false;
}

export function isRecommended(convention: NamingConvention, name: string): boolean {
  return convention.builder?.recommendedSegments?.includes(name) ?? false;
}

export function isFixedFirst(
  convention: NamingConvention,
  name: string
): boolean {
  return (
    convention.builder?.fixedFirstSegments?.includes(name) ??
    false
  );
}

export function isFixedLast(convention: NamingConvention, name: string): boolean {
  return convention.builder?.fixedLastSegments?.includes(name) ?? false;
}

export function normalizeName(
  name: string,
  convention: NamingConvention,
  options?: { truncate?: boolean }
): string {
  const rule = validationRules?.[convention.category]?.[convention.name] ?? convention.validation ?? validationRules.default;
  if (!rule) return name;
  const truncate = options?.truncate ?? true;
  let n = name;
  if (rule.forceLowercase) n = n.toLowerCase();
  if (rule.forceUppercase) n = n.toUpperCase();
  if (rule.removeCharacters) {
    rule.removeCharacters.forEach((c: string) => {
      n = n.split(c).join("");
    });
  }
  // Truncation is opt-out (CR-01): validation must see the pre-truncation
  // value, otherwise the length row can never fail and a clipped %RAND:n%
  // macro disappears from the checked text.
  if (truncate && rule.maxLength) n = n.slice(0, rule.maxLength);
  return n;
}

export function validateName(name: string, convention: NamingConvention, segments: BuilderSegment[], fields: NamingField[] = convention.fields): ValidationResult[] {
  const rule = validationRules?.[convention.category]?.[convention.name] ?? convention.validation ?? validationRules.default;
  const names = segments.map((s) => s.sourceName);
  const results: ValidationResult[] = [
    { label: tl("ui.valEmpty", "Generated name is not empty"), valid: name.length > 0 },
    { label: tl("ui.valFilled", "All segments are filled"), valid: segments.every((s) => s.value.trim().length > 0) },
    { label: tl("ui.valLength", `Length is ${rule.maxLength ?? 128} characters or less`, { max: rule.maxLength ?? 128 }), valid: name.length <= (rule.maxLength ?? 128) },
    ...(/%RAND:\d+%/.test(name)
      ? [{
          label: tl(
            "ui.valMacroLength",
            `Expanded macros fit within ${rule.maxLength ?? 128} characters`,
            { max: rule.maxLength ?? 128 }
          ),
          valid: (() => {
            const expanded = expandedLength(name);
            return expanded !== null && expanded <= (rule.maxLength ?? 128);
          })(),
        }]
      : []),
    {
      label: tl("ui.valAllowed", "Allowed characters are respected"),
      valid: new RegExp(rule.allowedPattern ?? "^[A-Za-z0-9_.-]+$").test(name) || name.length === 0,
    },
  ];

  (fields ?? []).forEach((field) => {
    if (!field.allowedPattern) return;
    segments.forEach((segment) => {
      if (segment.sourceName !== field.name) return;
      results.push({
        label: tl("ui.valFieldPattern", `Segment ${field.name} respects its allowed characters`, { name: field.name }),
        valid: new RegExp(field.allowedPattern as string).test(segment.value) || segment.value.length === 0,
      });
    });
  });

  // SegmentConstraints validation (Phase 19, WIRE-01) — additive rows, distinct keys
  (fields ?? []).forEach((field) => {
    const constraints: SegmentConstraints | undefined =
      (field as unknown as { constraints?: SegmentConstraints }).constraints ??
      (field.library ? (getSegmentFile(field.library) as unknown as { constraints?: SegmentConstraints })?.constraints : undefined);
    if (!constraints) return;
    segments.forEach((segment) => {
      if (segment.sourceName !== field.name) return;
      const val = segment.value;
      if (val.length === 0) return;
      if (constraints.allowedPattern) {
        let passes = true;
        try {
          const re = new RegExp(constraints.allowedPattern);
          passes = re.test(val.length > 256 ? val.slice(0, 256) : val);
        } catch {
          passes = true;
        }
        results.push({
          label: tl("ui.valConstraintPattern", `Segment ${field.name} matches required pattern`, { name: field.name }),
          valid: passes,
        });
      }
      if (typeof constraints.minLength === "number") {
        results.push({
          label: tl("ui.valConstraintMinLength", `Segment ${field.name} is at least ${constraints.minLength} characters`, { name: field.name, min: constraints.minLength }),
          valid: val.length >= constraints.minLength,
        });
      }
      if (typeof constraints.maxLength === "number") {
        results.push({
          label: tl("ui.valConstraintMaxLength", `Segment ${field.name} is at most ${constraints.maxLength} characters`, { name: field.name, max: constraints.maxLength }),
          valid: val.length <= constraints.maxLength,
        });
      }
    });
  });

  // For grouped conventions (patterns[]), filter locked/recommended to active pattern fields only
  // so e.g. Service Bus Namespace (SBNS-...) does not flag Purpose/Consumer, and queue only flags Purpose.
  // For single-pattern conventions keep legacy behavior (no filter) to preserve existing governance tests
  // where recommended may be a custom segment not in fields (e.g. Rec in synthetic tests).
  const hasPatterns = (convention.patterns?.length ?? 0) > 0;
  (convention.builder?.lockedSegments ?? []).filter((s) => !hasPatterns || (fields ?? []).some((f) => f.name === s)).forEach((s: string) =>
    results.push({ label: tl("ui.valLockedPresent", `Locked segment present: ${s}`, { name: s }), valid: names.includes(s) }),
  );

  (convention.builder?.recommendedSegments ?? []).filter((s) => !hasPatterns || (fields ?? []).some((f) => f.name === s)).forEach((s: string) =>
    results.push({ label: tl("ui.valRecommendedPresent", `Recommended segment present: ${s}`, { name: s }), valid: names.includes(s) }),
  );

  return results;
}

export function governanceScore(results: ValidationResult[]): number {
  if (results.length === 0) return 0;
  return Math.round((results.filter((r) => r.valid).length / results.length) * 100);
}