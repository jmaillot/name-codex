import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import en from "./locales/en.json";
import fr from "./locales/fr.json";

const LANG_KEY = "name-codex-lang";

const stored = typeof window !== "undefined" ? localStorage.getItem(LANG_KEY) : null;

type Nested = Record<string, unknown>;

function flatten(obj: Nested, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    const path =
      prefix && !key.startsWith(`${prefix}.`) ? `${prefix}.${key}` : key;
    if (typeof value === "string") {
      out[path] = value;
    } else if (value && typeof value === "object") {
      Object.assign(out, flatten(value as Nested, path));
    }
  }
  return out;
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: flatten(en as Nested) },
    fr: { translation: flatten(fr as Nested) },
  },
  lng: stored ?? "en",
  fallbackLng: "en",
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
});

export function setLanguage(lang: string) {
  i18n.changeLanguage(lang);
  localStorage.setItem(LANG_KEY, lang);
}

export default i18n;