import type { JSONContent } from '@tiptap/core';

/** Journal writing is persisted as structured Tiptap (ProseMirror) JSON, not HTML. */
export type RichTextDoc = JSONContent;
