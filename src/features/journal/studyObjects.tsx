import { CircleQuestionMark, Layers, Lightbulb, type LucideProps } from 'lucide-react';
import type { StudyCard } from '../cards/cards.types';
import type { StudyIdea } from '../ideas/ideas.types';
import type { StudyQuestion } from '../questions/questions.types';
import type { SelectionSource } from './journal.types';

export const STUDY_OBJECT_KINDS = ['card', 'question', 'idea'] as const;

export type StudyObjectKind = (typeof STUDY_OBJECT_KINDS)[number];

export const KIND_LABELS: Record<StudyObjectKind, { singular: string; plural: string; create: string; fromSelection: string }> = {
  card: { singular: 'card', plural: 'Cards', create: 'New card', fromSelection: 'Make card' },
  question: { singular: 'question', plural: 'Questions', create: 'New question', fromSelection: 'Question' },
  idea: { singular: 'idea', plural: 'Ideas', create: 'New idea', fromSelection: 'Idea' },
};

const KIND_ICONS = { card: Layers, question: CircleQuestionMark, idea: Lightbulb } as const;

export function KindIcon({ kind, ...props }: { kind: StudyObjectKind } & LucideProps) {
  const Icon = KIND_ICONS[kind];
  return <Icon aria-hidden="true" {...props} />;
}

/**
 * An explicit request to create or edit one study object. `source` carries the
 * selected notebook text; `returnTo` is the notebook section focus goes back to.
 */
export type ComposerRequest = { source?: SelectionSource; returnTo?: SelectionSource['section'] } & (
  | { kind: 'card'; existing?: StudyCard }
  | { kind: 'question'; existing?: StudyQuestion }
  | { kind: 'idea'; existing?: StudyIdea }
);
