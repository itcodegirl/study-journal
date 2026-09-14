import { getSchema } from '@tiptap/core';
import { Node as ProseMirrorNode } from '@tiptap/pm/model';
import { describe, expect, it } from 'vitest';
import { findTextRange } from './editorSelection';
import { normalizeLinkHref } from './links';
import { createNotebookExtensions } from './notebookExtensions';

const schema = getSchema(createNotebookExtensions());

const doc = ProseMirrorNode.fromJSON(schema, {
  type: 'doc',
  content: [
    { type: 'paragraph', content: [{ type: 'text', text: 'Props flow down.' }] },
    {
      type: 'paragraph',
      content: [
        { type: 'text', text: 'Derived state is ' },
        { type: 'text', text: 'computed during render', marks: [{ type: 'highlight' }] },
        { type: 'text', text: ', not stored.' },
      ],
    },
  ],
});

describe('findTextRange', () => {
  it('finds text that spans marks inside one block', () => {
    const range = findTextRange(doc, 'state is computed during render');
    expect(range).not.toBeNull();
    expect(doc.textBetween(range?.from ?? 0, range?.to ?? 0)).toBe('state is computed during render');
  });

  it('matches the first line of a multi-block selection', () => {
    const range = findTextRange(doc, 'Props flow down.\nDerived state');
    expect(doc.textBetween(range?.from ?? 0, range?.to ?? 0)).toBe('Props flow down.');
  });

  it('returns null when the source passage is gone', () => {
    expect(findTextRange(doc, 'useEffect cleanup')).toBeNull();
    expect(findTextRange(doc, '   ')).toBeNull();
  });
});

describe('normalizeLinkHref', () => {
  it('accepts web and mail links, adding https to bare domains', () => {
    expect(normalizeLinkHref('react.dev/learn')).toBe('https://react.dev/learn');
    expect(normalizeLinkHref(' https://react.dev ')).toBe('https://react.dev/');
    expect(normalizeLinkHref('mailto:me@example.com')).toBe('mailto:me@example.com');
  });

  it('rejects unsafe or empty links', () => {
    expect(normalizeLinkHref('javascript:alert(1)')).toBeNull();
    expect(normalizeLinkHref('data:text/html,hi')).toBeNull();
    expect(normalizeLinkHref('')).toBeNull();
  });
});
