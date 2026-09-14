import type { KeyValueStorage } from '../../../lib/storage';
import { createLocalStudyObjectRepository, type StudyObjectRepository } from '../../../services/studyObjectRepository';
import type { StudyIdea } from '../ideas.types';

export type IdeaRepository = StudyObjectRepository<StudyIdea>;

export function createLocalIdeaRepository(storage: KeyValueStorage): IdeaRepository {
  return createLocalStudyObjectRepository<StudyIdea>('ideas', storage);
}
