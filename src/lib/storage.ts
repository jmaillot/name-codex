export const STORAGE_KEYS = {
  history: "name-codex-history-v11-6",
  favorites: "name-codex-favorites-v11-6",
  lastObjectByCategory: "name-codex-last-object-by-category-v11-6",
} as const;

export function loadJSON<T>(key: string): T | null {
  const raw = localStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export function loadJSONArray(key: string): string[] | null {
  const parsed = loadJSON<unknown>(key);
  return Array.isArray(parsed) ? (parsed as string[]) : null;
}

export function loadJSONRecord(key: string): Record<string, string> | null {
  const parsed = loadJSON<unknown>(key);
  if (parsed === null || typeof parsed !== "object" || Array.isArray(parsed)) return null;
  return parsed as Record<string, string>;
}

export function saveJSON<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}