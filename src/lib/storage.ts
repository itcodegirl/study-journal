export const STORAGE_NAMESPACE = 'study-journal:v1';

export type KeyValueStorage = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

export function storageKey(...parts: string[]): string {
  return [STORAGE_NAMESPACE, ...parts].join(':');
}

/** Returns undefined for a missing key. Corrupt JSON throws so callers never overwrite it blindly. */
export function readJson(storage: KeyValueStorage, key: string): unknown {
  const raw = storage.getItem(key);
  return raw === null ? undefined : JSON.parse(raw);
}

/** Throws when the browser refuses the write (quota, private mode) so saves can report failure. */
export function writeJson(storage: KeyValueStorage, key: string, value: unknown): void {
  storage.setItem(key, JSON.stringify(value));
}

/** Storage access itself can throw (disabled cookies, sandboxed frames). */
export function getBrowserStorage(kind: 'local' | 'session'): KeyValueStorage | null {
  try {
    return kind === 'local' ? window.localStorage : window.sessionStorage;
  } catch {
    return null;
  }
}

/** For UI preferences only: a preference that fails to load or save is not worth an error. */
export function readPreference<T>(key: string, isValid: (value: unknown) => value is T): T | undefined {
  const storage = getBrowserStorage('local');
  if (!storage) return undefined;
  try {
    const value = readJson(storage, storageKey('ui', key));
    return isValid(value) ? value : undefined;
  } catch {
    return undefined;
  }
}

export function writePreference(key: string, value: unknown): void {
  const storage = getBrowserStorage('local');
  if (!storage) return;
  try {
    writeJson(storage, storageKey('ui', key), value);
  } catch {
    // Preferences are a convenience; ignore quota or privacy-mode failures.
  }
}
