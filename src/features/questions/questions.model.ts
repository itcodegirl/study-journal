import { createId } from '../../lib/ids';
import { trimToUndefined } from '../../lib/text';
import { checkText, type FieldErrors } from '../../lib/validation';
import type { JournalLink, SelectionSource } from '../journal/journal.types';
import type { QuestionStatus, StudyQuestion } from './questions.types';

export const QUESTION_LIMITS = { text: 500, answer: 2000 } as const;

export const QUESTION_STATUS_LABELS: Record<QuestionStatus, string> = {
  unanswered: 'Unanswered',
  answered: 'Answered',
};

export interface QuestionDraft {
  text: string;
  answer: string;
  status: QuestionStatus;
}

export type QuestionDraftErrors = FieldErrors<'text' | 'answer'>;

export function emptyQuestionDraft(text = ''): QuestionDraft {
  return { text, answer: '', status: 'unanswered' };
}

export function validateQuestionDraft(draft: QuestionDraft): QuestionDraftErrors {
  const errors: QuestionDraftErrors = {};
  const text = checkText({
    value: draft.text,
    maxLength: QUESTION_LIMITS.text,
    requiredMessage: 'Write the question you want to come back to.',
    tooLongMessage: `Keep the question under ${QUESTION_LIMITS.text} characters.`,
  });
  const answer = checkText({
    value: draft.answer,
    maxLength: QUESTION_LIMITS.answer,
    tooLongMessage: `Keep the answer under ${QUESTION_LIMITS.answer} characters.`,
  });
  if (text) errors.text = text;
  if (answer) errors.answer = answer;
  return errors;
}

interface CreateStudyQuestionInput {
  draft: QuestionDraft;
  link: JournalLink;
  source?: SelectionSource | undefined;
  now?: Date;
  id?: string;
}

export function createStudyQuestion({
  draft,
  link,
  source,
  now = new Date(),
  id = createId(),
}: CreateStudyQuestionInput): StudyQuestion {
  const timestamp = now.toISOString();
  const answer = trimToUndefined(draft.answer);
  return {
    id,
    journalEntryId: link.journalEntryId,
    topicId: link.topicId,
    text: draft.text.trim(),
    status: draft.status,
    ...(answer ? { answer } : {}),
    ...(source ? { sourceText: source.text, sourceSection: source.section } : {}),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

export function reviseStudyQuestion(question: StudyQuestion, draft: QuestionDraft, now = new Date()): StudyQuestion {
  const { answer: _previousAnswer, ...rest } = question;
  const answer = trimToUndefined(draft.answer);
  return {
    ...rest,
    text: draft.text.trim(),
    status: draft.status,
    ...(answer ? { answer } : {}),
    updatedAt: now.toISOString(),
  };
}
