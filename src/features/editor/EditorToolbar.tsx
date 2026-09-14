import type { ChainedCommands } from '@tiptap/core';
import { useEditorState, type Editor } from '@tiptap/react';
import {
  Bold,
  Code,
  Heading2,
  Highlighter,
  Italic,
  Link2,
  List,
  ListOrdered,
  Quote,
  SquareCode,
  Underline,
  type LucideIcon,
} from 'lucide-react';
import { useRef, useState, type ReactNode, type Ref } from 'react';
import { useRovingFocus } from '../../hooks/useRovingFocus';
import { describeShortcut } from '../../lib/platform';
import { LinkEditor } from './LinkEditor';

type MarkState = Record<FormatKey | 'link', boolean>;

type FormatKey =
  | 'bold'
  | 'italic'
  | 'underline'
  | 'highlight'
  | 'heading'
  | 'bulletList'
  | 'orderedList'
  | 'blockquote'
  | 'code'
  | 'codeBlock';

interface FormatControl {
  key: FormatKey;
  label: string;
  shortcut: string;
  icon: LucideIcon;
  apply: (chain: ChainedCommands) => ChainedCommands;
}

const FORMAT_GROUPS: ReadonlyArray<{ label: string; controls: readonly FormatControl[] }> = [
  {
    label: 'Text style',
    controls: [
      { key: 'bold', label: 'Bold', shortcut: 'Mod+B', icon: Bold, apply: (chain) => chain.toggleBold() },
      { key: 'italic', label: 'Italic', shortcut: 'Mod+I', icon: Italic, apply: (chain) => chain.toggleItalic() },
      { key: 'underline', label: 'Underline', shortcut: 'Mod+U', icon: Underline, apply: (chain) => chain.toggleUnderline() },
      { key: 'highlight', label: 'Highlight', shortcut: 'Mod+Shift+H', icon: Highlighter, apply: (chain) => chain.toggleHighlight() },
    ],
  },
  {
    label: 'Blocks',
    controls: [
      { key: 'heading', label: 'Heading', shortcut: 'Mod+Alt+2', icon: Heading2, apply: (chain) => chain.toggleHeading({ level: 2 }) },
      { key: 'bulletList', label: 'Bulleted list', shortcut: 'Mod+Shift+8', icon: List, apply: (chain) => chain.toggleBulletList() },
      { key: 'orderedList', label: 'Numbered list', shortcut: 'Mod+Shift+7', icon: ListOrdered, apply: (chain) => chain.toggleOrderedList() },
      { key: 'blockquote', label: 'Quote', shortcut: 'Mod+Shift+B', icon: Quote, apply: (chain) => chain.toggleBlockquote() },
    ],
  },
  {
    label: 'Code',
    controls: [
      { key: 'code', label: 'Inline code', shortcut: 'Mod+E', icon: Code, apply: (chain) => chain.toggleCode() },
      { key: 'codeBlock', label: 'Code block', shortcut: 'Mod+Alt+C', icon: SquareCode, apply: (chain) => chain.toggleCodeBlock() },
    ],
  },
];

const readMarks = (editor: Editor | null): MarkState | null =>
  editor
    ? {
        bold: editor.isActive('bold'),
        italic: editor.isActive('italic'),
        underline: editor.isActive('underline'),
        highlight: editor.isActive('highlight'),
        heading: editor.isActive('heading', { level: 2 }),
        bulletList: editor.isActive('bulletList'),
        orderedList: editor.isActive('orderedList'),
        blockquote: editor.isActive('blockquote'),
        code: editor.isActive('code'),
        codeBlock: editor.isActive('codeBlock'),
        link: editor.isActive('link'),
      }
    : null;

/** Keeps the editor's focus and selection when a toolbar button is clicked with a pointer. */
export const keepEditorSelection = (event: { preventDefault: () => void }) => event.preventDefault();

interface EditorToolbarProps {
  editor: Editor | null;
  label: string;
  ref?: Ref<HTMLDivElement>;
  /** Rendered at the end of the toolbar row, outside the roving tab stop (save status). */
  trailing?: ReactNode;
}

export function EditorToolbar({ editor, label, ref, trailing }: EditorToolbarProps) {
  const toolbarRef = useRef<HTMLDivElement>(null);
  const linkButtonRef = useRef<HTMLButtonElement>(null);
  const [linkEditorOpen, setLinkEditorOpen] = useState(false);
  useRovingFocus(toolbarRef);
  const marks = useEditorState({ editor, selector: ({ editor: current }) => readMarks(current) });

  const setRefs = (node: HTMLDivElement | null) => {
    toolbarRef.current = node;
    if (typeof ref === 'function') ref(node);
    else if (ref) ref.current = node;
  };

  return (
    <div className="editor-toolbar">
      <div ref={setRefs} role="toolbar" aria-label={label} className="editor-toolbar__controls">
        {FORMAT_GROUPS.map((group) => (
          <div key={group.label} role="group" aria-label={group.label} className="editor-toolbar__group">
            {group.controls.map(({ key, label: controlLabel, shortcut, icon: Icon, apply }) => {
              const keys = describeShortcut(shortcut);
              return (
                <button
                  key={key}
                  type="button"
                  data-roving-item
                  className="toolbar-button"
                  aria-label={controlLabel}
                  aria-pressed={marks?.[key] ?? false}
                  aria-keyshortcuts={keys.aria}
                  title={`${controlLabel} (${keys.label})`}
                  disabled={!editor}
                  onMouseDown={keepEditorSelection}
                  onClick={() => editor && apply(editor.chain().focus()).run()}
                >
                  <Icon aria-hidden="true" />
                </button>
              );
            })}
            {group.label === 'Code' && (
              <button
                ref={linkButtonRef}
                type="button"
                data-roving-item
                className="toolbar-button"
                aria-label="Link"
                aria-pressed={marks?.link ?? false}
                aria-expanded={linkEditorOpen}
                aria-haspopup="true"
                title="Link"
                disabled={!editor}
                onMouseDown={keepEditorSelection}
                onClick={() => setLinkEditorOpen((open) => !open)}
              >
                <Link2 aria-hidden="true" />
              </button>
            )}
          </div>
        ))}
      </div>
      {trailing && <div className="editor-toolbar__trailing">{trailing}</div>}
      {linkEditorOpen && editor && (
        <LinkEditor
          editor={editor}
          anchorRef={linkButtonRef}
          onClose={(restoreFocus) => {
            setLinkEditorOpen(false);
            if (restoreFocus) editor.commands.focus();
          }}
        />
      )}
    </div>
  );
}
