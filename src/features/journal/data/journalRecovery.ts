import { readJson, storageKey, writeJson, type KeyValueStorage } from '../../../lib/storage';
import { JOURNAL_SECTION_KEYS, type JournalEntry } from '../journal.types';

export interface JournalRecoverySnapshot {
  entry: JournalEntry;
  capturedAt: string;
}

/**
 * Last-resort copy of unsaved writing, kept separate from the main repository
 * (session storage by default). It is written when a save fails or the page is
 * hidden with changes pending, and cleared once a save succeeds.
 */
export interface JournalRecoveryStore {
  /** Best effort; returns whether a backup copy was kept. Never throws. */
  capture(entry: JournalEntry): boolean;
  read(entryId: string): JournalRecoverySnapshot | undefined;
  clear(entryId: string): void;
}

function isSnapshot(value: unknown): value is JournalRecoverySnapshot {
  if (typeof value !== 'object' || value === null) return false;
  const { entry, capturedAt } = value as Partial<JournalRecoverySnapshot>;
  return typeof capturedAt === 'string' && typeof entry?.id === 'string';
}

export function createJournalRecoveryStore(
  storage: KeyValueStorage | null,
  now: () => Date = () => new Date(),
): JournalRecoveryStore {
  const key = (entryId: string) => storageKey('journal-recovery', entryId);

  return {
    capture(entry) {
      if (!storage) return false;
      try {
        writeJson(storage, key(entry.id), { entry, capturedAt: now().toISOString() });
        return true;
      } catch {
        return false;
      }
    },
    read(entryId) {
      if (!storage) return undefined;
      try {
        const value = readJson(storage, key(entryId));
        return isSnapshot(value) ? value : undefined;
      } catch {
        return undefined;
      }
    },
    clear(entryId) {
      try {
        storage?.removeItem(key(entryId));
      } catch {
        // Nothing to recover from a failed cleanup; a stale snapshot is ignored once older than the entry.
      }
    },
  };
}

/** Prefers writing captured after the entry's last successful save. */
export function applyRecoverySnapshot(
  saved: JournalEntry,
  snapshot: JournalRecoverySnapshot | undefined,
): { entry: JournalEntry; recovered: boolean } {
  if (!snapshot || snapshot.entry.id !== saved.id || snapshot.capturedAt <= saved.updatedAt) {
    return { entry: saved, recovered: false };
  }
  const entry: JournalEntry = { ...saved };
  for (const key of JOURNAL_SECTION_KEYS) {
    const doc = snapshot.entry[key];
    if (doc) entry[key] = doc;
  }
  return { entry, recovered: true };
}
