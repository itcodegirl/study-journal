import { useId, useRef, useState } from 'react';
import { TextAreaField } from '../../../components/ui/Field';
import { truncate } from '../../../lib/text';
import { hasErrors } from '../../../lib/validation';
import { ComposerDialog, type ComposerOutcome } from '../../journal/composer/ComposerDialog';
import type { LinkedCollection } from '../../journal/hooks/useLinkedCollection';
import type { JournalLink, SelectionSource } from '../../journal/journal.types';
import {
  createStudyQuestion,
  emptyQuestionDraft,
  QUESTION_LIMITS,
  QUESTION_STATUS_LABELS,
  reviseStudyQuestion,
  validateQuestionDraft,
  type QuestionDraft,
  type QuestionDraftErrors,
} from '../questions.model';
import type { QuestionStatus, StudyQuestion } from '../questions.types';

interface QuestionComposerProps {
  link: JournalLink;
  questions: LinkedCollection<StudyQuestion>;
  existing?: StudyQuestion | undefined;
  source?: SelectionSource | undefined;
  onClose: (outcome: ComposerOutcome) => void;
}

export function QuestionComposer({ link, questions, existing, source, onClose }: QuestionComposerProps) {
  const [draft, setDraft] = useState<QuestionDraft>(() =>
    existing
      ? { text: existing.text, answer: existing.answer ?? '', status: existing.status }
      : emptyQuestionDraft(source ? truncate(source.text, QUESTION_LIMITS.text) : ''),
  );
  const [errors, setErrors] = useState<QuestionDraftErrors>({});
  const textRef = useRef<HTMLTextAreaElement>(null);
  const answerRef = useRef<HTMLTextAreaElement>(null);
  const statusName = useId();

  const change = (field: 'text' | 'answer') => (value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors(({ [field]: _cleared, ...rest }) => rest);
  };

  const submit = async () => {
    const nextErrors = validateQuestionDraft(draft);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      (nextErrors.text ? textRef : answerRef).current?.focus();
      return false;
    }
    if (existing) await questions.update(reviseStudyQuestion(existing, draft));
    else await questions.create(createStudyQuestion({ draft, link, source }));
    return true;
  };

  return (
    <ComposerDialog
      kind="question"
      title={existing ? 'Edit question' : 'Save a question'}
      submitLabel={existing ? 'Save changes' : 'Save question'}
      source={source}
      onSubmit={submit}
      onClose={onClose}
      initialFocusRef={textRef}
    >
      <TextAreaField
        ref={textRef}
        label="Question"
        required
        rows={2}
        maxLength={QUESTION_LIMITS.text}
        value={draft.text}
        onChange={change('text')}
        error={errors.text}
        hint="What do you want to come back to or find out?"
      />
      <fieldset className="segmented">
        <legend className="field__label">Status</legend>
        <div className="segmented__options">
          {(Object.keys(QUESTION_STATUS_LABELS) as QuestionStatus[]).map((status) => (
            <label key={status} className="segmented__option">
              <input
                type="radio"
                name={statusName}
                value={status}
                checked={draft.status === status}
                onChange={() => setDraft((current) => ({ ...current, status }))}
              />
              <span>{QUESTION_STATUS_LABELS[status]}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <TextAreaField
        ref={answerRef}
        label="Answer"
        rows={3}
        maxLength={QUESTION_LIMITS.answer}
        value={draft.answer}
        onChange={change('answer')}
        error={errors.answer}
      />
    </ComposerDialog>
  );
}
