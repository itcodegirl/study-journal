import type { KeyValueStorage } from '../../../lib/storage';
import { createLocalStudyObjectRepository, type StudyObjectRepository } from '../../../services/studyObjectRepository';
import type { StudyQuestion } from '../questions.types';

export type QuestionRepository = StudyObjectRepository<StudyQuestion>;

export function createLocalQuestionRepository(storage: KeyValueStorage): QuestionRepository {
  return createLocalStudyObjectRepository<StudyQuestion>('questions', storage);
}
