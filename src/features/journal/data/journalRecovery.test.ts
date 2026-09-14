import { describe, expect, it } from 'vitest';
import { MemoryStorage, paragraphDoc } from '../../../test/fakes';
import { createJournalEntry } from '../journal.utils';
import { applyRecoverySnapshot, createJournalRecoveryStore } from './journalRecovery';

const saved = {
  ...createJournalEntry({ id: 'props', title: 'Props' }, new Date('2026-09-13T10:00:00.000Z'), 'entry-1'),
  content: paragraphDoc('Saved text'),
};

describe('journal recovery', () => {
  it('restores writing captured after the last successful save', () => {
    const store = createJournalRecoveryStore(new MemoryStorage(), () => new Date('2026-09-13T10:05:00.000Z'));
    store.capture({ ...saved, content: paragraphDoc('Unsaved text'), myVersion: paragraphDoc('My version') });

    const { entry, recovered } = applyRecoverySnapshot(saved, store.read('entry-1'));

    expect(recovered).toBe(true);
    expect(entry.content).toEqual(paragraphDoc('Unsaved text'));
    expect(entry.myVersion).toEqual(paragraphDoc('My version'));
    expect(entry.updatedAt).toBe(saved.updatedAt);
  });

  it('ignores a snapshot that is older than the saved entry', () => {
    const store = createJournalRecoveryStore(new MemoryStorage(), () => new Date('2026-09-13T09:00:00.000Z'));
    store.capture({ ...saved, content: paragraphDoc('Old draft') });

    expect(applyRecoverySnapshot(saved, store.read('entry-1'))).toEqual({ entry: saved, recovered: false });
  });

  it('reports when a backup cannot be kept, and never throws', () => {
    const storage = new MemoryStorage();
    storage.failWrites = true;
    const store = createJournalRecoveryStore(storage);
    expect(store.capture(saved)).toBe(false);
    expect(createJournalRecoveryStore(null).capture(saved)).toBe(false);
  });

  it('clears a snapshot after a successful save', () => {
    const store = createJournalRecoveryStore(new MemoryStorage());
    store.capture(saved);
    store.clear('entry-1');
    expect(store.read('entry-1')).toBeUndefined();
  });
});
