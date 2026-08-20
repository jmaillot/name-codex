import segmentCatalogData from "../data/segment-catalog.json";
import validationRulesData from "../data/validation-rules.json";
import caNumberingRangesData from "../data/ca-numbering-ranges.json";
import type { NamingConvention, NamingField } from "../types/Rule";
import type { SegmentFile } from "./segments";
import type { CaPolicyRange, SegmentGenerator } from "./generators";

export const segmentCatalog = segmentCatalogData as NamingField[];
export const validationRules = validationRulesData as any;
export const caNumberingRanges = caNumberingRangesData as Record<string, CaPolicyRange>;

const segmentModules = import.meta.glob("../data/segments/**/*.json", {
  eager: true,
  import: "default",
}) as Record<string, SegmentFile>;

const generatorModules = import.meta.glob("../data/generators/*.json", {
  eager: true,
  import: "default",
}) as Record<string, SegmentGenerator>;

function moduleKeyFromName(name: string): string {
  return name.trim().toLowerCase();
}

export function getSegmentFile(libraryName: string): SegmentFile | undefined {
  const key = moduleKeyFromName(libraryName);

  const entry = Object.entries(segmentModules).find(([path]) =>
    path.toLowerCase().endsWith(`/segments/${key}.json`) ||
    path.toLowerCase().endsWith(`segments/${key}.json`)
  );

  return entry?.[1];
}

export function getGeneratorFile(generatorName: string): SegmentGenerator | undefined {
  const key = moduleKeyFromName(generatorName);

  const entry = Object.entries(generatorModules).find(([path]) =>
    path.toLowerCase().endsWith(`/generators/${key}.json`) ||
    path.toLowerCase().endsWith(`generators/${key}.json`)
  );

  return entry?.[1];
}

const ruleModules = import.meta.glob("../rules/**/*.json", {
  eager: true,
  import: "default",
}) as Record<string, NamingConvention>;

export const allConventions = Object.entries(ruleModules)
  .map(([path, convention]) => ({ ...convention, sourcePath: path }))
  .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));