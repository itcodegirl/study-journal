import type { KeyValueStorage } from '../lib/storage';
import type { JournalLinkedObject } from '../features/journal/journal.types';
import { createLocalRecordStore } from './localRecordStore';

/**
 * Persistence boundary shared by cards, questions, and ideas. Components never
 * touch storage directly; a Supabase adapter can implement the same interface.
 */
export interface StudyObjectRepository<T extends JournalLinkedObject> {
  listForEntry(journalEntryId: string): Promise<T[]>;
  create(record: T): Promise<T>;
  update(record: T): Promise<T>;
  remove(id: string): Promise<void>;
}

export function createLocalStudyObjectRepository<T extends JournalLinkedObject>(
  collection: string,
  storage: KeyValueStorage,
): StudyObjectRepository<T> {
  const store = createLocalRecordStore<T>(collection, storage);

  return {
    async listForEntry(journalEntryId) {
      return store
        .list()
        .filter((record) => record.journalEntryId === journalEntryId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
    },
    async create(record) {
      if (store.get(record.id)) throw new Error(`A ${collection} record with id ${record.id} already exists.`);
      store.put(record);
      return record;
    },
    async update(record) {
      if (!store.get(record.id)) throw new Error(`No ${collection} record with id ${record.id} exists.`);
      store.put(record);
      return record;
    },
    async remove(id) {
      store.remove(id);
    },
  };
}
