import { Pencil, TextQuote, Trash } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { Button, IconButton } from '../../../components/ui/Button';
import { truncate } from '../../../lib/text';
import { getSectionTitle } from '../journal.sections';
import type { SelectionSource } from '../journal.types';
import { KIND_LABELS, type StudyObjectKind } from '../studyObjects';

interface StudyObjectItemProps {
  kind: StudyObjectKind;
  /** Short text that identifies the item in action labels. */
  name: string;
  heading: ReactNode;
  meta?: ReactNode;
  children?: ReactNode;
  source?: SelectionSource | undefined;
  onEdit: () => void;
  onRemove: () => Promise<void>;
  onRevealSource: (source: SelectionSource) => void;
}

export function StudyObjectItem({ kind, name, heading, meta, children, source, onEdit, onRemove, onRevealSource }: StudyObjectItemProps) {
  const [confirming, setConfirming] = useState(false);
  const [removeFailed, setRemoveFailed] = useState(false);
  const deleteRef = useRef<HTMLButtonElement>(null);
  const keepRef = useRef<HTMLButtonElement>(null);
  const noun = KIND_LABELS[kind].singular;
  const shortName = truncate(name, 48);

  const startConfirm = () => {
    setRemoveFailed(false);
    flushSync(() => setConfirming(true));
    keepRef.current?.focus();
  };

  const keep = () => {
    flushSync(() => setConfirming(false));
    deleteRef.current?.focus();
  };

  const confirmRemove = async () => {
    try {
      await onRemove();
    } catch {
      flushSync(() => {
        setConfirming(false);
        setRemoveFailed(true);
      });
      deleteRef.current?.focus();
    }
  };

  return (
    <li className="study-item" data-kind={kind}>
      <article className="study-item__card" aria-label={`${KIND_LABELS[kind].singular}: ${shortName}`}>
        <h3 className="study-item__heading">{heading}</h3>
        {meta}
        {children}
        {source && (
          <button
            type="button"
            className="study-item__source"
            onClick={() => onRevealSource(source)}
            aria-label={`Show source in ${getSectionTitle(source.section)}: ${truncate(source.text, 80)}`}
          >
            <TextQuote aria-hidden="true" className="study-item__source-icon" />
            <span className="study-item__source-text">{truncate(source.text, 90)}</span>
            <span className="study-item__source-section">{getSectionTitle(source.section)}</span>
          </button>
        )}
        {confirming ? (
          <div className="study-item__confirm" role="group" aria-label={`Delete ${noun}: ${shortName}`}>
            <span className="study-item__confirm-text">Delete this {noun}?</span>
            <Button size="sm" variant="danger" onClick={() => void confirmRemove()}>
              Delete
            </Button>
            <Button ref={keepRef} size="sm" variant="ghost" onClick={keep}>
              Keep
            </Button>
          </div>
        ) : (
          <div className="study-item__actions">
            <IconButton label={`Edit ${noun}: ${shortName}`} className="icon-button--sm" onClick={onEdit}>
              <Pencil aria-hidden="true" />
            </IconButton>
            <IconButton ref={deleteRef} label={`Delete ${noun}: ${shortName}`} className="icon-button--sm" onClick={startConfirm}>
              <Trash aria-hidden="true" />
            </IconButton>
          </div>
        )}
        {removeFailed && (
          <p role="alert" className="study-item__error">
            Couldn’t delete this {noun}. It is still saved.
          </p>
        )}
      </article>
    </li>
  );
}
