import { useEffect } from 'react';
import { Link, useParams } from 'react-router';
import { Button } from '../../components/ui/Button';
import { journalPath } from '../../app/paths';
import { getDefaultTopicId, getTopicTrail } from '../courses/courseCatalog';
import type { TopicTrail } from '../courses/courses.types';
import { useJournalEntry } from './hooks/useJournalEntry';
import { JournalWorkspace } from './JournalWorkspace';

export function JournalPage() {
  const { topicId = '' } = useParams();
  const trail = getTopicTrail(topicId);

  useEffect(() => {
    document.title = trail ? `${trail.topic.title} · Study Journal` : 'Topic not found · Study Journal';
  }, [trail]);

  if (!trail) return <TopicNotFound />;
  return <JournalEntryLoader key={trail.topic.id} trail={trail} />;
}

function JournalEntryLoader({ trail }: { trail: TopicTrail }) {
  const { state, retry } = useJournalEntry(trail.topic);

  if (state.status === 'loading') {
    return (
      <p className="journal-message" role="status">
        Opening {trail.topic.title}…
      </p>
    );
  }
  if (state.status === 'error') {
    return (
      <div className="journal-message" role="alert">
        <p>Couldn’t open this entry from browser storage.</p>
        <Button onClick={retry}>Try again</Button>
      </div>
    );
  }
  return <JournalWorkspace key={state.entry.id} trail={trail} entry={state.entry} recovered={state.recovered} />;
}

export function TopicNotFound() {
  return (
    <div className="journal-message">
      <h1 className="journal-message__title">That topic isn’t in your courses</h1>
      <p>
        <Link to={journalPath(getDefaultTopicId())}>Open the first topic</Link> or pick one from the course list.
      </p>
    </div>
  );
}
