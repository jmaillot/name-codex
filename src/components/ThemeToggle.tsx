import { useEffect, useRef, useState } from "react";
import { Moon, Sun } from "lucide-react";
import {
  applyThemeToDocument,
  currentDocumentTheme,
  storeTheme,
  toggleTheme,
  type ThemePreference,
} from "../lib/theme";
import { tl } from "../lib/i18n-utils";

/**
 * ThemeToggle — sun/moon pill in the CommandBar (Phase 12, THEME-L-03).
 *
 * State source of truth is the `data-theme` attribute on <html>, which lives
 * outside React (set pre-paint by the inline script in index.html). Clicking
 * toggles the attribute, persists the explicit choice (D-08 explicit-only),
 * and plays the locked ~175ms color-only fade (D-04) via a transient
 * `theme-anim` class on the document element.
 *
 * Icon semantics per D-01: TARGET theme — moon while light (click → dark),
 * sun while dark (click → light). No OS-preference change listener (D-05);
 * boot-time resolution only.
 */

const THEME_ANIM_CLASS = "theme-anim";
// Fallback removal timer — slightly above the 175ms fade so a missed
// transitionend event can never orphan the class on <html> (T-12-07).
const THEME_ANIM_FALLBACK_MS = 250;

export default function ThemeToggle() {
  const [theme, setTheme] = useState<ThemePreference>(() => currentDocumentTheme());
  const animTimerRef = useRef<number | null>(null);

  // Clear any pending fallback timer on unmount so we never touch the DOM after teardown.
  useEffect(() => {
    return () => {
      if (animTimerRef.current !== null) {
        window.clearTimeout(animTimerRef.current);
      }
    };
  }, []);

  const isLight = theme === "light";
  const label = isLight
    ? tl("ui.themeSwitchToDark", "Switch to dark mode")
    : tl("ui.themeSwitchToLight", "Switch to light mode");

  function handleToggle() {
    const next = toggleTheme(theme);

    // Trigger the global color fade BEFORE flipping the attribute (T-12-07:
    // clear any pending fallback first so rapid clicks never orphan the class).
    document.documentElement.classList.add(THEME_ANIM_CLASS);
    applyThemeToDocument(next);
    storeTheme(next); // explicit-only persistence (D-08)
    setTheme(next);

    if (animTimerRef.current !== null) {
      window.clearTimeout(animTimerRef.current);
    }
    animTimerRef.current = window.setTimeout(() => {
      document.documentElement.classList.remove(THEME_ANIM_CLASS);
      animTimerRef.current = null;
    }, THEME_ANIM_FALLBACK_MS);
  }

  return (
    <div className="theme-toggle" role="presentation">
      <button type="button" className="theme-btn" onClick={handleToggle} title={label} aria-label={label}>
        {isLight ? (
          <Moon size={14} strokeWidth={2} aria-hidden="true" />
        ) : (
          <Sun size={14} strokeWidth={2} aria-hidden="true" />
        )}
      </button>
    </div>
  );
}
