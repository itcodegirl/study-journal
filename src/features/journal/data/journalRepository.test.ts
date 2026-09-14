import { describe, expect, it } from 'vitest';
import { MemoryStorage, paragraphDoc } from '../../../test/fakes';
import { createLocalJournalRepository } from './journalRepository';

const topic = { id: 'state-derived-from-props', title: 'State derived from props' };

describe('local journal repository', () => {
  it('creates one entry per topic and reopens the same entry afterwards', async () => {
    const storage = new MemoryStorage();
    const repository = createLocalJournalRepository(storage);

    const [first, concurrent] = await Promise.all([
      repository.getOrCreateForTopic(topic),
      repository.getOrCreateForTopic(topic),
    ]);
    const afterRefresh = await createLocalJournalRepository(storage).getOrCreateForTopic(topic);

    expect(first.id).toBe(concurrent.id);
    expect(afterRefresh.id).toBe(first.id);
    expect(first).toMatchObject({ topicId: topic.id, title: topic.title });
  });

  it('keeps entries for different topics separate', async () => {
    const repository = createLocalJournalRepository(new MemoryStorage());
    const a = await repository.getOrCreateForTopic(topic);
    const b = await repository.getOrCreateForTopic({ id: 'props', title: 'Props' });
    expect(a.id).not.toBe(b.id);
  });

  it('saves structured content and stamps updatedAt', async () => {
    const storage = new MemoryStorage();
    const savedAt = new Date('2026-09-13T12:00:00.000Z');
    const repository = createLocalJournalRepository(storage, () => savedAt);
    const entry = await repository.getOrCreateForTopic(topic);

    const saved = await repository.save({ ...entry, content: paragraphDoc('Derived state goes stale.') });
    const reopened = await createLocalJournalRepository(storage).getOrCreateForTopic(topic);

    expect(saved.updatedAt).toBe(savedAt.toISOString());
    expect(reopened.content).toEqual(paragraphDoc('Derived state goes stale.'));
  });
});
