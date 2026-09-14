import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { createMemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { App } from '../../app/App';
import { routes } from '../../app/router';
import { createLocalRepositories } from '../../services/repositories';
import { MemoryStorage } from '../../test/fakes';
import { setViewportWidth } from '../../test/browserShims';

const TOPIC = { id: 'state-derived-from-props', title: 'State derived from props' };

function renderJournal(path = `/journal/${TOPIC.id}`) {
  const repositories = createLocalRepositories(new MemoryStorage(), new MemoryStorage());
  const router = createMemoryRouter(routes, { initialEntries: [path] });
  render(<App repositories={repositories} router={router} />);
  return { repositories, user: userEvent.setup() };
}

const rail = () => screen.getByRole('complementary', { name: 'Study context for this entry' });

describe('JournalPage', () => {
  it('opens the seeded topic with its course path, source link, and writing sections', async () => {
    renderJournal();

    expect(await screen.findByRole('heading', { level: 1, name: TOPIC.title })).toBeInTheDocument();
    const breadcrumb = within(screen.getByRole('navigation', { name: 'Breadcrumb' }));
    expect(breadcrumb.getAllByRole('listitem').map((item) => item.textContent)).toEqual([
      'Frontend Development',
      'React Fundamentals',
      'State',
    ]);
    expect(screen.getByRole('link', { name: /^Source/ })).toHaveAttribute('href', expect.stringContaining('react.dev'));
    expect(screen.getByRole('textbox', { name: 'My Notes' })).toBeInTheDocument();
    expect(screen.getByRole('textbox', { name: /^My Version/ })).toBeInTheDocument();
    expect(screen.getByRole('toolbar', { name: 'Formatting for My Notes' })).toBeInTheDocument();
  });

  it('keeps reflection sections compact until opened', async () => {
    const { user } = renderJournal();
    const toggle = await screen.findByRole('button', { name: 'What clicked' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(screen.queryByRole('textbox', { name: 'What clicked' })).not.toBeInTheDocument();

    await user.click(toggle);

    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(screen.getByRole('textbox', { name: 'What clicked' })).toBeInTheDocument();
  });

  it('creates a card only through the explicit form, with validation, linked to the entry', async () => {
    const { repositories, user } = renderJournal();
    await screen.findByRole('heading', { level: 1, name: TOPIC.title });

    await user.click(within(rail()).getByRole('button', { name: 'New card' }));
    const dialog = screen.getByRole('dialog', { name: 'Make a card' });
    await user.click(within(dialog).getByRole('button', { name: 'Save card' }));
    expect(within(dialog).getByText('Write the prompt you want to answer from memory.')).toBeInTheDocument();
    expect(within(dialog).getByText('Add the answer you want to recall.')).toBeInTheDocument();
    expect(within(dialog).getByLabelText(/^Prompt/)).toHaveFocus();

    await user.type(within(dialog).getByLabelText(/^Prompt/), '  Why not mirror props in state?  ');
    await user.type(within(dialog).getByLabelText(/^Answer/), 'The copy goes stale when the prop changes.');
    await user.click(within(dialog).getByRole('button', { name: 'Save card' }));

    expect(screen.queryByRole('dialog', { name: 'Make a card' })).not.toBeInTheDocument();
    const article = within(rail()).getByRole('article', { name: 'card: Why not mirror props in state?' });
    expect(article).toHaveTextContent('The copy goes stale when the prop changes.');
    expect(within(rail()).getByRole('tab', { name: /^Cards/ })).toHaveTextContent('1');

    const entry = await repositories.journal.getOrCreateForTopic(TOPIC);
    const cards = await repositories.cards.listForEntry(entry.id);
    expect(cards).toHaveLength(1);
    expect(cards[0]).toMatchObject({ journalEntryId: entry.id, topicId: TOPIC.id, prompt: 'Why not mirror props in state?' });
  });

  it('creates questions and ideas manually and lists them under their tabs', async () => {
    const { user } = renderJournal();
    await screen.findByRole('heading', { level: 1, name: TOPIC.title });

    await user.click(within(rail()).getByRole('tab', { name: /^Questions/ }));
    await user.click(within(rail()).getByRole('button', { name: 'New question' }));
    let dialog = screen.getByRole('dialog', { name: 'Save a question' });
    await user.click(within(dialog).getByRole('button', { name: 'Save question' }));
    expect(within(dialog).getByText('Write the question you want to come back to.')).toBeInTheDocument();
    await user.type(within(dialog).getByLabelText(/^Question/), 'Does useMemo count as derived state?');
    await user.click(within(dialog).getByRole('button', { name: 'Save question' }));
    expect(within(rail()).getByRole('article', { name: /^question: Does useMemo/ })).toHaveTextContent('Unanswered');

    await user.click(within(rail()).getByRole('tab', { name: /^Ideas/ }));
    await user.click(within(rail()).getByRole('button', { name: 'New idea' }));
    dialog = screen.getByRole('dialog', { name: 'Save an idea' });
    await user.type(within(dialog).getByLabelText(/^Title/), 'Derived-state lint rule');
    await user.type(within(dialog).getByLabelText(/^Category/), 'Project');
    await user.click(within(dialog).getByRole('button', { name: 'Save idea' }));
    expect(within(rail()).getByRole('article', { name: 'idea: Derived-state lint rule' })).toHaveTextContent('Project');
  });

  it('collapses the rail, widens the notebook, and keeps the objects when reopened', async () => {
    const { user } = renderJournal();
    await screen.findByRole('heading', { level: 1, name: TOPIC.title });
    await user.click(within(rail()).getByRole('button', { name: 'New card' }));
    const dialog = screen.getByRole('dialog', { name: 'Make a card' });
    await user.type(within(dialog).getByLabelText(/^Prompt/), 'Prompt');
    await user.type(within(dialog).getByLabelText(/^Answer/), 'Answer');
    await user.click(within(dialog).getByRole('button', { name: 'Save card' }));

    const toggle = screen.getByRole('button', { name: 'Hide study context' });
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await user.click(toggle);

    expect(screen.queryByRole('tablist', { name: 'Study objects' })).not.toBeInTheDocument();
    expect(document.querySelector('.journal-layout')).toHaveAttribute('data-rail', 'collapsed');
    expect(screen.getByRole('button', { name: 'Show study context' })).toHaveAttribute('aria-expanded', 'false');

    await user.click(screen.getByRole('button', { name: 'Show cards (1)' }));
    expect(document.querySelector('.journal-layout')).toHaveAttribute('data-rail', 'open');
    expect(within(rail()).getByRole('article', { name: 'card: Prompt' })).toBeInTheDocument();
  });

  it('moves study context behind a utility bar and sheet on a phone', async () => {
    setViewportWidth(390);
    const { user } = renderJournal();
    await screen.findByRole('heading', { level: 1, name: TOPIC.title });

    expect(screen.queryByRole('complementary', { name: 'Study context for this entry' })).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Open course navigation' })).toBeInTheDocument();

    const utilityBar = screen.getByRole('navigation', { name: 'Study context' });
    await user.click(within(utilityBar).getByRole('button', { name: /^Questions/ }));
    const sheet = screen.getByRole('dialog', { name: 'Study context' });
    expect(within(sheet).getByRole('tab', { name: /^Questions/ })).toHaveAttribute('aria-selected', 'true');

    await user.click(within(sheet).getByRole('button', { name: 'New question' }));
    const composer = screen.getByRole('dialog', { name: 'Save a question' });
    await user.type(within(composer).getByLabelText(/^Question/), 'Phone question');
    await user.click(within(composer).getByRole('button', { name: 'Save question' }));

    expect(screen.queryByRole('dialog', { name: 'Save a question' })).not.toBeInTheDocument();
    expect(within(sheet).getByRole('article', { name: 'question: Phone question' })).toBeInTheDocument();

    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Study context' })).not.toBeInTheDocument();
    expect(within(utilityBar).getByRole('button', { name: /^Questions/ })).toHaveTextContent('1');
  });

  it('opens a separate entry for each topic from the course navigation', async () => {
    const { repositories, user } = renderJournal();
    await screen.findByRole('heading', { level: 1, name: TOPIC.title });

    await user.click(screen.getByRole('link', { name: 'Props' }));

    expect(await screen.findByRole('heading', { level: 1, name: 'Props' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Props' })).toHaveAttribute('aria-current', 'page');
    const first = await repositories.journal.getOrCreateForTopic(TOPIC);
    const second = await repositories.journal.getOrCreateForTopic({ id: 'props', title: 'Props' });
    expect(first.id).not.toBe(second.id);
  });

  it('explains when a topic is not in the catalog', async () => {
    renderJournal('/journal/nope');
    expect(await screen.findByRole('heading', { level: 1, name: /isn’t in your courses/ })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Open the first topic' })).toHaveAttribute('href', '/journal/what-is-state');
  });
});
