// Design-token gate (Phase 8, D-06 / T-08-07 mitigation)
// 1. Literal gate: zero hardcoded color literals in src/**/*.css outside tokens.css
//    (documented allowlist: lines containing "brand-lockup exception")
// 2. Contrast gate: WCAG ratios of text tokens on every navy surface layer
//    --text-primary >= 7:1 and --text-secondary >= 4.5:1 on all four surfaces,
//    plus --text-on-accent >= 4.5:1 on both accent fills (WR-01).
// Node >= 18, ESM, zero dependencies.

import { readdirSync, readFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

const ROOT = process.cwd();
const SRC = join(ROOT, 'src');
// Canonical path: Gate 1 exempts exactly this file (substring matching would
// silently exempt future files like theme-tokens.css).
const TOKENS_PATH = join(SRC, 'styles', 'tokens.css');
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
  if (file === TOKENS_PATH) continue;
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
// Theme-scoped (Phase 11, D-06): the dark `:root` block and the light
// `:root[data-theme="light"]` block are parsed into SEPARATE maps — never
// merged — and the full pair matrix runs once per theme. Light resolves
// var() chains against its own values first, falling back to the dark map
// for inherited tokens (--text-on-accent, --border-focus).

function extractBlock(css, selectorRe, label) {
  const m = css.match(selectorRe);
  if (!m) throw new Error(`Gate 2: could not locate ${label} block in tokens.css`);
  let i = m.index + m[0].length;
  if (css[i - 1] !== '{') {
    while (i < css.length && css[i] !== '{') i++;
    if (i >= css.length) throw new Error(`Gate 2: ${label} block has no opening brace`);
    i++;
  }
  let depth = 0;
  const start = i;
  for (; i < css.length; i++) {
    if (css[i] === '{') depth++;
    else if (css[i] === '}') {
      if (depth === 0) return css.slice(start, i);
      depth--;
    }
  }
  throw new Error(`Gate 2: ${label} block is not closed`);
}

function parseTokens(block) {
  const map = new Map();
  for (const m of block.matchAll(/--([\w-]+)\s*:\s*([^;]+);/g)) {
    map.set(`--${m[1]}`, m[2].trim());
  }
  return map;
}

// Resolves a raw value through var() chains within ONE theme scope.
// Missing/circular/unhexable values are LOUD errors — never silent defaults.
function resolveHex(value, own, fallback, seen = new Set()) {
  let v = value.trim();
  while (v.startsWith('var(')) {
    if (seen.has(v)) throw new Error(`circular var() reference at "${v}"`);
    seen.add(v);
    const name = v.slice(4, v.indexOf(')')).trim();
    const next = own.get(name) ?? fallback?.get(name);
    if (next === undefined) throw new Error(`unresolvable token "${name}"`);
    v = next;
  }
  const m = v.match(/^#([0-9a-fA-F]{6})$/);
  if (!m) throw new Error(`value does not resolve to a hex color: "${v}"`);
  return `#${m[1]}`;
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

const tokensCss = readFileSync(TOKENS_PATH, 'utf8');

const darkMap = parseTokens(
  extractBlock(tokensCss, /(^|\s):root\s*\{/, ':root (dark)')
);
const lightMap = parseTokens(
  extractBlock(
    tokensCss,
    /:root\[data-theme=["']light["']\]\s*\{/,
    ':root[data-theme="light"]'
  )
);

const themes = [
  { tag: 'dark', own: darkMap, fallback: null },
  { tag: 'light', own: lightMap, fallback: darkMap },
];

const surfaces = [
  '--surface-canvas',
  '--surface-raised',
  '--surface-panel',
  '--surface-overlay',
];

// (foreground, background, minimum ratio). Rule per WR-01 + UI-SPEC D-2
// (#4f8cff stays the accent): any fill carrying --text-on-accent text MUST use
// --accent-strong; bare --accent fills are decorative/text-free.
const checks = [
  ...surfaces.map((s) => ({ fg: '--text-primary', bg: s, min: 7 })),
  ...surfaces.map((s) => ({ fg: '--text-secondary', bg: s, min: 4.5 })),
  { fg: '--text-on-accent', bg: '--accent-strong', min: 4.5 },
];

let passCount = 0;
const totalPairs = checks.length * themes.length;
const failures = [];

for (const theme of themes) {
  for (const { fg, bg, min } of checks) {
    let ratio;
    try {
      const textColor = resolveHex(
        theme.own.get(fg) ?? theme.fallback?.get(fg),
        theme.own,
        theme.fallback
      );
      const bgColor = resolveHex(
        theme.own.get(bg) ?? theme.fallback?.get(bg),
        theme.own,
        theme.fallback
      );
      ratio = contrast(textColor, bgColor);
    } catch (err) {
      failures.push(`[${theme.tag}] ${fg} on ${bg}: ${err.message}`);
      console.log(`  [${theme.tag}] ${fg} on ${bg}: UNRESOLVABLE (${err.message})`);
      continue;
    }
    const ok = ratio >= min;
    if (ok) passCount++;
    else failures.push(`[${theme.tag}] ${fg} on ${bg}: ${ratio.toFixed(2)}:1 < required ${min}:1`);
    console.log(
      `  [${theme.tag}] ${fg} on ${bg}: ${ratio.toFixed(2)}:1 (min ${min}:1) ${ok ? 'PASS' : 'FAIL'}`
    );
  }
}

if (failures.length > 0) {
  console.error('TOKEN GATE FAIL — WCAG contrast below thresholds or unresolvable:');
  for (const f of failures) console.error(`  ${f}`);
  process.exit(1);
}

const perTheme = themes
  .map((t) => `${t.tag} ${checks.length}/${checks.length}`)
  .join(', ');
console.log('TOKEN GATE PASS (literals: 0 violations)');
console.log(`WCAG: ${passCount}/${totalPairs} pairs pass (${perTheme})`);
