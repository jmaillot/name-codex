export interface DropdownValue {
  value: string;
  description?: string;
}

export type NamingFieldOption = string | DropdownValue;

export interface NamingField {
  name: string;
  label?: string;
  type?: "text" | "dropdown";
  values?: NamingFieldOption[];
  defaultValue?: string;
  placeholder?: string;
  allowCustomValue?: boolean;
  customOnly?: boolean;
  multiSelect?: boolean;
  multiSeparator?: string;
  multiAllValue?: string;
  multiExclusions?: string[][];
  library?: string;
  generator?: string;
  allowedValues?: string[];
  allowedValuesByField?: Record<string, Record<string, string[]>>;
  maxLengthBudget?: { dependsOn: string };
  allowedPattern?: string;
  examples?: string[];
  tip?: string;
}

export interface NamingBuilderConfig {
  separator?: string;
  defaultSegments?: string[];
  availableSegments?: string[];
  lockedSegments?: string[];
  recommendedSegments?: string[];
  fixedFirstSegments?: string[];
  fixedLastSegments?: string[];
}

export interface NamingValidationConfig {
  maxLength?: number;
  allowedPattern?: string;
  forceLowercase?: boolean;
  removeCharacters?: string[];
  caseMode?: "upper" | "lower" | "preserve";
}

// Segment-library `constraints` vocabulary (Phase 17, DATA-02).
// Machine-readable documentation only — validated by check:data;
// consumed by builder wiring from a later milestone onward.
export interface SegmentConstraints {
  allowedPattern?: string;
  minLength?: number;
  maxLength?: number;
}

export interface NamingPatternOption {
  id: string;
  name: string;
  description?: string;
  pattern: string;

  defaultSegments?: string[];
  examples?: string[];
  fixedValues?: Record<string, string>;

  fields?: NamingField[];
}

export interface NamingConvention {
  id: string;
  category: string;
  name: string;
  description: string;

  pattern: string;
  patterns?: NamingPatternOption[];

  fields: NamingField[];
  sourcePath?: string;

  examples?: string[];
  maturity?: string;

  builder?: NamingBuilderConfig;
  validation?: NamingValidationConfig;
}