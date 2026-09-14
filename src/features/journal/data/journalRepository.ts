import type { KeyValueStorage } from '../../../lib/storage';
import { createLocalRecordStore } from '../../../services/localRecordStore';
import type { Topic } from '../../courses/courses.types';
import type { JournalEntry } from '../journal.types';
import { createJournalEntry } from '../journal.utils';

export interface JournalRepository {
  /**
   * Opens the topic's entry, creating it on first visit. Must be idempotent per
   * topic: a backend adapter should enforce one entry per (learner, topic).
   */
  getOrCreateForTopic(topic: Pick<Topic, 'id' | 'title'>): Promise<JournalEntry>;
  /** Persists the whole entry and returns it with the stored `updatedAt`. */
  save(entry: JournalEntry): Promise<JournalEntry>;
}

export function createLocalJournalRepository(
  storage: KeyValueStorage,
  now: () => Date = () => new Date(),
): JournalRepository {
  const store = createLocalRecordStore<JournalEntry>('journal-entries', storage);

  // Work happens synchronously before the returned promise, so a save started
  // during `pagehide` is on disk before the page unloads.
  return {
    async getOrCreateForTopic(topic) {
      const existing = store.list().find((entry) => entry.topicId === topic.id);
      if (existing) return existing;
      const entry = createJournalEntry(topic, now());
      store.put(entry);
      return entry;
    },
    async save(entry) {
      const saved = { ...entry, updatedAt: now().toISOString() };
      store.put(saved);
      return saved;
    },
  };
}
