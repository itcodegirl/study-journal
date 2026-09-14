import { describe, expect, it } from 'vitest';
import { createStudyIdea, reviseStudyIdea, validateIdeaDraft } from './ideas.model';

const link = { journalEntryId: 'entry-1', topicId: 'effects' };
const NOW = new Date('2026-09-13T10:00:00.000Z');

describe('ideas', () => {
  it('requires only a title', () => {
    expect(validateIdeaDraft({ title: ' ', description: '', category: '' }).title).toBeDefined();
    expect(validateIdeaDraft({ title: 'Build a derived-state demo', description: '', category: '' })).toEqual({});
  });

  it('trims optional fields to absent values', () => {
    const idea = createStudyIdea({
      draft: { title: ' Demo app ', description: '   ', category: ' Project ' },
      link,
      now: NOW,
      id: 'idea-1',
    });
    expect(idea).toEqual({
      id: 'idea-1',
      journalEntryId: 'entry-1',
      topicId: 'effects',
      title: 'Demo app',
      category: 'Project',
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    });
  });

  it('clears optional fields on revision when they are emptied', () => {
    const idea = createStudyIdea({ draft: { title: 'Demo', description: 'Details', category: 'Project' }, link, now: NOW });
    const revised = reviseStudyIdea(idea, { title: 'Demo', description: '', category: '' }, NOW);
    expect(revised).not.toHaveProperty('description');
    expect(revised).not.toHaveProperty('category');
    expect(revised.id).toBe(idea.id);
  });
});
