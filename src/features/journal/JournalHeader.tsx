import { ExternalLink, PanelRightClose, PanelRightOpen } from 'lucide-react';
import { IconButton } from '../../components/ui/Button';
import type { TopicTrail } from '../courses/courses.types';
import type { JournalEntry } from './journal.types';
import { formatEntryDate } from './journal.utils';

export interface RailControl {
  open: boolean;
  id: string;
  onToggle: () => void;
}

interface JournalHeaderProps {
  trail: TopicTrail;
  entry: JournalEntry;
  railControl?: RailControl | undefined;
}

export function JournalHeader({ trail, entry, railControl }: JournalHeaderProps) {
  return (
    <header className="journal-header">
      <div className="journal-header__top">
        <div className="journal-header__titles">
          <nav aria-label="Breadcrumb">
            <ol className="breadcrumb">
              <li>{trail.course.title}</li>
              {trail.modules.map((module) => (
                <li key={module.id}>{module.title}</li>
              ))}
            </ol>
          </nav>
          <h1 className="journal-title">{entry.title}</h1>
        </div>
        {railControl && (
          <IconButton
            label={railControl.open ? 'Hide study context' : 'Show study context'}
            aria-expanded={railControl.open}
            aria-controls={railControl.id}
            className="journal-header__rail-toggle"
            onClick={railControl.onToggle}
          >
            {railControl.open ? <PanelRightClose aria-hidden="true" /> : <PanelRightOpen aria-hidden="true" />}
          </IconButton>
        )}
      </div>
      <div className="journal-meta">
        {trail.topic.sourceUrl && (
          <a href={trail.topic.sourceUrl} target="_blank" rel="noopener noreferrer" className="journal-meta__source">
            <ExternalLink aria-hidden="true" />
            Source
            <span className="visually-hidden"> (opens in a new tab)</span>
          </a>
        )}
        <span>Started {formatEntryDate(entry.createdAt)}</span>
      </div>
    </header>
  );
}
