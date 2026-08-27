import { tl } from "./i18n-utils";
import { validationRules } from "./data";
import { expandedLength } from "./macros";
import type { NamingConvention, NamingField } from "../types/Rule";
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

  (convention.builder?.lockedSegments ?? []).forEach((s: string) =>
    results.push({ label: tl("ui.valLockedPresent", `Locked segment present: ${s}`, { name: s }), valid: names.includes(s) }),
  );

  (convention.builder?.recommendedSegments ?? []).forEach((s: string) =>
    results.push({ label: tl("ui.valRecommendedPresent", `Recommended segment present: ${s}`, { name: s }), valid: names.includes(s) }),
  );

  return results;
}

export function governanceScore(results: ValidationResult[]): number {
  if (results.length === 0) return 0;
  return Math.round((results.filter((r) => r.valid).length / results.length) * 100);
}