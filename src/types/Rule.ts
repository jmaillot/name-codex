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
  library?: string;
  generator?: string;
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
  requireLockedSegments?: boolean;
  requireRecommendedSegments?: boolean;
  forceLowercase?: boolean;
  removeCharacters?: string[];
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
  policyExamples?: Record<string, string>;
  maturity?: string;

  builder?: NamingBuilderConfig;
  validation?: NamingValidationConfig;
}