import type { Editor } from '@tiptap/core';
import type { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { truncate } from '../../lib/text';

/** Upper bound on the source text stored with a card, question, or idea. */
export const SOURCE_TEXT_LIMIT = 2000;

export interface TextRange {
  from: number;
  to: number;
}

export function getSelectedText(editor: Editor): string {
  const { from, to } = editor.state.selection;
  return truncate(editor.state.doc.textBetween(from, to, '\n', ' ').trim(), SOURCE_TEXT_LIMIT);
}

/**
 * Places the caret on the line nearest to a click that landed outside the
 * editor (the page margin, a gap between sections), so the notebook page has
 * no dead zones. Coordinates are clamped into the editor box first.
 */
export function focusEditorAt(editor: Editor, clientX: number, clientY: number): void {
  const rect = editor.view.dom.getBoundingClientRect();
  const left = Math.min(Math.max(clientX, rect.left + 1), rect.right - 1);
  const top = Math.min(Math.max(clientY, rect.top + 1), rect.bottom - 1);
  const found = editor.view.posAtCoords({ left, top });
  if (found) editor.chain().focus().setTextSelection(found.pos).run();
  else editor.commands.focus('end');
}

/**
 * Finds saved source text in a document so the notebook can reveal it. Matches
 * the first non-empty line within a single text block; returns null when the
 * learner has since edited or removed that passage.
 */
export function findTextRange(doc: ProseMirrorNode, text: string): TextRange | null {
  const needle = text
    .split('\n')
    .map((line) => line.trim())
    .find(Boolean);
  if (!needle) return null;

  let found: TextRange | null = null;
  doc.descendants((node, pos) => {
    if (found) return false;
    if (!node.isTextblock) return true;

    const positions: number[] = [];
    let blockText = '';
    node.forEach((child, offset) => {
      const start = pos + 1 + offset;
      if (child.isText && child.text) {
        for (let index = 0; index < child.text.length; index += 1) positions.push(start + index);
        blockText += child.text;
      } else {
        // Inline leaves such as hard breaks read as a space, as in getSelectedText.
        positions.push(start);
        blockText += ' ';
      }
    });

    const index = blockText.indexOf(needle);
    const from = positions[index];
    const last = positions[index + needle.length - 1];
    if (index !== -1 && from !== undefined && last !== undefined) found = { from, to: last + 1 };
    return false;
  });
  return found;
}
