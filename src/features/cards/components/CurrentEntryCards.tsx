import type { LinkedCollection } from '../../journal/hooks/useLinkedCollection';
import type { SelectionSource } from '../../journal/journal.types';
import { getObjectSource } from '../../journal/journal.utils';
import { StudyObjectItem } from '../../journal/rail/StudyObjectItem';
import { StudyObjectList } from '../../journal/rail/StudyObjectList';
import type { StudyCard } from '../cards.types';

interface CurrentEntryCardsProps {
  cards: LinkedCollection<StudyCard>;
  onCreate: () => void;
  onEdit: (card: StudyCard) => void;
  onRevealSource: (source: SelectionSource) => void;
}

export function CurrentEntryCards({ cards, onCreate, onEdit, onRevealSource }: CurrentEntryCardsProps) {
  return (
    <StudyObjectList
      kind="card"
      collection={cards}
      onCreate={onCreate}
      emptyHint={
        <>
          No cards yet. Select text in your notes and choose <strong>Make card</strong>, or write one from scratch.
        </>
      }
      renderItem={(card, remove) => (
        <StudyObjectItem
          key={card.id}
          kind="card"
          name={card.prompt}
          heading={card.prompt}
          source={getObjectSource(card)}
          onEdit={() => onEdit(card)}
          onRemove={remove}
          onRevealSource={onRevealSource}
        >
          <p className="study-item__detail">{card.answer}</p>
        </StudyObjectItem>
      )}
    />
  );
}
