import { createId } from '../../lib/ids';
import { collapseWhitespace } from '../../lib/text';
import { checkText, type FieldErrors } from '../../lib/validation';
import type { JournalLink, SelectionSource } from '../journal/journal.types';
import type { StudyCard } from './cards.types';
import { createInitialSchedule } from './scheduling/cardSchedule';

export const CARD_LIMITS = { prompt: 300, answer: 1000 } as const;

export interface CardDraft {
  prompt: string;
  answer: string;
}

export type CardDraftErrors = FieldErrors<keyof CardDraft>;

export function validateCardDraft(draft: CardDraft): CardDraftErrors {
  const errors: CardDraftErrors = {};
  const prompt = checkText({
    value: draft.prompt,
    maxLength: CARD_LIMITS.prompt,
    requiredMessage: 'Write the prompt you want to answer from memory.',
    tooLongMessage: `Keep the prompt under ${CARD_LIMITS.prompt} characters.`,
  });
  const answer = checkText({
    value: draft.answer,
    maxLength: CARD_LIMITS.answer,
    requiredMessage: 'Add the answer you want to recall.',
    tooLongMessage: `Keep the answer under ${CARD_LIMITS.answer} characters.`,
  });
  if (prompt) errors.prompt = prompt;
  if (answer) errors.answer = answer;
  return errors;
}

interface CreateStudyCardInput {
  draft: CardDraft;
  link: JournalLink;
  source?: SelectionSource | undefined;
  now?: Date;
  id?: string;
}

export function createStudyCard({ draft, link, source, now = new Date(), id = createId() }: CreateStudyCardInput): StudyCard {
  const timestamp = now.toISOString();
  return {
    id,
    journalEntryId: link.journalEntryId,
    topicId: link.topicId,
    prompt: draft.prompt.trim(),
    answer: draft.answer.trim(),
    ...(source ? { sourceText: source.text, sourceSection: source.section } : {}),
    schedule: createInitialSchedule(now),
    createdAt: timestamp,
    updatedAt: timestamp,
  };
}

/** Editing never changes identity, links, provenance, or review schedule. */
export function reviseStudyCard(card: StudyCard, draft: CardDraft, now = new Date()): StudyCard {
  return { ...card, prompt: draft.prompt.trim(), answer: draft.answer.trim(), updatedAt: now.toISOString() };
}

/** Duplicate detection is a warning only; prompts are never identity. */
export function findCardWithSamePrompt(cards: readonly StudyCard[], prompt: string, excludeId?: string): StudyCard | undefined {
  const normalized = collapseWhitespace(prompt).toLowerCase();
  if (!normalized) return undefined;
  return cards.find((card) => card.id !== excludeId && collapseWhitespace(card.prompt).toLowerCase() === normalized);
}
