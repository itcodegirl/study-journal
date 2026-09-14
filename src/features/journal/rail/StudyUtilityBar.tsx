import { KIND_LABELS, KindIcon, STUDY_OBJECT_KINDS, type StudyObjectKind } from '../studyObjects';
import type { StudyCounts } from './StudyContextRail';

interface StudyUtilityBarProps {
  counts: StudyCounts;
  onOpen: (kind: StudyObjectKind) => void;
}

/** Phone and tablet replacement for the inline rail: a bottom bar that opens the study context sheet. */
export function StudyUtilityBar({ counts, onOpen }: StudyUtilityBarProps) {
  return (
    <nav className="utility-bar" aria-label="Study context">
      {STUDY_OBJECT_KINDS.map((kind) => (
        <button key={kind} type="button" className="utility-bar__button" data-kind={kind} onClick={() => onOpen(kind)}>
          <KindIcon kind={kind} />
          <span>{KIND_LABELS[kind].plural}</span>
          <span className="utility-bar__count">{counts[kind]}</span>
        </button>
      ))}
    </nav>
  );
}
