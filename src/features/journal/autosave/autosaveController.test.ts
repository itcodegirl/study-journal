import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDeferred, MemoryStorage, paragraphDoc } from '../../../test/fakes';
import { createJournalRecoveryStore } from '../data/journalRecovery';
import type { JournalRepository } from '../data/journalRepository';
import type { JournalEntry } from '../journal.types';
import { createJournalEntry } from '../journal.utils';
import { AUTOSAVE_DEBOUNCE_MS, createAutosaveController, type SaveStatus } from './autosaveController';

const entry = createJournalEntry({ id: 'props', title: 'Props' }, new Date('2026-09-13T10:00:00.000Z'), 'entry-1');

function setup(save: JournalRepository['save']) {
  const repository: JournalRepository = { getOrCreateForTopic: vi.fn(), save: vi.fn(save) };
  const recovery = createJournalRecoveryStore(new MemoryStorage());
  const controller = createAutosaveController({ entry, repository, recovery });
  const statuses: SaveStatus[] = [];
  controller.subscribe(() => statuses.push(controller.getSnapshot().status));
  return { controller, repository, recovery, statuses };
}

const echoSave = async (saved: JournalEntry) => ({ ...saved, updatedAt: '2026-09-13T10:01:00.000Z' });

describe('autosave controller', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not write on every keystroke: a burst of edits becomes one save of the latest content', async () => {
    const { controller, repository } = setup(echoSave);

    for (const text of ['D', 'De', 'Der', 'Derived']) {
      controller.update('content', paragraphDoc(text));
      await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS / 4);
    }
    expect(repository.save).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS);
    expect(repository.save).toHaveBeenCalledTimes(1);
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ content: paragraphDoc('Derived') }));
  });

  it('moves through unsaved → saving → saved', async () => {
    const deferred = createDeferred<JournalEntry>();
    const { controller, statuses } = setup(() => deferred.promise);

    controller.update('myVersion', paragraphDoc('In my words'));
    expect(controller.getSnapshot().status).toBe('dirty');

    await vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS);
    expect(controller.getSnapshot().status).toBe('saving');

    deferred.resolve({ ...entry, updatedAt: '2026-09-13T10:02:00.000Z' });
    await vi.runAllTimersAsync();

    expect(statuses).toEqual(['dirty', 'saving', 'saved']);
    expect(controller.getSnapshot()).toMatchObject({ status: 'saved', lastSavedAt: '2026-09-13T10:02:00.000Z' });
    expect(controller.hasUnsavedChanges()).toBe(false);
  });

  it('keeps the writing and a recovery copy when a save fails, then retries successfully', async () => {
    let fail = true;
    const { controller, repository, recovery } = setup(async (saved) => {
      if (fail) throw new Error('offline');
      return echoSave(saved);
    });

    controller.update('content', paragraphDoc('Do not lose me'));
    await controller.flush();

    expect(controller.getSnapshot()).toMatchObject({ status: 'error', backupKept: true });
    expect(controller.hasUnsavedChanges()).toBe(true);
    expect(recovery.read('entry-1')?.entry.content).toEqual(paragraphDoc('Do not lose me'));

    fail = false;
    await controller.flush();

    expect(repository.save).toHaveBeenLastCalledWith(expect.objectContaining({ content: paragraphDoc('Do not lose me') }));
    expect(controller.getSnapshot().status).toBe('saved');
    expect(recovery.read('entry-1')).toBeUndefined();
  });

  it('never overlaps saves: edits made mid-save are saved afterwards', async () => {
    const first = createDeferred<JournalEntry>();
    const saves: JournalEntry[] = [];
    const { controller } = setup((saved) => {
      saves.push(saved);
      return saves.length === 1 ? first.promise : echoSave(saved);
    });

    controller.update('content', paragraphDoc('First'));
    const firstFlush = controller.flush();
    controller.update('content', paragraphDoc('Second'));
    const secondFlush = controller.flush();

    expect(saves).toHaveLength(1);
    first.resolve({ ...entry, updatedAt: '2026-09-13T10:03:00.000Z' });
    await Promise.all([firstFlush, secondFlush]);

    expect(saves.map((saved) => saved.content)).toEqual([paragraphDoc('First'), paragraphDoc('Second')]);
    expect(controller.getSnapshot().status).toBe('saved');
  });

  it('does nothing when there is nothing new to save', async () => {
    const { controller, repository } = setup(echoSave);
    await controller.flush();
    expect(repository.save).not.toHaveBeenCalled();
    expect(controller.getSnapshot().status).toBe('idle');
  });

  it('treats recovered writing as unsaved from the start', async () => {
    const repository: JournalRepository = { getOrCreateForTopic: vi.fn(), save: vi.fn(echoSave) };
    const controller = createAutosaveController({
      entry: { ...entry, content: paragraphDoc('Recovered') },
      repository,
      recovery: createJournalRecoveryStore(new MemoryStorage()),
      recovered: true,
    });

    expect(controller.getSnapshot().status).toBe('dirty');
    await controller.flush();
    expect(repository.save).toHaveBeenCalledWith(expect.objectContaining({ content: paragraphDoc('Recovered') }));
  });
});
