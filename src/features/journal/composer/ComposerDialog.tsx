import { useId, useState, type ReactNode, type RefObject } from 'react';
import { Button } from '../../../components/ui/Button';
import { Dialog } from '../../../components/ui/Dialog';
import { MEDIA_QUERIES, useMediaQuery } from '../../../hooks/useMediaQuery';
import { truncate } from '../../../lib/text';
import { getSectionTitle } from '../journal.sections';
import type { SelectionSource } from '../journal.types';
import { KIND_LABELS, KindIcon, type StudyObjectKind } from '../studyObjects';

export type ComposerOutcome = 'saved' | 'cancelled';

interface ComposerDialogProps {
  kind: StudyObjectKind;
  title: string;
  submitLabel: string;
  source?: SelectionSource | undefined;
  /** Validates and saves; resolves false when validation blocked the save. */
  onSubmit: () => Promise<boolean>;
  onClose: (outcome: ComposerOutcome) => void;
  initialFocusRef: RefObject<HTMLElement | null>;
  children: ReactNode;
}

/**
 * Shared shell for the card, question, and idea composers. Adapts the save and
 * error behavior of CodeHerWay's card form (explicit submit, input kept on
 * failure) inside a responsive dialog that becomes a full-height sheet on phones.
 */
export function ComposerDialog({
  kind,
  title,
  submitLabel,
  source,
  onSubmit,
  onClose,
  initialFocusRef,
  children,
}: ComposerDialogProps) {
  const isPhone = useMediaQuery(MEDIA_QUERIES.mobile);
  const formId = useId();
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  const submit = async () => {
    if (saving) return;
    setSaveFailed(false);
    setSaving(true);
    let saved = false;
    try {
      saved = await onSubmit();
    } catch {
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
    if (saved) onClose('saved');
  };

  const cancel = () => onClose('cancelled');

  const actions = (
    <>
      <Button variant="ghost" onClick={cancel}>
        Cancel
      </Button>
      <Button variant="primary" type="submit" form={formId} disabled={saving}>
        {saving ? 'Saving…' : submitLabel}
      </Button>
    </>
  );

  return (
    <Dialog
      title={title}
      icon={<KindIcon kind={kind} className="dialog__title-icon" />}
      onClose={cancel}
      variant={isPhone ? 'sheet' : 'dialog'}
      actions={actions}
      initialFocusRef={initialFocusRef}
      className={`composer composer--${kind}`}
    >
      <form
        id={formId}
        className="composer__form"
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void submit();
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
            event.preventDefault();
            void submit();
          }
        }}
      >
        {source && (
          <figure className="composer__source">
            <figcaption className="composer__source-label">From {getSectionTitle(source.section)}</figcaption>
            <blockquote className="composer__source-text">{truncate(source.text, 320)}</blockquote>
          </figure>
        )}
        {children}
        {saveFailed && (
          <p role="alert" className="composer__error">
            Couldn’t save this {KIND_LABELS[kind].singular}. Everything you typed is still here, so try again.
          </p>
        )}
      </form>
    </Dialog>
  );
}
