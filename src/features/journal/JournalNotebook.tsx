import type { Editor } from '@tiptap/react';
import type { MouseEvent, ReactNode } from 'react';
import { focusEditorAt } from '../editor/editorSelection';
import { EditorToolbar } from '../editor/EditorToolbar';
import { getSectionTitle, JOURNAL_SECTIONS } from './journal.sections';
import type { JournalEntry, JournalSectionKey, SelectionSource } from './journal.types';
import { JournalSection, type SectionHandlers } from './JournalSection';
import type { StudyObjectKind } from './studyObjects';

interface JournalNotebookProps {
  entry: JournalEntry;
  editors: Partial<Record<JournalSectionKey, Editor>>;
  activeSection: JournalSectionKey;
  openSections: Record<JournalSectionKey, boolean>;
  onToggleSection: (key: JournalSectionKey) => void;
  handlers: Record<JournalSectionKey, SectionHandlers>;
  onCreateFromSelection: (kind: StudyObjectKind, source: SelectionSource) => void;
  status: ReactNode;
}

/** Elements on the page that own their own pointer behavior. */
const INTERACTIVE_ON_PAPER = '.notebook-editor__content, button, a, [role="toolbar"], .selection-menu';

/** The notebook page: one sticky formatting toolbar above a ruled page of sections. */
export function JournalNotebook({
  entry,
  editors,
  activeSection,
  openSections,
  onToggleSection,
  handlers,
  onCreateFromSelection,
  status,
}: JournalNotebookProps) {
  // A press anywhere else on the paper (margin, gap, padding) writes in the
  // nearest visible section, like putting a pen down on a real page.
  const focusNearestEditor = (event: MouseEvent<HTMLDivElement>) => {
    if (event.button !== 0 || (event.target as HTMLElement).closest(INTERACTIVE_ON_PAPER)) return;
    let nearest: { editor: Editor; distance: number } | undefined;
    for (const key of Object.keys(editors) as JournalSectionKey[]) {
      const editor = editors[key];
      if (!editor || !openSections[key]) continue;
      const rect = editor.view.dom.getBoundingClientRect();
      if (rect.height === 0) continue;
      const distance = event.clientY < rect.top ? rect.top - event.clientY : Math.max(0, event.clientY - rect.bottom);
      if (!nearest || distance < nearest.distance) nearest = { editor, distance };
    }
    if (!nearest) return;
    event.preventDefault();
    focusEditorAt(nearest.editor, event.clientX, event.clientY);
  };

  return (
    <div className="notebook">
      <div className="notebook__toolbar">
        <EditorToolbar editor={editors[activeSection] ?? null} label={`Formatting for ${getSectionTitle(activeSection)}`} trailing={status} />
      </div>
      {/* Keyboard users reach each editor directly; the press handler only maps pointer presses on paper. */}
      <div className="notebook__paper" onMouseDown={focusNearestEditor}>
        {JOURNAL_SECTIONS.map((config) => (
          <JournalSection
            key={config.key}
            config={config}
            initialContent={entry[config.key]}
            open={openSections[config.key]}
            onToggle={config.collapsible ? () => onToggleSection(config.key) : undefined}
            active={activeSection === config.key}
            handlers={handlers[config.key]}
            onCreateFromSelection={onCreateFromSelection}
          />
        ))}
      </div>
    </div>
  );
}
