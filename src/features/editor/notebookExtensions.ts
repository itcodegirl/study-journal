import { Highlight } from '@tiptap/extension-highlight';
import { Placeholder } from '@tiptap/extensions';
import { StarterKit } from '@tiptap/starter-kit';

/**
 * Notebook schema: StarterKit (which includes Underline, Link, and CodeBlock in
 * Tiptap v3) plus a single highlight mark. Typography is left out on purpose:
 * smart quotes and dashes corrupt code typed in developer notes.
 */
export function createNotebookExtensions(placeholder = '') {
  return [
    StarterKit.configure({
      heading: { levels: [2, 3] },
      link: {
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        defaultProtocol: 'https',
        HTMLAttributes: { rel: 'noopener noreferrer nofollow', target: '_blank' },
      },
    }),
    Highlight.configure({ multicolor: false }),
    Placeholder.configure({ placeholder }),
  ];
}
