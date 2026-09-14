import { useCallback, useEffect, useState } from 'react';
import { useRepositories } from '../../../services/repositories';
import type { Topic } from '../../courses/courses.types';
import { applyRecoverySnapshot } from '../data/journalRecovery';
import type { JournalEntry } from '../journal.types';

export type JournalEntryState =
  | { status: 'loading' }
  | { status: 'ready'; entry: JournalEntry; recovered: boolean }
  | { status: 'error' };

/** Opens (or creates) the topic's entry and applies any newer recovery snapshot. */
export function useJournalEntry(topic: Topic): { state: JournalEntryState; retry: () => void } {
  const { journal, recovery } = useRepositories();
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<JournalEntryState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    journal.getOrCreateForTopic(topic).then(
      (saved) => {
        if (active) setState({ status: 'ready', ...applyRecoverySnapshot(saved, recovery.read(saved.id)) });
      },
      () => {
        if (active) setState({ status: 'error' });
      },
    );
    return () => {
      active = false;
    };
  }, [attempt, journal, recovery, topic]);

  const retry = useCallback(() => {
    setState({ status: 'loading' });
    setAttempt((count) => count + 1);
  }, []);

  return { state, retry };
}
