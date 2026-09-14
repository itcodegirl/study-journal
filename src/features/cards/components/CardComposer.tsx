import { useRef, useState } from 'react';
import { TextAreaField } from '../../../components/ui/Field';
import { truncate } from '../../../lib/text';
import { hasErrors } from '../../../lib/validation';
import { ComposerDialog, type ComposerOutcome } from '../../journal/composer/ComposerDialog';
import type { LinkedCollection } from '../../journal/hooks/useLinkedCollection';
import type { JournalLink, SelectionSource } from '../../journal/journal.types';
import {
  CARD_LIMITS,
  createStudyCard,
  findCardWithSamePrompt,
  reviseStudyCard,
  validateCardDraft,
  type CardDraft,
  type CardDraftErrors,
} from '../cards.model';
import type { StudyCard } from '../cards.types';

interface CardComposerProps {
  link: JournalLink;
  cards: LinkedCollection<StudyCard>;
  existing?: StudyCard | undefined;
  source?: SelectionSource | undefined;
  onClose: (outcome: ComposerOutcome) => void;
}

/** The only way a card is created: the learner shapes a prompt and answer and saves. */
export function CardComposer({ link, cards, existing, source, onClose }: CardComposerProps) {
  const [draft, setDraft] = useState<CardDraft>(() =>
    existing
      ? { prompt: existing.prompt, answer: existing.answer }
      : { prompt: '', answer: source ? truncate(source.text, CARD_LIMITS.answer) : '' },
  );
  const [errors, setErrors] = useState<CardDraftErrors>({});
  const promptRef = useRef<HTMLTextAreaElement>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const duplicate = findCardWithSamePrompt(cards.items, draft.prompt, existing?.id);

  const change = (field: keyof CardDraft) => (value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors(({ [field]: _cleared, ...rest }) => rest);
  };

  const submit = async () => {
    const nextErrors = validateCardDraft(draft);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      (nextErrors.prompt ? promptRef : answerRef).current?.focus();
      return false;
    }
    if (existing) await cards.update(reviseStudyCard(existing, draft));
    else await cards.create(createStudyCard({ draft, link, source }));
    return true;
  };

  return (
    <ComposerDialog
      kind="card"
      title={existing ? 'Edit card' : 'Make a card'}
      submitLabel={existing ? 'Save changes' : 'Save card'}
      source={source}
      onSubmit={submit}
      onClose={onClose}
      initialFocusRef={promptRef}
    >
      <TextAreaField
        ref={promptRef}
        label="Prompt"
        required
        rows={2}
        maxLength={CARD_LIMITS.prompt}
        value={draft.prompt}
        onChange={change('prompt')}
        error={errors.prompt}
        hint="A question you should be able to answer from memory."
      />
      {duplicate && (
        <p className="composer__notice" role="status">
          You already have a card with this prompt for this entry. You can still save it.
        </p>
      )}
      <TextAreaField
        ref={answerRef}
        label="Answer"
        required
        rows={4}
        maxLength={CARD_LIMITS.answer}
        value={draft.answer}
        onChange={change('answer')}
        error={errors.answer}
        hint={source && !existing ? 'Prefilled from your selection. Shape it into the answer you want to recall.' : undefined}
      />
    </ComposerDialog>
  );
}
