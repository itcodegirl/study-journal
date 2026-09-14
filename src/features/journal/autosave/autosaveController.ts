import type { RichTextDoc } from '../../editor/editor.types';
import type { JournalRecoveryStore } from '../data/journalRecovery';
import type { JournalRepository } from '../data/journalRepository';
import type { JournalEntry, JournalSectionKey } from '../journal.types';

/** Starting interval adapted from CodeHerWay's note autosave; revisit after dogfooding. */
export const AUTOSAVE_DEBOUNCE_MS = 800;

export type SaveStatus = 'idle' | 'dirty' | 'saving' | 'saved' | 'error';

export interface AutosaveSnapshot {
  status: SaveStatus;
  lastSavedAt: string | null;
  /** After a failed save: whether a recovery copy of the writing was kept. */
  backupKept: boolean;
}

export interface AutosaveController {
  getSnapshot(): AutosaveSnapshot;
  subscribe(listener: () => void): () => void;
  update(section: JournalSectionKey, doc: RichTextDoc): void;
  /** Saves pending changes now, waiting for any save already in flight. */
  flush(): Promise<void>;
  /** Restarts the debounce (used when an entry opens with recovered writing). */
  requestSave(): void;
  hasUnsavedChanges(): boolean;
  captureRecovery(): void;
}

interface AutosaveControllerOptions {
  entry: JournalEntry;
  repository: JournalRepository;
  recovery: JournalRecoveryStore;
  debounceMs?: number;
  /** The entry opened with recovered writing that still needs saving. */
  recovered?: boolean;
}

/**
 * Framework-free autosave state machine: typing updates a local draft, a
 * debounce persists the newest revision, saves never overlap, and a failed save
 * keeps the draft (plus a recovery copy) instead of discarding it.
 */
export function createAutosaveController({
  entry,
  repository,
  recovery,
  debounceMs = AUTOSAVE_DEBOUNCE_MS,
  recovered = false,
}: AutosaveControllerOptions): AutosaveController {
  let draft = entry;
  let revision = recovered ? 1 : 0;
  let savedRevision = 0;
  let timer: ReturnType<typeof setTimeout> | null = null;
  let inFlight: Promise<void> | null = null;
  let snapshot: AutosaveSnapshot = { status: recovered ? 'dirty' : 'idle', lastSavedAt: null, backupKept: false };
  const listeners = new Set<() => void>();

  const setSnapshot = (next: Partial<AutosaveSnapshot>) => {
    snapshot = { ...snapshot, ...next };
    listeners.forEach((listener) => listener());
  };

  const clearTimer = () => {
    if (timer !== null) {
      clearTimeout(timer);
      timer = null;
    }
  };

  const hasUnsavedChanges = () => revision !== savedRevision;

  const startSave = (target: JournalEntry): Promise<JournalEntry> => {
    try {
      return repository.save(target);
    } catch (error) {
      return Promise.reject(error);
    }
  };

  async function flush(): Promise<void> {
    clearTimer();
    while (inFlight) await inFlight;
    if (!hasUnsavedChanges()) return;

    const targetRevision = revision;
    const target = draft;
    setSnapshot({ status: 'saving' });

    const attempt = startSave(target).then(
      (saved) => {
        savedRevision = targetRevision;
        if (hasUnsavedChanges()) {
          setSnapshot({ status: 'dirty', lastSavedAt: saved.updatedAt, backupKept: false });
          return;
        }
        recovery.clear(target.id);
        setSnapshot({ status: 'saved', lastSavedAt: saved.updatedAt, backupKept: false });
      },
      () => {
        setSnapshot({ status: 'error', backupKept: recovery.capture(draft) });
      },
    );

    inFlight = attempt;
    try {
      await attempt;
    } finally {
      inFlight = null;
    }
  }

  function requestSave() {
    clearTimer();
    timer = setTimeout(() => {
      timer = null;
      void flush();
    }, debounceMs);
  }

  return {
    getSnapshot: () => snapshot,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
    update(section, doc) {
      draft = { ...draft, [section]: doc };
      revision += 1;
      if (snapshot.status !== 'dirty') setSnapshot({ status: 'dirty' });
      requestSave();
    },
    flush,
    requestSave,
    hasUnsavedChanges,
    captureRecovery() {
      if (hasUnsavedChanges()) recovery.capture(draft);
    },
  };
}
