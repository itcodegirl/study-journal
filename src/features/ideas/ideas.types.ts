import type { JournalLinkedObject } from '../journal/journal.types';

export interface StudyIdea extends JournalLinkedObject {
  title: string;
  description?: string;
  category?: string;
}
