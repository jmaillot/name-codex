import { tl } from "./i18n-utils";
import { caNumberingRanges, getGeneratorFile } from "./data";
import type { NamingField, NamingFieldOption } from "../types/Rule";
import type { BuilderSegment, SegmentValue } from "./segments";

export type SequenceGenerator = {
  name: string;
  type: "sequence";
  start: number;
  end: number;
  padding?: number;
  descriptionPrefix?: string;
};

export type CaPolicyRange = {
  label: string;
  prefix: string;
  digits: number;
  defaultNumber?: string;
  min: number;
  max: number;
};

export type CaPolicyIdGenerator = {
  name: string;
  type: "caPolicyId";
  ranges?: Record<string, CaPolicyRange>;
  personaRanges?: Record<string, string>;
  personaSource?: string;
  prefix?: string;
  digits?: number;
  defaultNumber?: string;
};

export type SegmentGenerator = SequenceGenerator | CaPolicyIdGenerator;

export function normalizeSegmentValues(values: SegmentValue[] = []): NamingFieldOption[] {
  return values.map((item) => ({
    value: item.value,
    description: item.description ?? "",
  }));
}

export function generateSequence(generator: SequenceGenerator): NamingFieldOption[] {
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

export function generateCaPolicyIds(generator: CaPolicyIdGenerator): NamingFieldOption[] {
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

export function generateValues(generator: SegmentGenerator): NamingFieldOption[] {
  if (generator.type === "sequence") {
    return generateSequence(generator);
  }

  if (generator.type === "caPolicyId") {
    return generateCaPolicyIds(generator);
  }

  return [];
}

export function caPolicyIdRange(
  generator: CaPolicyIdGenerator,
  rangeKey: string
): CaPolicyRange | undefined {
  return (generator.ranges ?? caNumberingRanges)[rangeKey];
}

export function caPolicyIdFallbackRange(
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

export function caPolicyIdOptionsForRange(
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

export function caPolicyIdPersonaSource(field: NamingField | undefined): string {
  if (!field?.generator) return "Persona";

  const generatorFile = getGeneratorFile(field.generator);
  return generatorFile?.type === "caPolicyId"
    ? generatorFile.personaSource ?? "Persona"
    : "Persona";
}

export function personaRangeKeyForField(
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