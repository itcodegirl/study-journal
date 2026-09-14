import { describe, expect, it } from 'vitest';
import { createStudyIdea } from '../features/ideas/ideas.model';
import type { StudyIdea } from '../features/ideas/ideas.types';
import { MemoryStorage } from '../test/fakes';
import { createLocalStudyObjectRepository } from './studyObjectRepository';

const idea = (id: string, journalEntryId: string, minute: number): StudyIdea =>
  createStudyIdea({
    draft: { title: `Idea ${id}`, description: '', category: '' },
    link: { journalEntryId, topicId: 'props' },
    now: new Date(Date.UTC(2026, 8, 13, 10, minute)),
    id,
  });

describe('local study object repository', () => {
  it('lists only the objects linked to the requested entry, oldest first', async () => {
    const repository = createLocalStudyObjectRepository<StudyIdea>('ideas', new MemoryStorage());
    await repository.create(idea('b', 'entry-1', 2));
    await repository.create(idea('a', 'entry-1', 1));
    await repository.create(idea('other', 'entry-2', 0));

    expect((await repository.listForEntry('entry-1')).map((item) => item.id)).toEqual(['a', 'b']);
  });

  it('persists across repository instances, as after a page refresh', async () => {
    const storage = new MemoryStorage();
    await createLocalStudyObjectRepository<StudyIdea>('ideas', storage).create(idea('a', 'entry-1', 1));

    const afterRefresh = createLocalStudyObjectRepository<StudyIdea>('ideas', storage);
    expect(await afterRefresh.listForEntry('entry-1')).toEqual([idea('a', 'entry-1', 1)]);
  });

  it('updates and removes by stable id', async () => {
    const repository = createLocalStudyObjectRepository<StudyIdea>('ideas', new MemoryStorage());
    const original = idea('a', 'entry-1', 1);
    await repository.create(original);
    await repository.update({ ...original, title: 'Renamed' });
    expect((await repository.listForEntry('entry-1'))[0]?.title).toBe('Renamed');

    await repository.remove('a');
    expect(await repository.listForEntry('entry-1')).toEqual([]);
  });

  it('refuses duplicate ids and updates to missing records', async () => {
    const repository = createLocalStudyObjectRepository<StudyIdea>('ideas', new MemoryStorage());
    await repository.create(idea('a', 'entry-1', 1));
    await expect(repository.create(idea('a', 'entry-1', 1))).rejects.toThrow(/already exists/);
    await expect(repository.update(idea('missing', 'entry-1', 1))).rejects.toThrow(/No ideas record/);
  });

  it('surfaces storage failures instead of pretending to save', async () => {
    const storage = new MemoryStorage();
    storage.failWrites = true;
    const repository = createLocalStudyObjectRepository<StudyIdea>('ideas', storage);
    await expect(repository.create(idea('a', 'entry-1', 1))).rejects.toThrow();
  });

  it('refuses to read over corrupt data rather than overwriting it', async () => {
    const storage = new MemoryStorage();
    storage.setItem('study-journal:v1:ideas:index', '{not json');
    const repository = createLocalStudyObjectRepository<StudyIdea>('ideas', storage);
    await expect(repository.listForEntry('entry-1')).rejects.toThrow();
    await expect(repository.create(idea('a', 'entry-1', 1))).rejects.toThrow();
    expect(storage.getItem('study-journal:v1:ideas:index')).toBe('{not json');
  });
});
