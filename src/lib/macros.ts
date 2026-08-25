/**
 * Macro helpers for %RAND:n% expansion budgeting.
 *
 * Security (T-14-04-01): all regexes are anchored simple quantifiers over
 * digits only — linear time, no lookahead or nesting (T-14-02-01 precedent).
 */

/** Extract the width n of a pure %RAND:n% value; null for anything else. */
export function randWidth(value: string): number | null {
  const m = /^%RAND:(\d+)%$/.exec(value.trim());
  return m ? Number(m[1]) : null;
}

/**
 * Length of the name after RAND macros expand at enrollment.
 * Returns null when the value contains an unknown macro (%SERIAL%)
 * or a stray %, because its expanded length is unknowable client-side.
 */
export function expandedLength(value: string): number | null {
  let total = 0;
  const rest = value.replace(/%RAND:(\d+)%/g, (_s: string, n: string) => {
    total += Number(n);
    return "";
  });
  if (rest.includes("%")) return null; // unknown macro (%SERIAL%) or stray %
  return rest.length + total;
}
