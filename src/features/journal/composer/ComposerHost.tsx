import type { StudyCard } from '../../cards/cards.types';
import { CardComposer } from '../../cards/components/CardComposer';
import { IdeaComposer } from '../../ideas/components/IdeaComposer';
import type { StudyIdea } from '../../ideas/ideas.types';
import { QuestionComposer } from '../../questions/components/QuestionComposer';
import type { StudyQuestion } from '../../questions/questions.types';
import type { LinkedCollection } from '../hooks/useLinkedCollection';
import type { JournalLink } from '../journal.types';
import { getObjectSource } from '../journal.utils';
import type { ComposerRequest } from '../studyObjects';
import type { ComposerOutcome } from './ComposerDialog';

export interface StudyCollections {
  cards: LinkedCollection<StudyCard>;
  questions: LinkedCollection<StudyQuestion>;
  ideas: LinkedCollection<StudyIdea>;
}

interface ComposerHostProps {
  request: ComposerRequest;
  link: JournalLink;
  collections: StudyCollections;
  onClose: (outcome: ComposerOutcome) => void;
}

export function ComposerHost({ request, link, collections, onClose }: ComposerHostProps) {
  const source = request.source ?? (request.existing ? getObjectSource(request.existing) : undefined);

  switch (request.kind) {
    case 'card':
      return <CardComposer link={link} cards={collections.cards} existing={request.existing} source={source} onClose={onClose} />;
    case 'question':
      return (
        <QuestionComposer
          link={link}
          questions={collections.questions}
          existing={request.existing}
          source={source}
          onClose={onClose}
        />
      );
    case 'idea':
      return <IdeaComposer link={link} ideas={collections.ideas} existing={request.existing} source={source} onClose={onClose} />;
  }
}
