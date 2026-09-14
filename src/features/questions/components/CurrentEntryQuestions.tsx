import { CircleCheck, CircleDashed } from 'lucide-react';
import type { LinkedCollection } from '../../journal/hooks/useLinkedCollection';
import type { SelectionSource } from '../../journal/journal.types';
import { getObjectSource } from '../../journal/journal.utils';
import { StudyObjectItem } from '../../journal/rail/StudyObjectItem';
import { StudyObjectList } from '../../journal/rail/StudyObjectList';
import { QUESTION_STATUS_LABELS } from '../questions.model';
import type { StudyQuestion } from '../questions.types';

interface CurrentEntryQuestionsProps {
  questions: LinkedCollection<StudyQuestion>;
  onCreate: () => void;
  onEdit: (question: StudyQuestion) => void;
  onRevealSource: (source: SelectionSource) => void;
}

export function CurrentEntryQuestions({ questions, onCreate, onEdit, onRevealSource }: CurrentEntryQuestionsProps) {
  return (
    <StudyObjectList
      kind="question"
      collection={questions}
      onCreate={onCreate}
      emptyHint="No questions yet. Capture anything you want to come back to or look up."
      renderItem={(question, remove) => (
        <StudyObjectItem
          key={question.id}
          kind="question"
          name={question.text}
          heading={question.text}
          meta={
            <span className="status-badge" data-status={question.status}>
              {question.status === 'answered' ? <CircleCheck aria-hidden="true" /> : <CircleDashed aria-hidden="true" />}
              {QUESTION_STATUS_LABELS[question.status]}
            </span>
          }
          source={getObjectSource(question)}
          onEdit={() => onEdit(question)}
          onRemove={remove}
          onRevealSource={onRevealSource}
        >
          {question.answer && <p className="study-item__detail">{question.answer}</p>}
        </StudyObjectItem>
      )}
    />
  );
}
