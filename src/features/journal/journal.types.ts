import type { RichTextDoc } from '../editor/editor.types';

export const JOURNAL_SECTION_KEYS = ['content', 'myVersion', 'whatClicked', 'whatConfusedMe', 'keyTakeaways'] as const;

export type JournalSectionKey = (typeof JOURNAL_SECTION_KEYS)[number];

/** One entry per topic in Phase 1. Sections are absent until the learner writes in them. */
export interface JournalEntry {
  id: string;
  topicId: string;
  title: string;
  /** My Notes */
  content?: RichTextDoc;
  /** My Version / Explain It Back */
  myVersion?: RichTextDoc;
  whatClicked?: RichTextDoc;
  whatConfusedMe?: RichTextDoc;
  keyTakeaways?: RichTextDoc;
  createdAt: string;
  updatedAt: string;
}

export interface JournalLink {
  journalEntryId: string;
  topicId: string;
}

/** Notebook text the learner selected before choosing an explicit create action. */
export interface SelectionSource {
  text: string;
  section: JournalSectionKey;
}

/**
 * Shared shape of cards, questions, and ideas: each stays linked to the entry and
 * topic that created it, plus the selected text it came from when there was one.
 */
export interface JournalLinkedObject extends JournalLink {
  id: string;
  sourceText?: string;
  sourceSection?: JournalSectionKey;
  createdAt: string;
  updatedAt: string;
}
