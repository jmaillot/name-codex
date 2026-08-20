export type PatternToken = { type: "literal" | "segment"; value: string };

export function parsePattern(pattern: string): PatternToken[] {
  const tokens: PatternToken[] = [];
  const segmentRe = /\[[^\]]+\]/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = segmentRe.exec(pattern))) {
    if (match.index > lastIndex) {
      tokens.push({ type: "literal", value: pattern.slice(lastIndex, match.index) });
    }
    tokens.push({ type: "segment", value: match[0].slice(1, -1) });
    lastIndex = match.index + match[0].length;
  }
  if (lastIndex < pattern.length) {
    tokens.push({ type: "literal", value: pattern.slice(lastIndex) });
  }
  return tokens;
}

export function patternToSegments(pattern: string): string[] {
  return (pattern.match(/\[[^\]]+\]/g) ?? []).map((segment) => segment.slice(1, -1));
}