// Design-token gate (Phase 8, D-06 / T-08-07 mitigation)
// 1. Literal gate: zero hardcoded color literals in src/**/*.css outside tokens.css
//    (documented allowlist: lines containing "brand-lockup exception")
// 2. Contrast gate: WCAG ratios of text tokens on every navy surface layer
//    --text-primary >= 7:1 and --text-secondary >= 4.5:1 on all four surfaces.
// Node >= 18, ESM, zero dependencies.

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');
const TOKENS_FILE = 'tokens.css';
const ALLOWLIST_MARKER = 'brand-lockup exception';

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/;
const FUNC_RE = /\b(?:rgb|rgba|hsl|hsla)\(/i;
// CSS named colors. Lookarounds prevent property-name false positives like
// `white-space` / `-moz-blue-...`. `transparent` is a structural keyword used
// legitimately across the CSS and is intentionally NOT treated as a literal.
const NAMED_COLOR_RE =
  /(?<![\w-])(?:white|black|silver|gray|grey|red|maroon|yellow|olive|lime|green|aqua|cyan|teal|blue|navy|fuchsia|magenta|purple|orange|pink|brown|gold)(?![\w-])/i;

function walkCss(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkCss(full));
    else if (entry.name.endsWith('.css')) out.push(full);
  }
  return out;
}

// --- Gate 1: color literals outside tokens.css ---

const violations = [];
for (const file of walkCss(SRC)) {
  if (file.includes(TOKENS_FILE)) continue;
  const rel = relative(ROOT, file).split(sep).join('/');
  const lines = readFileSync(file, 'utf8').split('\n');
  let inAllowlist = false;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.includes(ALLOWLIST_MARKER)) {
      // Marker covers the rest of the current rule block (multi-line values).
      inAllowlist = true;
      continue;
    }
    if (inAllowlist) {
      if (line.includes('}')) inAllowlist = false;
      continue;
    }
    if (HEX_RE.test(line) || FUNC_RE.test(line) || NAMED_COLOR_RE.test(line)) {
      violations.push({ file: rel, line: i + 1, snippet: line.trim() });
    }
  }
}

if (violations.length > 0) {
  console.error('TOKEN GATE FAIL — hardcoded color literals outside tokens.css:');
  for (const v of violations) {
    console.error(`  ${v.file}:${v.line}: ${v.snippet}`);
  }
  process.exit(1);
}

// --- Gate 2: WCAG contrast of text tokens on navy surfaces ---

function parseTokens(css) {
  const map = new Map();
  for (const m of css.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    map.set(`--${m[1]}`, m[2].trim());
  }
  return map;
}

function resolveHex(value, tokens, seen = new Set()) {
  let v = value.trim();
  while (v.startsWith('var(') && !seen.has(v)) {
    seen.add(v);
    const name = v.slice(4, v.indexOf(')')).trim();
    v = tokens.get(name) ?? '';
  }
  const m = v.match(/^#([0-9a-fA-F]{6})$/);
  return m ? `#${m[1]}` : null;
}

function hexToRgb(hex) {
  return [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
}

function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((c) => {
    const s = c / 255;
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const l1 = luminance(a);
  const l2 = luminance(b);
  const [hi, lo] = l1 >= l2 ? [l1, l2] : [l2, l1];
  return (hi + 0.05) / (lo + 0.05);
}

const tokensCss = readFileSync(join(SRC, 'styles', TOKENS_FILE), 'utf8');
const tokens = parseTokens(tokensCss);

const textTokens = ['--text-primary', '--text-secondary'];
const surfaces = [
  '--surface-canvas',
  '--surface-raised',
  '--surface-panel',
  '--surface-overlay',
];
const thresholds = { '--text-primary': 7, '--text-secondary': 4.5 };

let passCount = 0;
const failures = [];

for (const text of textTokens) {
  const textColor = resolveHex(tokens.get(text), tokens);
  for (const surface of surfaces) {
    const surfaceColor = resolveHex(tokens.get(surface), tokens);
    if (!textColor || !surfaceColor) {
      failures.push(`${text} on ${surface}: unresolvable token value`);
      continue;
    }
    const ratio = contrast(textColor, surfaceColor);
    const min = thresholds[text];
    if (ratio >= min) {
      passCount++;
    } else {
      failures.push(
        `${text} on ${surface}: ${ratio.toFixed(2)}:1 < required ${min}:1`
      );
    }
  }
}

if (failures.length > 0) {
  console.error('TOKEN GATE FAIL — WCAG contrast below thresholds:');
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}

console.log(
  `TOKEN GATE PASS (literals: 0 violations, contrast: ${passCount}/8 pairs)`
);
