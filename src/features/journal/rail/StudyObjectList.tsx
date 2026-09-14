import { Plus } from 'lucide-react';
import { useId, useMemo, type ReactNode } from 'react';
import { Button } from '../../../components/ui/Button';
import type { LinkedCollection } from '../hooks/useLinkedCollection';
import type { JournalLinkedObject } from '../journal.types';
import { KIND_LABELS, KindIcon, type StudyObjectKind } from '../studyObjects';

interface StudyObjectListProps<T extends JournalLinkedObject> {
  kind: StudyObjectKind;
  collection: LinkedCollection<T>;
  emptyHint: ReactNode;
  onCreate: () => void;
  renderItem: (item: T, remove: () => Promise<void>) => ReactNode;
}

export function StudyObjectList<T extends JournalLinkedObject>({
  kind,
  collection,
  emptyHint,
  onCreate,
  renderItem,
}: StudyObjectListProps<T>) {
  const newButtonId = useId();
  const labels = KIND_LABELS[kind];
  const newestFirst = useMemo(() => [...collection.items].reverse(), [collection.items]);

  // The removed item's controls disappear with it, so focus moves to the list's stable control.
  const removeItem = (id: string) => async () => {
    await collection.remove(id);
    document.getElementById(newButtonId)?.focus();
  };

  let body: ReactNode;
  if (collection.status === 'error') {
    body = (
      <p role="alert" className="study-list__error">
        Couldn’t load {labels.plural.toLowerCase()} for this entry. Reload the page to try again.
      </p>
    );
  } else if (newestFirst.length === 0) {
    body =
      collection.status === 'loading' ? null : (
        <div className="study-list__empty" data-kind={kind}>
          <KindIcon kind={kind} className="study-list__empty-icon" />
          <p>{emptyHint}</p>
        </div>
      );
  } else {
    body = <ul className="study-list__items">{newestFirst.map((item) => renderItem(item, removeItem(item.id)))}</ul>;
  }

  return (
    <div className="study-list">
      <div className="study-list__header">
        <Button
          id={newButtonId}
          size="sm"
          variant="secondary"
          className="study-list__new"
          data-kind={kind}
          icon={<Plus aria-hidden="true" />}
          onClick={onCreate}
        >
          {labels.create}
        </Button>
      </div>
      {body}
    </div>
  );
}
