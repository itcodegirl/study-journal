import { createId } from '../../lib/ids';
import type { Topic } from '../courses/courses.types';
import type { RichTextDoc } from '../editor/editor.types';
import type { JournalEntry, JournalLinkedObject, SelectionSource } from './journal.types';

export function getObjectSource(object: JournalLinkedObject): SelectionSource | undefined {
  return object.sourceText && object.sourceSection ? { text: object.sourceText, section: object.sourceSection } : undefined;
}

export function createJournalEntry(topic: Pick<Topic, 'id' | 'title'>, now = new Date(), id = createId()): JournalEntry {
  const timestamp = now.toISOString();
  return { id, topicId: topic.id, title: topic.title, createdAt: timestamp, updatedAt: timestamp };
}

/** Plain text of a rich-text document, one line per block. */
export function getPlainText(doc: RichTextDoc | undefined): string {
  if (!doc) return '';
  const lines: string[] = [];
  const visit = (node: RichTextDoc, line: string[]): void => {
    if (node.type === 'text') {
      line.push(node.text ?? '');
      return;
    }
    if (node.type === 'hardBreak') {
      line.push(' ');
      return;
    }
    const children = node.content ?? [];
    const isTextBlock = children.some((child) => child.type === 'text' || child.type === 'hardBreak');
    if (isTextBlock) {
      const blockLine: string[] = [];
      children.forEach((child) => visit(child, blockLine));
      lines.push(blockLine.join(''));
      return;
    }
    children.forEach((child) => visit(child, line));
  };
  visit(doc, []);
  return lines.map((line) => line.trim()).filter(Boolean).join('\n');
}

export function formatEntryDate(isoDate: string, locale?: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(isoDate));
}
