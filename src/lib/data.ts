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

const segmentModuleMap = new Map<string, SegmentFile>(
  Object.entries(segmentModules).map(([path, file]) => {
    const lower = path.toLowerCase();
    const marker = "/segments/";
    const idx = lower.indexOf(marker);
    const key = idx >= 0 ? lower.slice(idx + marker.length).replace(".json", "") : lower.split("/").pop()?.replace(".json", "") ?? "";
    return [key, file] as const;
  })
);

const generatorModuleMap = new Map<string, SegmentGenerator>(
  Object.entries(generatorModules).map(([path, file]) => {
    const lower = path.toLowerCase();
    const marker = "/generators/";
    const idx = lower.indexOf(marker);
    const key = idx >= 0 ? lower.slice(idx + marker.length).replace(".json", "") : lower.split("/").pop()?.replace(".json", "") ?? "";
    return [key, file] as const;
  })
);

export function getSegmentFile(libraryName: string): SegmentFile | undefined {
  return segmentModuleMap.get(moduleKeyFromName(libraryName));
}

export function getGeneratorFile(generatorName: string): SegmentGenerator | undefined {
  return generatorModuleMap.get(moduleKeyFromName(generatorName));
}

const ruleModules = import.meta.glob("../rules/**/*.json", {
  eager: true,
  import: "default",
}) as Record<string, NamingConvention>;

export const allConventions = Object.entries(ruleModules)
  .map(([path, convention]) => ({ ...convention, sourcePath: path }))
  .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));