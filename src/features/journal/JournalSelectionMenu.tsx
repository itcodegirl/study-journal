import { useEditorState, type Editor } from '@tiptap/react';
import { BubbleMenu, type BubbleMenuProps } from '@tiptap/react/menus';
import { Highlighter, Underline } from 'lucide-react';
import { useRef } from 'react';
import { useRovingFocus } from '../../hooks/useRovingFocus';
import { keepEditorSelection } from '../editor/EditorToolbar';
import { getSelectedText } from '../editor/editorSelection';
import { getSectionTitle } from './journal.sections';
import type { JournalSectionKey, SelectionSource } from './journal.types';
import { KIND_LABELS, KindIcon, STUDY_OBJECT_KINDS, type StudyObjectKind } from './studyObjects';

const CREATE_LABELS: Record<StudyObjectKind, string> = {
  card: 'Make a card from the selection',
  question: 'Save the selection as a question',
  idea: 'Save the selection as an idea',
};

const shouldShowSelectionMenu: NonNullable<BubbleMenuProps['shouldShow']> = ({ editor, element, view, state, from, to }) => {
  if (!editor.isEditable || state.selection.empty) return false;
  if (!state.doc.textBetween(from, to, ' ', ' ').trim()) return false;
  return view.hasFocus() || element.contains(document.activeElement);
};

interface JournalSelectionMenuProps {
  editor: Editor;
  section: JournalSectionKey;
  onCreate: (kind: StudyObjectKind, source: SelectionSource) => void;
}

/**
 * Contextual toolbar that floats above selected notebook text. Highlight and
 * underline apply immediately; the three create actions open a composer with the
 * selection as source context and never save anything on their own.
 */
export function JournalSelectionMenu({ editor, section, onCreate }: JournalSelectionMenuProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  useRovingFocus(toolbarRef);
  const marks = useEditorState({
    editor,
    selector: ({ editor: current }) => ({
      highlight: current.isActive('highlight'),
      underline: current.isActive('underline'),
      canFormat: current.can().toggleHighlight(),
    }),
  });

  const create = (kind: StudyObjectKind) => {
    const text = getSelectedText(editor);
    if (text) onCreate(kind, { text, section });
  };

  const dismiss = () => {
    editor.chain().focus().setTextSelection(editor.state.selection.to).run();
  };

  return (
    <BubbleMenu
      editor={editor}
      className="selection-menu"
      updateDelay={120}
      options={{ placement: 'top', offset: 10 }}
      shouldShow={shouldShowSelectionMenu}
    >
      <div
        ref={toolbarRef}
        role="toolbar"
        aria-label={`Selection actions in ${getSectionTitle(section)}`}
        className="selection-menu__toolbar"
        onKeyDown={(event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            event.stopPropagation();
            dismiss();
          }
        }}
      >
        <button
          type="button"
          data-roving-item
          className="selection-menu__button"
          aria-label="Highlight"
          title="Highlight"
          aria-pressed={marks?.highlight ?? false}
          disabled={!marks?.canFormat}
          onMouseDown={keepEditorSelection}
          onClick={() => editor.chain().focus().toggleHighlight().run()}
        >
          <Highlighter aria-hidden="true" />
        </button>
        <button
          type="button"
          data-roving-item
          className="selection-menu__button"
          aria-label="Underline"
          title="Underline"
          aria-pressed={marks?.underline ?? false}
          disabled={!marks?.canFormat}
          onMouseDown={keepEditorSelection}
          onClick={() => editor.chain().focus().toggleUnderline().run()}
        >
          <Underline aria-hidden="true" />
        </button>
        <span className="selection-menu__divider" role="separator" aria-orientation="vertical" />
        {STUDY_OBJECT_KINDS.map((kind) => (
          <button
            key={kind}
            type="button"
            data-roving-item
            data-kind={kind}
            className="selection-menu__button selection-menu__button--create"
            aria-label={CREATE_LABELS[kind]}
            onClick={() => create(kind)}
          >
            <KindIcon kind={kind} />
            <span>{KIND_LABELS[kind].fromSelection}</span>
          </button>
        ))}
      </div>
    </BubbleMenu>
  );
}
