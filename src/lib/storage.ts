// localStorage helpers: everything is per-browser, and storage may be missing (private mode, previews)
export function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function save(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore: storage full or blocked
  }
}

export function loadSet(key: string, valid: (id: string) => boolean): Set<string> {
  const v = load<unknown>(key, []);
  return new Set(
    Array.isArray(v) ? v.filter((x): x is string => typeof x === 'string' && valid(x)) : [],
  );
}

// same keys as the single-file page (each site/origin still keeps its own copy)
export const KEYS = {
  have: 'gtnhBeesHave',
  nope: 'gtnhBeesNope',
  fav: 'gtnhBeesFav',
  filters: 'gtnhBeesFilters',
} as const;
