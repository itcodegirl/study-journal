import type { JournalLinkedObject } from '../journal/journal.types';
import type { SRGradeInput } from './scheduling/srAlgorithm';

/** Review metadata carried from creation so a later review phase needs no migration. */
export interface CardSchedule {
  ease: number;
  intervalDays: number;
  repetitionCount: number;
  nextReviewAt: string;
  lastGrade?: SRGradeInput;
  gradedAt?: string;
}

export interface StudyCard extends JournalLinkedObject {
  prompt: string;
  answer: string;
  schedule: CardSchedule;
}
