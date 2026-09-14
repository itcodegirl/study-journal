import { createId } from '../../lib/ids';
import { trimToUndefined } from '../../lib/text';
import { checkText, type FieldErrors } from '../../lib/validation';
import type { JournalLink, SelectionSource } from '../journal/journal.types';
import type { StudyIdea } from './ideas.types';

export const IDEA_LIMITS = { title: 120, description: 2000, category: 40 } as const;

export const IDEA_CATEGORY_SUGGESTIONS = ['Project', 'Experiment', 'Article', 'Practice'] as const;

export interface IdeaDraft {
  title: string;
  description: string;
  category: string;
}

export type IdeaDraftErrors = FieldErrors<keyof IdeaDraft>;

export function validateIdeaDraft(draft: IdeaDraft): IdeaDraftErrors {
  const errors: IdeaDraftErrors = {};
  const title = checkText({
    value: draft.title,
    maxLength: IDEA_LIMITS.title,
    requiredMessage: 'Give the idea a short title.',
    tooLongMessage: `Keep the title under ${IDEA_LIMITS.title} characters.`,
  });
  const description = checkText({
    value: draft.description,
    maxLength: IDEA_LIMITS.description,
    tooLongMessage: `Keep the description under ${IDEA_LIMITS.description} characters.`,
  });
  const category = checkText({
    value: draft.category,
    maxLength: IDEA_LIMITS.category,
    tooLongMessage: `Keep the category under ${IDEA_LIMITS.category} characters.`,
  });
  if (title) errors.title = title;
  if (description) errors.description = description;
  if (category) errors.category = category;
  return errors;
}

interface CreateStudyIdeaInput {
  draft: IdeaDraft;
  link: JournalLink;
  source?: SelectionSource | undefined;
  now?: Date;
  id?: string;
}

function optionalIdeaFields(draft: IdeaDraft): Pick<StudyIdea, 'description' | 'category'> {
  const description = trimToUndefined(draft.description);
  const category = trimToUndefined(draft.category);
  return { ...(description ? { description } : {}), ...(category ? { category } : {}) };
}

export function createStudyIdea({ draft, link, source, now = new Date(), id = createId() }: CreateStudyIdeaInput): StudyIdea {
  const timestamp = now.toISOString();
  return {
    id,
    journalEntryId: link.journalEntryId,
    topicId: link.topicId,
    title: draft.title.trim(),
    ...optionalIdeaFields(draft),
    ...(source ? { sourceText: source.text, sourceSection: source.section } : {}),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function reviseStudyIdea(idea: StudyIdea, draft: IdeaDraft, now = new Date()): StudyIdea {
  const { description: _description, category: _category, ...rest } = idea;
  return { ...rest, title: draft.title.trim(), ...optionalIdeaFields(draft), updatedAt: now.toISOString() };
}
