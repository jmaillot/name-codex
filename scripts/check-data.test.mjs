// Unit + end-to-end coverage for scripts/check-data.mjs (Phase 16, D-05/D-06).
// No fixture files are committed anywhere (D-05): every malformed object is
// built inline; the e2e failure path writes malformed JSON into an OS-temp
// mkdtemp tree at runtime and cleans up after itself (T-16-03).
//
// @vitest-environment node
// Pure Node test (fs/child_process) — skip the jsdom default environment,
// whose startup can time out the vitest forks worker on slow checkouts.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { validateRule, validateSegment, validateGenerator, scanData } from './check-data.mjs';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const SCRIPT_PATH = join(fileURLToPath(new URL('.', import.meta.url)), 'check-data.mjs');

// Inline helper-object construction per repo test conventions.
const seg = (value, description) => ({ value, description });

// Constraint-bearing segment factory (in-memory only — no fixtures, D-05).
const constrainedSegFile = (constraints, extra = {}) => ({
  name: 'X',
  constraints,
  values: [seg('A', 'Alpha')],
  ...extra,
});

describe('validateSegment', () => {
  it('accepts a valid segment with zero violations', () => {
    const violations = validateSegment(
      { name: 'X', values: [seg('A', 'Alpha'), seg('B', 'Beta')] },
      't.json',
    );
    expect(violations.length, 'valid segment must produce zero violations').toBe(0);
  });

  it('missing name → violation mentioning name', () => {
    const violations = validateSegment({ values: [seg('A', 'Alpha')] }, 't.json');
    expect(violations.length, 'missing name must violate').toBe(1);
    expect(violations[0].reason, 'reason must mention name').toContain('name');
  });

  it('values missing entirely → violation mentioning values', () => {
    const violations = validateSegment({ name: 'X' }, 't.json');
    expect(violations.length, 'missing values must violate').toBeGreaterThanOrEqual(1);
    expect(
      violations.some((v) => v.reason.includes('values')),
      'reason must mention values',
    ).toBe(true);
  });

  it('values not an array → violation mentioning values', () => {
    const violations = validateSegment({ name: 'X', values: 'nope' }, 't.json');
    expect(violations.length, 'non-array values must violate').toBe(1);
    expect(violations[0].reason, 'reason must mention values').toContain('values');
  });

  it('intentional empty-string value with non-empty description is accepted (Option A relax)', () => {
    // Blank-value sentinel as shipped in defender/def-notification.json.
    const violations = validateSegment(
      { name: 'Notification', values: [seg('', 'No notification'), seg('WithNotification', 'Enabled')] },
      't.json',
    );
    expect(violations.length, 'empty-string value must be accepted').toBe(0);
  });

  it('whitespace-only value → violation naming values[0].value', () => {
    const violations = validateSegment({ name: 'X', values: [seg('   ', 'd')] }, 't.json');
    expect(violations.length, 'whitespace-only value must violate').toBe(1);
    expect(violations[0].reason, 'locator form').toContain('values[0].value');
  });

  it('non-string value → violation naming values[0].value', () => {
    const violations = validateSegment({ name: 'X', values: [seg(42, 'd')] }, 't.json');
    expect(violations.length, 'non-string value must violate').toBe(1);
    expect(violations[0].reason, 'locator form').toContain('values[0].value');
  });

  it('empty description, whitespace-only description, and non-string description each violate', () => {
    const cases = [
      { entry: seg('A', ''), label: 'empty string' },
      { entry: seg('A', '   '), label: 'whitespace-only' },
      { entry: seg('A', 42), label: 'non-string' },
    ];
    for (const { entry, label } of cases) {
      const violations = validateSegment({ name: 'X', values: [entry] }, 't.json');
      expect(violations.length, `${label} description must violate`).toBe(1);
      expect(violations[0].reason, `${label}: locator form`).toContain('values[0].description');
      expect(violations[0].reason, `${label}: reason mentions description`).toContain('description');
    }
  });

  it('duplicate values within one file → exactly one duplication violation', () => {
    const violations = validateSegment(
      { name: 'X', values: [seg('A', 'first'), seg('B', 'mid'), seg('A', 'again')] },
      't.json',
    );
    const dupes = violations.filter((v) => v.reason.includes('duplicated'));
    expect(dupes.length, 'exactly one duplication violation').toBe(1);
    expect(dupes[0].reason, 'duplication reason names the repeated value').toContain('"A"');
  });

  it('duplicate empty-string sentinels are still flagged as duplicated values', () => {
    const violations = validateSegment(
      { name: 'X', values: [seg('', 'first blank'), seg('', 'second blank')] },
      't.json',
    );
    const dupes = violations.filter((v) => v.reason.includes('duplicated'));
    expect(dupes.length, 'exactly one duplication violation for repeated sentinel').toBe(1);
    expect(
      violations.some((v) => v.reason.includes('description')),
      'both descriptions remain valid so no description violations',
    ).toBe(false);
  });

  it('duplicate entries still get their descriptions validated', () => {
    const violations = validateSegment(
      { name: 'X', values: [seg('A', ''), seg('A', '')] },
      't.json',
    );
    // two empty descriptions + one duplication = 3
    expect(violations.length, 'descriptions validated even on duplicates').toBe(3);
  });

  it('multiple simultaneous defects collected together (collect-all, D-04)', () => {
    const violations = validateSegment(
      { values: [seg('A', ''), seg('B', '')] }, // missing name + two empty descriptions
      't.json',
    );
    expect(violations.length, 'collect-all: >= 3 violations together').toBeGreaterThanOrEqual(3);
  });

  describe('constraints (Phase 17, DATA-02 / D-01..D-07)', () => {
    it('accepts a valid full declaration with zero violations', () => {
      const violations = validateSegment(
        constrainedSegFile({ allowedPattern: '^[A-Z]+$', minLength: 2, maxLength: 8 }),
        't.json',
      );
      expect(violations.length, 'well-formed constraints must pass clean').toBe(0);
    });

    it('empty constraints object is a valid no-op (D-07)', () => {
      const violations = validateSegment(constrainedSegFile({}), 't.json');
      expect(violations.length, 'empty constraints must produce zero violations').toBe(0);
    });

    it('non-compilable allowedPattern → violation naming constraints.allowedPattern', () => {
      const violations = validateSegment(
        constrainedSegFile({ allowedPattern: '[' }),
        't.json',
      );
      expect(violations.length, 'non-compilable pattern must violate').toBeGreaterThanOrEqual(1);
      expect(violations[0].reason, 'reason must name constraints.allowedPattern').toContain(
        'constraints.allowedPattern',
      );
    });

    it('non-string allowedPattern → violation mentioning constraints.allowedPattern', () => {
      const violations = validateSegment(constrainedSegFile({ allowedPattern: 42 }), 't.json');
      expect(violations.length, 'numeric allowedPattern must violate').toBe(1);
      expect(violations[0].reason, 'reason must mention constraints.allowedPattern').toContain(
        'constraints.allowedPattern',
      );
    });

    it('negative minLength → violation containing constraints.minLength', () => {
      const violations = validateSegment(constrainedSegFile({ minLength: -1 }), 't.json');
      expect(violations.length, 'negative minLength must violate').toBe(1);
      expect(violations[0].reason, 'reason must contain constraints.minLength').toContain(
        'constraints.minLength',
      );
    });

    it('non-integer maxLength → violation containing constraints.maxLength', () => {
      const violations = validateSegment(constrainedSegFile({ maxLength: 1.5 }), 't.json');
      expect(violations.length, 'float maxLength must violate').toBe(1);
      expect(violations[0].reason, 'reason must contain constraints.maxLength').toContain(
        'constraints.maxLength',
      );
    });

    it('string-typed minLength → violation containing constraints.minLength', () => {
      const violations = validateSegment(constrainedSegFile({ minLength: '2' }), 't.json');
      expect(violations.length, 'string minLength must violate').toBe(1);
      expect(violations[0].reason, 'reason must contain constraints.minLength').toContain(
        'constraints.minLength',
      );
    });

    it('minLength > maxLength → exactly one cross-key violation naming both', () => {
      const violations = validateSegment(
        constrainedSegFile({ minLength: 5, maxLength: 2 }),
        't.json',
      );
      expect(violations.length, 'individually-valid inverted lengths yield exactly one violation').toBe(1);
      const reason = violations[0].reason;
      expect(reason, 'reason mentions minLength').toContain('minLength');
      expect(reason, 'reason mentions maxLength').toContain('maxLength');
    });

    it('constraints as string instead of object → violation', () => {
      const violations = validateSegment(constrainedSegFile('^[A-Z]+$'), 't.json');
      expect(violations[0].reason, 'string constraints rejected').toContain(
        'constraints must be an object',
      );
    });

    it('constraints as array → violation', () => {
      const violations = validateSegment(constrainedSegFile([]), 't.json');
      expect(violations[0].reason, 'array constraints rejected').toContain(
        'constraints must be an object',
      );
    });

    it('constraints as null → violation', () => {
      const violations = validateSegment(constrainedSegFile(null), 't.json');
      expect(violations[0].reason, 'null constraints rejected').toContain(
        'constraints must be an object',
      );
    });

    it('collect-all across constraint keys: three simultaneous defects ≥3 violations', () => {
      const violations = validateSegment(
        constrainedSegFile({ allowedPattern: '[', minLength: -1, maxLength: 'x' }),
        't.json',
      );
      expect(violations.length, 'collect-all within the declaration').toBeGreaterThanOrEqual(3);
    });

    it('valid declaration coexists with a legacy value defect — both reported', () => {
      const violations = validateSegment(
        constrainedSegFile(
          { allowedPattern: '^[A-Z]+$', minLength: 1 },
          { values: [seg('A', 'first'), seg('A', 'again')] }, // duplicate value
        ),
        't.json',
      );
      const dupes = violations.filter((v) => v.reason.includes('duplicated'));
      expect(dupes.length, 'duplicate-value violation still present').toBe(1);
      expect(violations.length, 'declaration checks do not suppress legacy checks').toBeGreaterThanOrEqual(2);
    });

    it('absence of constraints key leaves legacy path untouched', () => {
      const violations = validateSegment(
        { name: 'X', values: [seg('A', 'Alpha')] },
        't.json',
      );
      expect(violations.length, 'plain segment without constraints passes clean').toBe(0);
    });
  });
});

describe('validateRule', () => {
  // Full azure-key-vault-shaped rule with every optional field populated.
  const fullRule = () => ({
    id: 'azure-key-vault',
    category: 'Azure',
    name: 'Key Vault',
    description: 'Azure key vault naming per CAF.',
    pattern: 'kv-[Workload]-[Environment]',
    fields: [
      {
        name: 'Workload',
        library: 'azure/caf-workloads',
        defaultValue: 'app',
        examples: ['payroll'],
        allowCustomValue: true,
        allowedValues: ['st', 'kv'],
        tip: 'Use your workload identifier.',
      },
    ],
    examples: ['KV-APP-PROD-FRC'],
    builder: {
      separator: '-',
      defaultSegments: ['Workload'],
      availableSegments: ['Custom'],
      recommendedSegments: ['Workload'],
      lockedSegments: [],
      fixedFirstSegments: ['Workload'],
      fixedLastSegments: [],
    },
    validation: { maxLength: 24, allowedPattern: '^[a-z]+$' },
  });

  it('accepts a fully-populated rule with zero violations', () => {
    const violations = validateRule(fullRule(), 'rule.json');
    expect(violations.length, 'fully-populated valid rule must pass clean').toBe(0);
  });

  it.each(['id', 'category', 'pattern'])('missing %s → violation naming the key', (key) => {
    const rule = fullRule();
    delete rule[key];
    const violations = validateRule(rule, 'rule.json');
    expect(
      violations.some((v) => v.reason.includes(key)),
      `violation reason must mention ${key}`,
    ).toBe(true);
  });

  it('empty description violates (D-02 top-level rule description)', () => {
    const violations = validateRule({ ...fullRule(), description: '' }, 'rule.json');
    expect(violations.length, 'empty rule description must violate').toBe(1);
    expect(violations[0].reason, 'reason must mention description').toContain('description');
  });

  it('fields not an array → violation', () => {
    const violations = validateRule({ ...fullRule(), fields: 'nope' }, 'rule.json');
    expect(
      violations.some((v) => v.reason.includes('fields')),
      'non-array fields must violate',
    ).toBe(true);
  });

  it('field with non-string library → violation mentioning library', () => {
    const rule = fullRule();
    rule.fields = [{ library: 7 }];
    const violations = validateRule(rule, 'rule.json');
    expect(violations.length, 'numeric library must violate').toBe(1);
    expect(violations[0].reason, 'reason must mention library').toContain('library');
  });

  it('structural checks on builder/validation when present', () => {
    const rule = fullRule();
    rule.builder.separator = 5;
    rule.builder.defaultSegments = 'Workload';
    rule.validation.maxLength = '24';
    rule.validation.allowedPattern = 9;
    const violations = validateRule(rule, 'rule.json');
    expect(violations.length, 'all four structural defects collected').toBe(4);
    expect(violations.map((v) => v.reason).join(' '), 'reasons name the offending keys').toContain(
      'builder.separator',
    );
  });
});

describe('validateGenerator', () => {
  // ca-policy-id-shaped generator object.
  const fullGenerator = () => ({
    name: 'PolicyId',
    type: 'caPolicyId',
    personaSource: 'CA-Persona',
    personaRanges: { ALLUSERS: 'Global', ADMINS: 'Admins' },
  });

  it('accepts a ca-policy-id-shaped generator with zero violations', () => {
    const violations = validateGenerator(fullGenerator(), 'gen.json');
    expect(violations.length, 'valid generator must pass clean').toBe(0);
  });

  it('missing type → violation mentioning type', () => {
    const gen = fullGenerator();
    delete gen.type;
    const violations = validateGenerator(gen, 'gen.json');
    expect(violations.length, 'missing type must violate').toBe(1);
    expect(violations[0].reason, 'reason must mention type').toContain('type');
  });

  it('personaRanges as array → violation', () => {
    const violations = validateGenerator({ ...fullGenerator(), personaRanges: [] }, 'gen.json');
    expect(violations.length, 'array personaRanges must violate').toBe(1);
    expect(violations[0].reason, 'reason must mention personaRanges').toContain('personaRanges');
  });

  it('personaRanges with non-string values → violation', () => {
    const violations = validateGenerator(
      { ...fullGenerator(), personaRanges: { A: 5 } },
      'gen.json',
    );
    expect(violations.length, 'numeric map value must violate').toBe(1);
    expect(violations[0].reason, 'reason must mention personaRanges').toContain('personaRanges');
  });
});

describe('scanData end-to-end (D-06)', () => {
  let tmp;
  let tmpHappy;

  beforeAll(async () => {
    // OS temp area only — never inside the repo (T-16-03).
    tmp = await mkdtemp(join(tmpdir(), 'check-data-'));
    await mkdir(join(tmp, 'src', 'data', 'segments'), { recursive: true });
    // Parse-error path: syntactically invalid JSON.
    await writeFile(join(tmp, 'src', 'data', 'segments', 'broken-syntax.json'), '{ not json');
    // Structural path: empty description + duplicate value.
    await writeFile(
      join(tmp, 'src', 'data', 'segments', 'bad-segment.json'),
      JSON.stringify({
        name: 'Bad',
        values: [
          { value: 'A', description: '' },
          { value: 'A', description: 'ok' },
        ],
      }),
    );

    // Happy path root: one valid segment + one with an intentional
    // empty-string blank-value sentinel (Option A relax on Plan 16-02).
    tmpHappy = await mkdtemp(join(tmpdir(), 'check-data-pass-'));
    await mkdir(join(tmpHappy, 'src', 'data', 'segments'), { recursive: true });
    await writeFile(
      join(tmpHappy, 'src', 'data', 'segments', 'good-segment.json'),
      JSON.stringify({ name: 'Good', values: [{ value: 'A', description: 'fine' }] }),
    );
    await writeFile(
      join(tmpHappy, 'src', 'data', 'segments', 'blank-sentinel-segment.json'),
      JSON.stringify({
        name: 'Notification',
        values: [
          { value: '', description: 'No notification' },
          { value: 'WithNotification', description: 'Notifications enabled' },
        ],
      }),
    );
  });

  afterAll(async () => {
    await rm(tmp, { recursive: true, force: true });
    await rm(tmpHappy, { recursive: true, force: true });
  });

  it('scanData collects BOTH parse-error and structural violations (collect-all)', async () => {
    const { scanData: scan } = await import('./check-data.mjs');
    const { violations, fileCount } = scan(tmp);
    expect(fileCount, 'both files scanned').toBe(2);
    expect(violations.length, 'parse error + structural defects reported together').toBeGreaterThanOrEqual(2);
    const parseViolation = violations.find((v) => v.reason.includes('invalid JSON'));
    expect(parseViolation, 'one parse-error violation present').toBeDefined();
    const structural = violations.find((v) => !v.reason.includes('invalid JSON'));
    expect(structural, 'structural violations present').toBeDefined();
  });

  it('all file fields are forward-slash relative paths under src/data/segments/', () => {
    const { violations } = scanData(tmp);
    for (const v of violations) {
      expect(v.file.startsWith('src/data/segments/'), `forward-slash rel path: ${v.file}`).toBe(true);
    }
  });

  it('CLI exits non-zero naming the file and reason (roadmap criterion)', () => {
    const res = spawnSync(process.execPath, [SCRIPT_PATH], { cwd: tmp, encoding: 'utf8' });
    expect(res.status === 0 ? 1 : 0, 'CLI must exit non-zero on bad data').toBe(0);
    const output = res.stdout + res.stderr;
    expect(output, 'output names the offending file').toContain('bad-segment.json');
    expect(output, 'output names the duplicate-value defect').toContain('duplicated');
    expect(output, 'summary line present').toMatch(/\d+ files?, \d+ errors?/);
  });

  it('CLI exits 0 with DATA GATE PASS on a clean tree (incl. empty-value sentinel)', () => {
    const res = spawnSync(process.execPath, [SCRIPT_PATH], { cwd: tmpHappy, encoding: 'utf8' });
    expect(res.status, 'clean tree exits 0').toBe(0);
    expect(res.stdout + res.stderr, 'explicit pass line printed (T-16-04)').toContain(
      'DATA GATE PASS',
    );
  });
});
