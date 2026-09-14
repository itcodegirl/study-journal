import type { KeyValueStorage } from '../../../lib/storage';
import { createLocalStudyObjectRepository, type StudyObjectRepository } from '../../../services/studyObjectRepository';
import type { StudyCard } from '../cards.types';

export type CardRepository = StudyObjectRepository<StudyCard>;

export function createLocalCardRepository(storage: KeyValueStorage): CardRepository {
  return createLocalStudyObjectRepository<StudyCard>('cards', storage);
}
