import { TextSelection } from '@tiptap/pm/state';
import type { EditorView } from '@tiptap/pm/view';
import { EditorContent, useEditor, type Editor } from '@tiptap/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import type { RichTextDoc } from './editor.types';
import { createNotebookExtensions } from './notebookExtensions';

interface NotebookEditorProps {
  placeholder: string;
  /** Read once at mount; the editor owns its document afterwards. */
  initialContent: RichTextDoc | undefined;
  labelledBy: string;
  describedBy: string;
  onChange: (doc: RichTextDoc) => void;
  onFocus: () => void;
  onReady: (editor: Editor | null) => void;
  /** Escape with nothing selected moves focus out of the page so the editor never traps the keyboard. */
  onLeave: () => void;
  renderSelectionMenu: (editor: Editor) => ReactNode;
}

// Keeps the caret clear of the sticky toolbar when ProseMirror scrolls it into view.
const SCROLL_MARGIN = { top: 132, right: 16, bottom: 96, left: 16 };

/** The floating selection menu mounts next to the editor DOM while it is visible. */
const SELECTION_MENU_ACTION = '.selection-menu [data-roving-item]';

export function NotebookEditor({
  placeholder,
  initialContent,
  labelledBy,
  describedBy,
  onChange,
  onFocus,
  onReady,
  onLeave,
  renderSelectionMenu,
}: NotebookEditorProps) {
  const onLeaveRef = useRef(onLeave);
  useEffect(() => {
    onLeaveRef.current = onLeave;
  });

  // useEditor compares options by identity on every render, so everything that
  // is not a callback is created exactly once.
  const [staticOptions] = useState(() => ({
    extensions: createNotebookExtensions(placeholder),
    content: initialContent ?? null,
    editorProps: {
      attributes: {
        class: 'notebook-editor__content',
        role: 'textbox',
        'aria-multiline': 'true',
        'aria-labelledby': labelledBy,
        'aria-describedby': describedBy,
      },
      scrollMargin: SCROLL_MARGIN,
      scrollThreshold: SCROLL_MARGIN,
      handleKeyDown: (view: EditorView, event: KeyboardEvent) => {
        if (event.key === 'Escape') {
          const { selection, doc, tr } = view.state;
          if (!selection.empty) {
            view.dispatch(tr.setSelection(TextSelection.create(doc, selection.to)));
          } else {
            onLeaveRef.current();
          }
          return true;
        }
        if (event.key === 'F10' && event.altKey) {
          const firstAction = view.dom.parentElement?.querySelector<HTMLElement>(SELECTION_MENU_ACTION);
          if (firstAction) {
            firstAction.focus();
            return true;
          }
        }
        return false;
      },
    },
  }));

  const editor = useEditor({
    ...staticOptions,
    onUpdate: ({ editor: current }) => onChange(current.getJSON()),
    onFocus: () => onFocus(),
  });

  useEffect(() => {
    onReady(editor);
    return () => onReady(null);
  }, [editor, onReady]);

  return (
    <div className="notebook-editor">
      <EditorContent editor={editor} />
      {editor && renderSelectionMenu(editor)}
    </div>
  );
}
