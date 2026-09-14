import type { LinkedCollection } from '../../journal/hooks/useLinkedCollection';
import type { SelectionSource } from '../../journal/journal.types';
import { getObjectSource } from '../../journal/journal.utils';
import { StudyObjectItem } from '../../journal/rail/StudyObjectItem';
import { StudyObjectList } from '../../journal/rail/StudyObjectList';
import type { StudyIdea } from '../ideas.types';

interface CurrentEntryIdeasProps {
  ideas: LinkedCollection<StudyIdea>;
  onCreate: () => void;
  onEdit: (idea: StudyIdea) => void;
  onRevealSource: (source: SelectionSource) => void;
}

export function CurrentEntryIdeas({ ideas, onCreate, onEdit, onRevealSource }: CurrentEntryIdeasProps) {
  return (
    <StudyObjectList
      kind="idea"
      collection={ideas}
      onCreate={onCreate}
      emptyHint="No ideas yet. Save sparks for projects, experiments, and things to try."
      renderItem={(idea, remove) => (
        <StudyObjectItem
          key={idea.id}
          kind="idea"
          name={idea.title}
          heading={idea.title}
          meta={idea.category && <span className="category-tag">{idea.category}</span>}
          source={getObjectSource(idea)}
          onEdit={() => onEdit(idea)}
          onRemove={remove}
          onRevealSource={onRevealSource}
        >
          {idea.description && <p className="study-item__detail">{idea.description}</p>}
        </StudyObjectItem>
      )}
    />
  );
}
