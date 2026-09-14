import type { JournalLinkedObject } from '../journal/journal.types';

export type QuestionStatus = 'unanswered' | 'answered';

export interface StudyQuestion extends JournalLinkedObject {
  text: string;
  status: QuestionStatus;
  answer?: string;
}
