import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { MemoryStorage, paragraphDoc } from '../../../test/fakes';
import { AUTOSAVE_DEBOUNCE_MS } from '../autosave/autosaveController';
import { createJournalRecoveryStore } from '../data/journalRecovery';
import { createLocalJournalRepository } from '../data/journalRepository';
import { createJournalEntry } from '../journal.utils';
import { useJournalAutosave } from './useJournalAutosave';

const topic = { id: 'state-derived-from-props', title: 'State derived from props' };

function setup() {
  const storage = new MemoryStorage();
  const repository = createLocalJournalRepository(storage);
  const recovery = createJournalRecoveryStore(new MemoryStorage());
  const entry = createJournalEntry(topic, new Date('2026-09-13T10:00:00.000Z'), 'entry-1');
  const hook = renderHook(() => useJournalAutosave(entry, { repository, recovery }));
  const reopen = () => createLocalJournalRepository(storage).getOrCreateForTopic(topic);
  return { ...hook, storage, reopen };
}

describe('useJournalAutosave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('persists after the debounce so a refresh restores the writing', async () => {
    const { result, reopen } = setup();

    act(() => result.current.update('content', paragraphDoc('Mirror props only when you mean to.')));
    expect(result.current.status).toBe('dirty');

    await act(() => vi.advanceTimersByTimeAsync(AUTOSAVE_DEBOUNCE_MS));

    expect(result.current.status).toBe('saved');
    expect((await reopen()).content).toEqual(paragraphDoc('Mirror props only when you mean to.'));
  });

  it('flushes pending writing when the entry unmounts (switching topics)', async () => {
    const { result, unmount, reopen } = setup();

    act(() => result.current.update('myVersion', paragraphDoc('Typed right before leaving')));
    unmount();

    expect((await reopen()).myVersion).toEqual(paragraphDoc('Typed right before leaving'));
  });

  it('saves pending writing when the page is hidden', async () => {
    const { result, reopen } = setup();

    act(() => result.current.update('keyTakeaways', paragraphDoc('Saved on pagehide')));
    act(() => {
      window.dispatchEvent(new Event('pagehide'));
    });

    expect((await reopen()).keyTakeaways).toEqual(paragraphDoc('Saved on pagehide'));
  });
});
