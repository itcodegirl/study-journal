import { useId, useRef, useState } from 'react';
import { TextAreaField, TextInputField } from '../../../components/ui/Field';
import { truncate } from '../../../lib/text';
import { hasErrors } from '../../../lib/validation';
import { ComposerDialog, type ComposerOutcome } from '../../journal/composer/ComposerDialog';
import type { LinkedCollection } from '../../journal/hooks/useLinkedCollection';
import type { JournalLink, SelectionSource } from '../../journal/journal.types';
import {
  createStudyIdea,
  IDEA_CATEGORY_SUGGESTIONS,
  IDEA_LIMITS,
  reviseStudyIdea,
  validateIdeaDraft,
  type IdeaDraft,
  type IdeaDraftErrors,
} from '../ideas.model';
import type { StudyIdea } from '../ideas.types';

interface IdeaComposerProps {
  link: JournalLink;
  ideas: LinkedCollection<StudyIdea>;
  existing?: StudyIdea | undefined;
  source?: SelectionSource | undefined;
  onClose: (outcome: ComposerOutcome) => void;
}

function titleFromSelection(text: string): string {
  const firstLine = text.split('\n').find((line) => line.trim()) ?? '';
  return truncate(firstLine.trim(), IDEA_LIMITS.title);
}

export function IdeaComposer({ link, ideas, existing, source, onClose }: IdeaComposerProps) {
  const [draft, setDraft] = useState<IdeaDraft>(() =>
    existing
      ? { title: existing.title, description: existing.description ?? '', category: existing.category ?? '' }
      : { title: source ? titleFromSelection(source.text) : '', description: '', category: '' },
  );
  const [errors, setErrors] = useState<IdeaDraftErrors>({});
  const titleRef = useRef<HTMLInputElement>(null);
  const categoryListId = useId();

  const change = (field: keyof IdeaDraft) => (value: string) => {
    setDraft((current) => ({ ...current, [field]: value }));
    setErrors(({ [field]: _cleared, ...rest }) => rest);
  };

  const submit = async () => {
    const nextErrors = validateIdeaDraft(draft);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) {
      titleRef.current?.focus();
      return false;
    }
    if (existing) await ideas.update(reviseStudyIdea(existing, draft));
    else await ideas.create(createStudyIdea({ draft, link, source }));
    return true;
  };

  return (
    <ComposerDialog
      kind="idea"
      title={existing ? 'Edit idea' : 'Save an idea'}
      submitLabel={existing ? 'Save changes' : 'Save idea'}
      source={source}
      onSubmit={submit}
      onClose={onClose}
      initialFocusRef={titleRef}
    >
      <TextInputField
        ref={titleRef}
        label="Title"
        required
        maxLength={IDEA_LIMITS.title}
        value={draft.title}
        onChange={change('title')}
        error={errors.title}
        hint="A project, experiment, or thing to try later."
      />
      <TextInputField
        label="Category"
        maxLength={IDEA_LIMITS.category}
        value={draft.category}
        onChange={change('category')}
        error={errors.category}
        list={categoryListId}
      />
      <datalist id={categoryListId}>
        {IDEA_CATEGORY_SUGGESTIONS.map((category) => (
          <option key={category} value={category} />
        ))}
      </datalist>
      <TextAreaField
        label="Description"
        rows={4}
        maxLength={IDEA_LIMITS.description}
        value={draft.description}
        onChange={change('description')}
        error={errors.description}
      />
    </ComposerDialog>
  );
}
