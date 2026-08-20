import i18n from "../i18n";

function tl(key: string, fallback: string, vars?: Record<string, string | number>): string {
  return i18n.t(key, { defaultValue: fallback, ...vars });
}

export { tl };