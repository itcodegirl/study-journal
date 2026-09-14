import { createContext, useContext, type ReactNode } from 'react';
import { createLocalCardRepository, type CardRepository } from '../features/cards/data/cardRepository';
import { createLocalIdeaRepository, type IdeaRepository } from '../features/ideas/data/ideaRepository';
import { createJournalRecoveryStore, type JournalRecoveryStore } from '../features/journal/data/journalRecovery';
import { createLocalJournalRepository, type JournalRepository } from '../features/journal/data/journalRepository';
import { createLocalQuestionRepository, type QuestionRepository } from '../features/questions/data/questionRepository';
import { getBrowserStorage, type KeyValueStorage } from '../lib/storage';

export interface Repositories {
  journal: JournalRepository;
  recovery: JournalRecoveryStore;
  cards: CardRepository;
  questions: QuestionRepository;
  ideas: IdeaRepository;
}

/** Phase 1 persistence: everything stays in this browser behind repository interfaces. */
export function createLocalRepositories(storage: KeyValueStorage, recoveryStorage: KeyValueStorage | null): Repositories {
  return {
    journal: createLocalJournalRepository(storage),
    recovery: createJournalRecoveryStore(recoveryStorage),
    cards: createLocalCardRepository(storage),
    questions: createLocalQuestionRepository(storage),
    ideas: createLocalIdeaRepository(storage),
  };
}

export function createBrowserRepositories(): Repositories | null {
  const local = getBrowserStorage('local');
  return local ? createLocalRepositories(local, getBrowserStorage('session')) : null;
}

const RepositoriesContext = createContext<Repositories | null>(null);

export function RepositoriesProvider({ repositories, children }: { repositories: Repositories; children: ReactNode }) {
  return <RepositoriesContext value={repositories}>{children}</RepositoriesContext>;
}

export function useRepositories(): Repositories {
  const repositories = useContext(RepositoriesContext);
  if (!repositories) throw new Error('useRepositories must be used inside <RepositoriesProvider>.');
  return repositories;
}
