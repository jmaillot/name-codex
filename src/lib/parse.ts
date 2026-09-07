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

export type PatternLiterals = {
  literalPrefixes: Map<string, string>;
  patternSegmentOrder: string[];
  patternSuffix: string;
  lastPatternSegment: string | undefined;
};

/** Split a pattern into per-segment literal prefixes plus any trailing suffix. */
export function parsePatternLiterals(pattern: string): PatternLiterals {
  const literalPrefixes = new Map<string, string>();
  const patternSegmentOrder: string[] = [];
  let pendingLiteral = "";
  for (const token of parsePattern(pattern)) {
    if (token.type === "literal") {
      pendingLiteral += token.value;
    } else {
      literalPrefixes.set(token.value, pendingLiteral);
      patternSegmentOrder.push(token.value);
      pendingLiteral = "";
    }
  }
  return {
    literalPrefixes,
    patternSegmentOrder,
    patternSuffix: pendingLiteral,
    lastPatternSegment: patternSegmentOrder[patternSegmentOrder.length - 1],
  };
}