// Data-validation gate (Phase 16, DATA-01a / D-01..D-04, D-07, D-10)
// 1. Rules gate: src/rules/**/*.json — required keys: id, category, name,
//    description (non-empty string, D-02), pattern (string), fields (array).
//    When present: fields[].library must be a string "category/name";
//    builder/validation objects validated structurally (D-10).
// 2. Segments gate: src/data/segments/**/*.json — required keys: name (string),
//    values (array). Each entry: value (non-empty string, unique within the
//    file's values array), description (non-empty string, D-01/D-02).
// 3. Generators gate: src/data/generators/*.json — required keys: name (string),
//    type (string). When present: personaSource must be a string;
//    personaRanges must be an object whose values are strings.
// Unknown keys are IGNORED everywhere (D-10 — keeps Phase 17 additive).
// Collect-all semantics (D-04): every file scanned, all errors reported.
// Uniqueness scope: per-file values array — src/lib/data.ts loads each file
// independently via import.meta.glob, no cross-file namespace merge.
// Node >= 18, ESM, zero dependencies.

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

function walkJson(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkJson(full));
    else if (entry.name.endsWith('.json')) out.push(full);
  }
  return out;
}

function isNonEmptyString(v) {
  return typeof v === 'string' && v.trim().length > 0;
}

// Key-presence checks MUST use own-property checks, never truthy-index
// lookups — parsed JSON is treated as hostile input (T-16-01: a
// {"__proto__": {...}} key would fool truthy checks via prototype lookup).
function hasOwn(obj, key) {
  return Object.prototype.hasOwnProperty.call(obj, key);
}

// --- Per-kind validators (pure: no I/O, collect-all within each file) ---

export function validateRule(json, filePath) {
  const violations = [];
  if (!isNonEmptyString(json?.id)) {
    violations.push({ file: filePath, reason: 'id must be a non-empty string' });
  }
  if (!isNonEmptyString(json?.category)) {
    violations.push({ file: filePath, reason: 'category must be a non-empty string' });
  }
  if (!isNonEmptyString(json?.name)) {
    violations.push({ file: filePath, reason: 'name must be a non-empty string' });
  }
  // D-02: top-level rule description must exist and be non-empty.
  if (!isNonEmptyString(json?.description)) {
    violations.push({ file: filePath, reason: 'description must be a non-empty string' });
  }
  if (!isNonEmptyString(json?.pattern)) {
    violations.push({ file: filePath, reason: 'pattern must be a non-empty string' });
  }
  if (hasOwn(json ?? {}, 'fields') && !Array.isArray(json.fields)) {
    violations.push({ file: filePath, reason: 'fields must be an array' });
  } else if (Array.isArray(json?.fields)) {
    for (let i = 0; i < json.fields.length; i++) {
      const field = json.fields[i];
      if (field === null || typeof field !== 'object' || Array.isArray(field)) {
        violations.push({ file: filePath, reason: `fields[${i}] must be an object` });
        continue;
      }
      if (hasOwn(field, 'library') && typeof field.library !== 'string') {
        violations.push({
          file: filePath,
          reason: `fields[${i}].library must be a string "category/name"`,
        });
      }
    }
  }

  const builder = json?.builder;
  if (builder !== null && typeof builder === 'object' && !Array.isArray(builder)) {
    if (hasOwn(builder, 'separator') && typeof builder.separator !== 'string') {
      violations.push({ file: filePath, reason: 'builder.separator must be a string' });
    }
    for (const segKey of [
      'defaultSegments',
      'availableSegments',
      'recommendedSegments',
      'lockedSegments',
      'fixedFirstSegments',
      'fixedLastSegments',
    ]) {
      if (hasOwn(builder, segKey) && !Array.isArray(builder[segKey])) {
        violations.push({ file: filePath, reason: `builder.${segKey} must be an array` });
      }
    }
  }

  const validation = json?.validation;
  if (validation !== null && typeof validation === 'object' && !Array.isArray(validation)) {
    if (hasOwn(validation, 'maxLength') && typeof validation.maxLength !== 'number') {
      violations.push({ file: filePath, reason: 'validation.maxLength must be a number' });
    }
    if (hasOwn(validation, 'allowedPattern') && typeof validation.allowedPattern !== 'string') {
      violations.push({ file: filePath, reason: 'validation.allowedPattern must be a string' });
    }
  }
  return violations;
}

export function validateSegment(json, filePath) {
  const violations = [];
  if (!isNonEmptyString(json?.name)) {
    violations.push({ file: filePath, reason: 'name must be a non-empty string' });
  }
  if (!Array.isArray(json?.values)) {
    violations.push({ file: filePath, reason: 'values must be an array' });
    return violations;
  }
  const seenValues = new Set();
  for (let i = 0; i < json.values.length; i++) {
    const entry = json.values[i];
    if (entry === null || typeof entry !== 'object' || Array.isArray(entry)) {
      violations.push({ file: filePath, reason: `values[${i}] must be an object` });
      continue;
    }
    if (!isNonEmptyString(entry.value)) {
      violations.push({ file: filePath, reason: `values[${i}].value must be a non-empty string` });
    } else if (seenValues.has(entry.value)) {
      // Uniqueness scope: per-file values array (src/lib/data.ts loads each
      // segment file independently — no cross-file namespace merge).
      violations.push({
        file: filePath,
        reason: `values[${i}].value "${entry.value}" is duplicated in this file's values array`,
      });
    } else {
      seenValues.add(entry.value);
    }
    // D-01/D-02: empty string, whitespace-only, and non-string all violate.
    if (!isNonEmptyString(entry.description)) {
      violations.push({
        file: filePath,
        reason: `values[${i}].description must be a non-empty string`,
      });
    }
  }
  return violations;
}

export function validateGenerator(json, filePath) {
  const violations = [];
  if (!isNonEmptyString(json?.name)) {
    violations.push({ file: filePath, reason: 'name must be a non-empty string' });
  }
  if (!isNonEmptyString(json?.type)) {
    violations.push({ file: filePath, reason: 'type must be a non-empty string' });
  }
  if (hasOwn(json ?? {}, 'personaSource') && typeof json.personaSource !== 'string') {
    violations.push({ file: filePath, reason: 'personaSource must be a string when present' });
  }
  if (hasOwn(json ?? {}, 'personaRanges')) {
    const ranges = json.personaRanges;
    if (ranges === null || typeof ranges !== 'object' || Array.isArray(ranges)) {
      violations.push({ file: filePath, reason: 'personaRanges must be an object (string→string map)' });
    } else {
      for (const [key, value] of Object.entries(ranges)) {
        if (typeof value !== 'string') {
          violations.push({
            file: filePath,
            reason: `personaRanges.${key} must be a string (string→string map)`,
          });
        }
      }
    }
  }
  return violations;
}

// --- Kind routing by normalized relative path ---

const ROUTES = [
  { match: (rel) => rel.includes('src/rules/'), validate: validateRule },
  { match: (rel) => rel.includes('src/data/segments/'), validate: validateSegment },
  { match: (rel) => rel.includes('src/data/generators/'), validate: validateGenerator },
];

function validateFile(absPath, rootDir) {
  const rel = relative(rootDir, absPath).split(sep).join('/');
  let json;
  try {
    json = JSON.parse(readFileSync(absPath, 'utf8'));
  } catch (err) {
    return [{ file: rel, reason: `invalid JSON: ${err.message}` }];
  }
  const route = ROUTES.find((r) => r.match(rel));
  if (!route) return []; // outside the three data roots — ignore
  return route.validate(json, rel);
}

// --- Scan entry point (collect-all across all files, D-04) ---

export function scanData(rootDir = process.cwd()) {
  const roots = [
    join(rootDir, 'src', 'rules'),
    join(rootDir, 'src', 'data', 'segments'),
    join(rootDir, 'src', 'data', 'generators'),
  ];
  const violations = [];
  let fileCount = 0;
  for (const root of roots) {
    let files = [];
    try {
      files = walkJson(root);
    } catch {
      continue; // missing dir → skip silently (lets tmp-dir trees be partial)
    }
    for (const f of files) {
      fileCount++;
      violations.push(...validateFile(f, rootDir));
    }
  }
  return { violations, fileCount };
}

// --- CLI main (guarded: never runs on import, D-07) ---

function main() {
  const { violations, fileCount } = scanData();
  if (violations.length > 0) {
    console.error('DATA GATE FAIL:');
    // Violations are pushed in file order → grouped by file automatically.
    for (const v of violations) console.error(`  ${v.file}: ${v.reason}`);
    console.error(`DATA GATE FAIL: ${fileCount} files, ${violations.length} errors`);
    process.exit(1); // exit only AFTER the full report (D-04)
  }
  console.log(`DATA GATE PASS (${fileCount} files, 0 errors)`);
  process.exit(0);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) main();
