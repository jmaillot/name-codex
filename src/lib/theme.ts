// Single source of truth for the theme storage key (D-09).
// NOTE: index.html contains an inline pre-paint copy of this key string because
// the boot script must run before any bundle JS loads. Keep BOTH sites in sync
// when renaming this key.
export const THEME_STORAGE_KEY = "name-codex-theme-v14-0";

export type ThemePreference = "light" | "dark";

/**
 * Persist an explicit theme choice. Only "light" | "dark" can ever be written
 * (type-enforced, D-08 explicit-only persistence). Best-effort: storage
 * failures are swallowed so callers never throw in privacy mode.
 */
export function storeTheme(theme: ThemePreference): void {
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Ignore SecurityError (private mode) / QuotaExceededError — persistence is best-effort
  }
}

/**
 * Read the currently applied document theme from <html data-theme>.
 * Anything other than exactly "light" resolves to "dark" (:root default).
 */
export function currentDocumentTheme(): ThemePreference {
  const attr = document.documentElement.getAttribute("data-theme");
  return attr === "light" ? "light" : "dark";
}

/** Apply a theme to the document via the data-theme attribute (attribute only — no styling here). */
export function applyThemeToDocument(theme: ThemePreference): void {
  document.documentElement.setAttribute("data-theme", theme);
}

/** Pure toggle: "light" → "dark", "dark" → "light". */
export function toggleTheme(current: ThemePreference): ThemePreference {
  return current === "light" ? "dark" : "light";
}
