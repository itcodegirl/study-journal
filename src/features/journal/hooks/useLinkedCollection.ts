import { useCallback, useEffect, useRef, useState } from 'react';
import type { StudyObjectRepository } from '../../../services/studyObjectRepository';
import type { JournalLinkedObject } from '../journal.types';

export interface LinkedCollection<T extends JournalLinkedObject> {
  status: 'loading' | 'ready' | 'error';
  items: readonly T[];
  create(item: T): Promise<void>;
  update(item: T): Promise<void>;
  remove(id: string): Promise<void>;
}

/**
 * Current-entry cards, questions, or ideas with optimistic writes. Adapted from
 * the optimistic CRUD pattern in CodeHerWay's note hooks, minus any coupling
 * between object types. Ids are created client-side, so there is no temporary-id
 * swap: a failed write simply rolls back and rethrows so the caller keeps the
 * learner's input.
 */
export function useLinkedCollection<T extends JournalLinkedObject>(
  repository: StudyObjectRepository<T>,
  journalEntryId: string,
): LinkedCollection<T> {
  const [items, setItems] = useState<readonly T[]>([]);
  const [status, setStatus] = useState<LinkedCollection<T>['status']>('loading');
  const itemsRef = useRef<readonly T[]>([]);

  const commit = useCallback((next: readonly T[]) => {
    itemsRef.current = next;
    setItems(next);
  }, []);

  useEffect(() => {
    let active = true;
    repository.listForEntry(journalEntryId).then(
      (loaded) => {
        if (!active) return;
        // Keep anything created optimistically while the list was loading.
        const loadedIds = new Set(loaded.map((item) => item.id));
        commit([...loaded, ...itemsRef.current.filter((item) => !loadedIds.has(item.id))]);
        setStatus('ready');
      },
      () => {
        if (active) setStatus('error');
      },
    );
    return () => {
      active = false;
    };
  }, [commit, journalEntryId, repository]);

  const create = useCallback(
    async (item: T) => {
      commit([...itemsRef.current, item]);
      try {
        await repository.create(item);
      } catch (error) {
        commit(itemsRef.current.filter((existing) => existing.id !== item.id));
        throw error;
      }
    },
    [commit, repository],
  );

  const update = useCallback(
    async (item: T) => {
      const previous = itemsRef.current.find((existing) => existing.id === item.id);
      commit(itemsRef.current.map((existing) => (existing.id === item.id ? item : existing)));
      try {
        await repository.update(item);
      } catch (error) {
        if (previous) commit(itemsRef.current.map((existing) => (existing.id === item.id ? previous : existing)));
        throw error;
      }
    },
    [commit, repository],
  );

  const remove = useCallback(
    async (id: string) => {
      const index = itemsRef.current.findIndex((existing) => existing.id === id);
      const removed = itemsRef.current[index];
      commit(itemsRef.current.filter((existing) => existing.id !== id));
      try {
        await repository.remove(id);
      } catch (error) {
        if (removed) {
          const restored = [...itemsRef.current];
          restored.splice(Math.min(index, restored.length), 0, removed);
          commit(restored);
        }
        throw error;
      }
    },
    [commit, repository],
  );

  return { status, items, create, update, remove };
}
