import { useEffect, useState, useSyncExternalStore } from 'react';
import type { RichTextDoc } from '../../editor/editor.types';
import { createAutosaveController, type AutosaveSnapshot } from '../autosave/autosaveController';
import type { JournalRecoveryStore } from '../data/journalRecovery';
import type { JournalRepository } from '../data/journalRepository';
import type { JournalEntry, JournalSectionKey } from '../journal.types';

interface UseJournalAutosaveOptions {
  repository: JournalRepository;
  recovery: JournalRecoveryStore;
  recovered?: boolean;
  debounceMs?: number;
}

export interface JournalAutosave extends AutosaveSnapshot {
  update(section: JournalSectionKey, doc: RichTextDoc): void;
  flush(): Promise<void>;
}

/**
 * Binds the autosave controller to a mounted journal entry. The owning component
 * is keyed by entry, so switching topics unmounts it and flushes pending writing
 * for the entry being left, never the one being opened.
 */
export function useJournalAutosave(
  entry: JournalEntry,
  { repository, recovery, recovered = false, debounceMs }: UseJournalAutosaveOptions,
): JournalAutosave {
  const [controller] = useState(() =>
    createAutosaveController({
      entry,
      repository,
      recovery,
      recovered,
      ...(debounceMs === undefined ? {} : { debounceMs }),
    }),
  );
  const snapshot = useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);

  useEffect(() => {
    if (controller.hasUnsavedChanges()) controller.requestSave();

    const saveBeforeLeaving = () => {
      if (!controller.hasUnsavedChanges()) return;
      controller.captureRecovery();
      void controller.flush();
    };
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') saveBeforeLeaving();
    };

    window.addEventListener('pagehide', saveBeforeLeaving);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      window.removeEventListener('pagehide', saveBeforeLeaving);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      if (controller.hasUnsavedChanges()) void controller.flush();
    };
  }, [controller]);

  return { ...snapshot, update: controller.update, flush: controller.flush };
}
