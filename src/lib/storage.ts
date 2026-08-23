export const STORAGE_KEYS = {
  history: "name-codex-history-v11-6",
  favorites: "name-codex-favorites-v11-6",
  lastObjectByCategory: "name-codex-last-object-by-category-v11-6",
} as const;

export function loadJSON<T>(key: string): T | null {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadJSONArray(key: string): string[] | null {
  const parsed = loadJSON<unknown>(key);
  if (!Array.isArray(parsed)) return null;
  return parsed.every((v) => typeof v === "string") ? (parsed as string[]) : null;
}

export function loadJSONRecord(key: string): Record<string, string> | null {
  const parsed = loadJSON<unknown>(key);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  return Object.values(parsed).every((v) => typeof v === "string") ? (parsed as Record<string, string>) : null;
}

export function saveJSON<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Ignore SecurityError (private mode) / QuotaExceededError — persistence is best-effort
  }
}