import { Check, CircleAlert, CircleDashed, LoaderCircle } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import type { SaveStatus } from './autosave/autosaveController';
import type { JournalAutosave } from './hooks/useJournalAutosave';
import { JOURNAL_SECTION_KEYS, type JournalEntry } from './journal.types';

interface JournalStatusProps {
  autosave: JournalAutosave;
  entry: JournalEntry;
}

function formatTime(isoDate: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(isoDate));
}

/**
 * Quiet visible save state. Only failures are announced automatically; the
 * saving/saved churn stays visible but silent so screen readers are not
 * interrupted on every pause in typing.
 */
export function JournalStatus({ autosave, entry }: JournalStatusProps) {
  const hasSavedContent = JOURNAL_SECTION_KEYS.some((key) => entry[key] !== undefined);
  const status: SaveStatus = autosave.status === 'idle' && hasSavedContent ? 'saved' : autosave.status;
  const savedAt = autosave.lastSavedAt ?? (hasSavedContent ? entry.updatedAt : null);

  const label = {
    idle: 'Ready',
    dirty: 'Unsaved changes',
    saving: 'Saving…',
    saved: savedAt ? `Saved ${formatTime(savedAt)}` : 'Saved',
    error: 'Not saved',
  }[status];

  const Icon = { idle: CircleDashed, dirty: CircleDashed, saving: LoaderCircle, saved: Check, error: CircleAlert }[status];

  return (
    <div className="save-status" data-status={status}>
      <span className="save-status__label">
        <Icon aria-hidden="true" className={status === 'saving' ? 'save-status__spinner' : undefined} />
        <span>
          <span className="visually-hidden">Save status: </span>
          {label}
        </span>
      </span>
      {status === 'error' && (
        <>
          <p role="alert" className="visually-hidden">
            {autosave.backupKept
              ? 'Your notes could not be saved. A backup copy is kept in this browser tab; retry to save again.'
              : 'Your notes could not be saved. Keep this tab open and retry to avoid losing your writing.'}
          </p>
          <Button size="sm" variant="secondary" onClick={() => void autosave.flush()}>
            Retry
          </Button>
        </>
      )}
    </div>
  );
}
