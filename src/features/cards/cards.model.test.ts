import { describe, expect, it } from 'vitest';
import { CARD_LIMITS, createStudyCard, findCardWithSamePrompt, reviseStudyCard, validateCardDraft } from './cards.model';

const link = { journalEntryId: 'entry-1', topicId: 'state-derived-from-props' };
const NOW = new Date('2026-09-13T10:00:00.000Z');

describe('validateCardDraft', () => {
  it('requires both a prompt and an answer after trimming whitespace', () => {
    expect(validateCardDraft({ prompt: '   ', answer: '\n\t' })).toEqual({
      prompt: expect.any(String),
      answer: expect.any(String),
    });
  });

  it('accepts a complete draft', () => {
    expect(validateCardDraft({ prompt: 'Why avoid mirroring props?', answer: 'It goes stale.' })).toEqual({});
  });

  it('enforces length limits', () => {
    const errors = validateCardDraft({ prompt: 'x'.repeat(CARD_LIMITS.prompt + 1), answer: 'ok' });
    expect(errors.prompt).toMatch(/under 300/);
    expect(errors.answer).toBeUndefined();
  });
});

describe('createStudyCard', () => {
  it('assigns a stable id, keeps entry/topic links, trims fields, and seeds a review schedule', () => {
    const card = createStudyCard({
      draft: { prompt: '  What is derived state?  ', answer: ' A value computed during render. ' },
      link,
      source: { text: 'computed during render', section: 'content' },
      now: NOW,
      id: 'card-1',
    });

    expect(card).toMatchObject({
      id: 'card-1',
      journalEntryId: 'entry-1',
      topicId: 'state-derived-from-props',
      prompt: 'What is derived state?',
      answer: 'A value computed during render.',
      sourceText: 'computed during render',
      sourceSection: 'content',
      createdAt: NOW.toISOString(),
      updatedAt: NOW.toISOString(),
    });
    expect(card.schedule.repetitionCount).toBe(0);
  });

  it('omits source fields for manually created cards', () => {
    const card = createStudyCard({ draft: { prompt: 'Q', answer: 'A' }, link, now: NOW });
    expect(card).not.toHaveProperty('sourceText');
    expect(card).not.toHaveProperty('sourceSection');
    expect(card.id).toMatch(/^[0-9a-f-]{36}$/);
  });
});

describe('reviseStudyCard', () => {
  it('keeps identity, links, provenance, and schedule when the prompt changes', () => {
    const card = createStudyCard({
      draft: { prompt: 'Old prompt', answer: 'Answer' },
      link,
      source: { text: 'source', section: 'myVersion' },
      now: NOW,
    });
    const later = new Date('2026-09-14T10:00:00.000Z');
    const revised = reviseStudyCard(card, { prompt: ' New prompt ', answer: 'Answer' }, later);

    expect(revised).toEqual({ ...card, prompt: 'New prompt', updatedAt: later.toISOString() });
  });
});

describe('findCardWithSamePrompt', () => {
  const cards = [
    createStudyCard({ draft: { prompt: 'What is  derived state?', answer: 'A' }, link, id: 'a' }),
    createStudyCard({ draft: { prompt: 'Another', answer: 'B' }, link, id: 'b' }),
  ];

  it('matches prompts case- and whitespace-insensitively', () => {
    expect(findCardWithSamePrompt(cards, ' what is derived STATE? ')?.id).toBe('a');
  });

  it('ignores the card being edited and blank prompts', () => {
    expect(findCardWithSamePrompt(cards, 'What is derived state?', 'a')).toBeUndefined();
    expect(findCardWithSamePrompt(cards, '   ')).toBeUndefined();
  });
});
