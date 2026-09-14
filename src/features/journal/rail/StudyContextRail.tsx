import { cx } from '../../../lib/classNames';
import { CurrentEntryCards } from '../../cards/components/CurrentEntryCards';
import { CurrentEntryIdeas } from '../../ideas/components/CurrentEntryIdeas';
import { CurrentEntryQuestions } from '../../questions/components/CurrentEntryQuestions';
import type { StudyCollections } from '../composer/ComposerHost';
import type { SelectionSource } from '../journal.types';
import { KIND_LABELS, KindIcon, STUDY_OBJECT_KINDS, type ComposerRequest, type StudyObjectKind } from '../studyObjects';

export type StudyCounts = Record<StudyObjectKind, number>;

export function countStudyObjects(collections: StudyCollections): StudyCounts {
  return {
    card: collections.cards.items.length,
    question: collections.questions.items.length,
    idea: collections.ideas.items.length,
  };
}

interface StudyContextRailProps {
  id: string;
  collections: StudyCollections;
  tab: StudyObjectKind;
  onTabChange: (tab: StudyObjectKind) => void;
  onCreate: (kind: StudyObjectKind) => void;
  onEdit: (request: ComposerRequest) => void;
  onRevealSource: (source: SelectionSource) => void;
  variant?: 'inline' | 'drawer';
}

/** Cards, questions, and ideas linked to the current entry, one tab at a time. */
export function StudyContextRail({
  id,
  collections,
  tab,
  onTabChange,
  onCreate,
  onEdit,
  onRevealSource,
  variant = 'inline',
}: StudyContextRailProps) {
  const counts = countStudyObjects(collections);
  const panelId = `${id}-panel`;
  const tabId = (kind: StudyObjectKind) => `${id}-tab-${kind}`;

  const moveTab = (event: React.KeyboardEvent<HTMLDivElement>) => {
    const index = STUDY_OBJECT_KINDS.indexOf(tab);
    let next: StudyObjectKind | undefined;
    if (event.key === 'ArrowRight') next = STUDY_OBJECT_KINDS[(index + 1) % STUDY_OBJECT_KINDS.length];
    if (event.key === 'ArrowLeft') next = STUDY_OBJECT_KINDS[(index - 1 + STUDY_OBJECT_KINDS.length) % STUDY_OBJECT_KINDS.length];
    if (event.key === 'Home') next = STUDY_OBJECT_KINDS[0];
    if (event.key === 'End') next = STUDY_OBJECT_KINDS[STUDY_OBJECT_KINDS.length - 1];
    if (!next) return;
    event.preventDefault();
    onTabChange(next);
    document.getElementById(tabId(next))?.focus();
  };

  return (
    <aside className={cx('study-rail', `study-rail--${variant}`)} aria-label="Study context for this entry">
      <div role="tablist" aria-label="Study objects" className="study-rail__tabs" onKeyDown={moveTab}>
        {STUDY_OBJECT_KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            role="tab"
            id={tabId(kind)}
            data-kind={kind}
            className="study-tab"
            aria-selected={tab === kind}
            aria-controls={panelId}
            tabIndex={tab === kind ? 0 : -1}
            onClick={() => onTabChange(kind)}
          >
            <KindIcon kind={kind} className="study-tab__icon" />
            <span>{KIND_LABELS[kind].plural}</span>
            <span className="study-tab__count">{counts[kind]}</span>
          </button>
        ))}
      </div>
      <div role="tabpanel" id={panelId} aria-labelledby={tabId(tab)} className="study-rail__panel" tabIndex={0}>
        {tab === 'card' && (
          <CurrentEntryCards
            cards={collections.cards}
            onCreate={() => onCreate('card')}
            onEdit={(card) => onEdit({ kind: 'card', existing: card })}
            onRevealSource={onRevealSource}
          />
        )}
        {tab === 'question' && (
          <CurrentEntryQuestions
            questions={collections.questions}
            onCreate={() => onCreate('question')}
            onEdit={(question) => onEdit({ kind: 'question', existing: question })}
            onRevealSource={onRevealSource}
          />
        )}
        {tab === 'idea' && (
          <CurrentEntryIdeas
            ideas={collections.ideas}
            onCreate={() => onCreate('idea')}
            onEdit={(idea) => onEdit({ kind: 'idea', existing: idea })}
            onRevealSource={onRevealSource}
          />
        )}
      </div>
    </aside>
  );
}

interface StudyContextRailStripProps {
  counts: StudyCounts;
  onExpand: (kind: StudyObjectKind) => void;
}

/** The collapsed rail: counts stay visible, and any icon reopens the rail on that tab. */
export function StudyContextRailStrip({ counts, onExpand }: StudyContextRailStripProps) {
  return (
    <div className="study-rail-strip" role="group" aria-label="Study context, collapsed">
      {STUDY_OBJECT_KINDS.map((kind) => {
        const label = `Show ${KIND_LABELS[kind].plural.toLowerCase()} (${counts[kind]})`;
        return (
          <button key={kind} type="button" className="study-rail-strip__button" data-kind={kind} aria-label={label} title={label} onClick={() => onExpand(kind)}>
            <KindIcon kind={kind} />
            <span className="study-rail-strip__count" aria-hidden="true">
              {counts[kind]}
            </span>
          </button>
        );
      })}
    </div>
  );
}
