import { describe, expect, it } from 'vitest';
import { createStudyQuestion, emptyQuestionDraft, reviseStudyQuestion, validateQuestionDraft } from './questions.model';

const link = { journalEntryId: 'entry-1', topicId: 'props' };
const NOW = new Date('2026-09-13T10:00:00.000Z');

describe('questions', () => {
  it('defaults new drafts to unanswered', () => {
    expect(emptyQuestionDraft('Why?')).toEqual({ text: 'Why?', answer: '', status: 'unanswered' });
  });

  it('requires question text but not an answer', () => {
    expect(validateQuestionDraft(emptyQuestionDraft('   ')).text).toBeDefined();
    expect(validateQuestionDraft(emptyQuestionDraft('Why do props flow down?'))).toEqual({});
  });

  it('creates a linked question and drops a blank answer', () => {
    const question = createStudyQuestion({
      draft: { text: '  Why can’t I copy props into state?  ', answer: '   ', status: 'unanswered' },
      link,
      source: { text: 'copy props into state', section: 'whatConfusedMe' },
      now: NOW,
      id: 'q-1',
    });
    expect(question).toEqual({
      id: 'q-1',
      journalEntryId: 'entry-1',
      topicId: 'props',
      text: 'Why can’t I copy props into state?',
      status: 'unanswered',
      sourceText: 'copy props into state',
      sourceSection: 'whatConfusedMe',
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    });
  });

  it('revises status and answer without changing identity or links', () => {
    const question = createStudyQuestion({
      draft: { text: 'Why?', answer: 'Old answer', status: 'answered' },
      link,
      now: NOW,
    });
    const revised = reviseStudyQuestion(question, { text: 'Why?', answer: '', status: 'unanswered' }, NOW);
    expect(revised.id).toBe(question.id);
    expect(revised.journalEntryId).toBe('entry-1');
    expect(revised.status).toBe('unanswered');
    expect(revised).not.toHaveProperty('answer');
  });
});
