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

export function saveJSON<T>(key: string, value: T): void {
  localStorage.setItem(key, JSON.stringify(value));
}