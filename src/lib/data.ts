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
}) as Record<string, SegmentGenerator & { variants?: Record<string, Omit<SegmentGenerator, "name" | "type">> }>;

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

// S9 unified policy-id variants: policy-id.json contains variants for ca-policy-id and ca-emergency-policy-id
const policyIdVariants = (() => {
  const base = generatorModuleMap.get("policy-id") as unknown as { variants?: Record<string, Record<string, unknown>> } | undefined;
  if (!base?.variants) return new Map<string, SegmentGenerator>();
  return new Map<string, SegmentGenerator>(
    Object.entries(base.variants).map(([key, cfg]) => [
      key.toLowerCase(),
      { name: key, type: "caPolicyId", ...(cfg as object) } as SegmentGenerator,
    ])
  );
})();

export function getSegmentFile(libraryName: string): SegmentFile | undefined {
  return segmentModuleMap.get(moduleKeyFromName(libraryName));
}

export function getGeneratorFile(generatorName: string): SegmentGenerator | undefined {
  const key = moduleKeyFromName(generatorName);
  // Check unified variants first (S9)
  const variant = policyIdVariants.get(key);
  if (variant) return variant;
  return generatorModuleMap.get(key);
}

const ruleModules = import.meta.glob("../rules/**/*.json", {
  eager: true,
  import: "default",
}) as Record<string, NamingConvention>;

export const allConventions = Object.entries(ruleModules)
  .map(([path, convention]) => ({ ...convention, sourcePath: path }))
  .sort((a, b) => a.category.localeCompare(b.category) || a.name.localeCompare(b.name));

// S12 pattern inheritance: merge top-level fields into each pattern's fields (pattern overrides by name)
// Only merge base fields that are actually referenced in the pattern's pattern string
// e.g. pp-environment developer pattern PPE-DEV-[User] should not inherit Workload/Environment
for (const conv of allConventions) {
  if (!conv.patterns?.length) continue;
  const baseFields = conv.fields ?? [];
  if (baseFields.length === 0) continue;
  for (const pat of conv.patterns) {
    const patternStr = pat.pattern ?? "";
    const baseForPat = baseFields.filter((f) => patternStr.includes(`[${f.name}]`));
    if (baseForPat.length === 0) continue;
    if (!pat.fields) {
      pat.fields = [...baseForPat];
    } else {
      const merged: NamingField[] = [...baseForPat];
      for (const pf of pat.fields) {
        const idx = merged.findIndex((f) => f.name === pf.name);
        if (idx >= 0) merged[idx] = { ...merged[idx], ...pf } as NamingField;
        else merged.push(pf as NamingField);
      }
      pat.fields = merged;
    }
  }
}
