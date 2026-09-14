import type { JournalSectionKey } from './journal.types';

export interface JournalSectionConfig {
  key: JournalSectionKey;
  title: string;
  kicker?: string;
  placeholder: string;
  /** Reflection sections start collapsed so My Notes and My Version stay the focus. */
  collapsible: boolean;
}

export const JOURNAL_SECTIONS: readonly JournalSectionConfig[] = [
  {
    key: 'content',
    title: 'My Notes',
    placeholder: 'Capture what you are learning: definitions, examples, code, anything worth keeping…',
    collapsible: false,
  },
  {
    key: 'myVersion',
    title: 'My Version',
    kicker: 'Explain it back',
    placeholder: 'Explain it in your own words, as if you were teaching a friend who has never seen it…',
    collapsible: false,
  },
  {
    key: 'whatClicked',
    title: 'What clicked',
    placeholder: 'The moment it made sense, and why…',
    collapsible: true,
  },
  {
    key: 'whatConfusedMe',
    title: 'What confused me',
    placeholder: 'Anything still fuzzy. Write it down so you can come back to it…',
    collapsible: true,
  },
  {
    key: 'keyTakeaways',
    title: 'Key takeaways',
    placeholder: 'The two or three things worth remembering…',
    collapsible: true,
  },
];

export function getSectionTitle(key: JournalSectionKey): string {
  return JOURNAL_SECTIONS.find((section) => section.key === key)?.title ?? 'Notes';
}
