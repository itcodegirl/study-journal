import { readJson, storageKey, writeJson, type KeyValueStorage } from '../lib/storage';

export interface RecordWithId {
  id: string;
}

/**
 * Synchronous per-record store over Web Storage. Each record lives under its own
 * key with a small id index, so an autosave rewrites one journal entry instead
 * of every entry.
 */
export interface LocalRecordStore<T extends RecordWithId> {
  list(): T[];
  get(id: string): T | undefined;
  put(record: T): void;
  remove(id: string): void;
}

export function createLocalRecordStore<T extends RecordWithId>(
  collection: string,
  storage: KeyValueStorage,
): LocalRecordStore<T> {
  const indexKey = storageKey(collection, 'index');
  const recordKey = (id: string) => storageKey(collection, 'record', id);

  function readIndex(): string[] {
    const value = readJson(storage, indexKey);
    if (value === undefined) return [];
    if (!Array.isArray(value) || !value.every((id) => typeof id === 'string')) {
      throw new Error(`Saved ${collection} data is unreadable.`);
    }
    return value;
  }

  // Records are written only by this module, so a parsed record is trusted as T.
  const readRecord = (id: string) => readJson(storage, recordKey(id)) as T | undefined;

  return {
    list() {
      return readIndex().flatMap((id) => {
        const record = readRecord(id);
        return record ? [record] : [];
      });
    },
    get: readRecord,
    put(record) {
      const index = readIndex();
      writeJson(storage, recordKey(record.id), record);
      if (!index.includes(record.id)) writeJson(storage, indexKey, [...index, record.id]);
    },
    remove(id) {
      const index = readIndex();
      storage.removeItem(recordKey(id));
      if (index.includes(id)) writeJson(storage, indexKey, index.filter((existing) => existing !== id));
    },
  };
}
