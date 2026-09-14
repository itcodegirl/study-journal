import { expect, test, type Locator, type Page } from '@playwright/test';

const TOPIC_ID = 'state-derived-from-props';
const NOTE = 'Derived state is computed during render, not copied into state.';

async function openStudyContext(page: Page, mobile: boolean, kind: 'Cards' | 'Questions' | 'Ideas'): Promise<Locator> {
  if (mobile) {
    const drawer = page.getByRole('dialog', { name: 'Study context' });
    if (!(await drawer.isVisible())) {
      await page.getByRole('navigation', { name: 'Study context' }).getByRole('button', { name: new RegExp(`^${kind}`) }).click();
    }
    await drawer.getByRole('tab', { name: new RegExp(`^${kind}`) }).click();
    return drawer;
  }
  const collapsedToggle = page.getByRole('button', { name: 'Show study context' });
  if (await collapsedToggle.isVisible()) await collapsedToggle.click();
  const rail = page.getByRole('complementary', { name: 'Study context for this entry' });
  await rail.getByRole('tab', { name: new RegExp(`^${kind}`) }).click();
  return rail;
}

test('the Phase 1 study flow: write, autosave, refresh, create linked objects, adapt the layout', async ({ page }, testInfo) => {
  const mobile = testInfo.project.name === 'mobile';

  await page.goto('/');
  if (mobile) await page.getByRole('button', { name: 'Open course navigation' }).click();
  await page.getByRole('link', { name: 'State derived from props' }).click();
  await expect(page).toHaveURL(new RegExp(`/journal/${TOPIC_ID}$`));
  await expect(page.getByRole('heading', { level: 1, name: 'State derived from props' })).toBeVisible();
  await expect(page.getByRole('link', { name: /^Source/ })).toHaveAttribute('href', /react\.dev/);

  // Write in both open sections and wait for the quiet autosave.
  const notes = page.getByRole('textbox', { name: 'My Notes' });
  await notes.click();
  await page.keyboard.type(NOTE);
  const myVersion = page.getByRole('textbox', { name: /^My Version/ });
  await myVersion.click();
  await page.keyboard.type('If a value can be worked out from props, compute it in render instead of storing it.');

  // The page has no dead zones: pressing in the margin puts the caret on that section's nearest line.
  const paper = await page.locator('.notebook__paper').boundingBox();
  const notesBox = await notes.boundingBox();
  await page.mouse.click((paper?.x ?? 0) + 16, (notesBox?.y ?? 0) + (notesBox?.height ?? 0) / 2);
  await page.keyboard.type('Margin click.');
  await expect(notes).toContainText('Margin click.');
  await page.keyboard.press('ControlOrMeta+a');
  await page.keyboard.type(NOTE);
  await expect(notes).toHaveText(NOTE);
  const status = page.locator('.save-status');
  await expect(status).toHaveAttribute('data-status', 'saved');

  await page.reload();
  await expect(page.getByRole('textbox', { name: 'My Notes' })).toContainText('computed during render');
  await expect(page.getByRole('textbox', { name: /^My Version/ })).toContainText('compute it in render');

  // Select the whole note (it wraps on a phone) and use the selection menu.
  await notes.click();
  await page.keyboard.press('ControlOrMeta+a');
  const selectionMenu = page.getByRole('toolbar', { name: 'Selection actions in My Notes' });
  await expect(selectionMenu).toBeVisible();
  await selectionMenu.getByRole('button', { name: 'Underline' }).click();
  await expect(notes.locator('u')).toContainText('Derived state');
  await selectionMenu.getByRole('button', { name: 'Highlight' }).click();
  await expect(notes.locator('mark')).toContainText('Derived state');

  await selectionMenu.getByRole('button', { name: 'Make a card from the selection' }).click();
  const cardDialog = page.getByRole('dialog', { name: 'Make a card' });
  await expect(cardDialog.getByRole('blockquote')).toContainText(NOTE);
  await expect(cardDialog.getByLabel(/^Answer/)).toHaveValue(NOTE);
  await cardDialog.getByRole('button', { name: 'Save card' }).click();
  await expect(cardDialog.getByText('Write the prompt you want to answer from memory.')).toBeVisible();
  await cardDialog.getByLabel('Prompt').fill('Where should derived state live?');
  await cardDialog.getByRole('button', { name: 'Save card' }).click();
  await expect(cardDialog).toBeHidden();

  await expect(selectionMenu).toBeVisible();
  await selectionMenu.getByRole('button', { name: 'Save the selection as a question' }).click();
  const questionDialog = page.getByRole('dialog', { name: 'Save a question' });
  await questionDialog.getByLabel('Question').fill('When is it fine to copy a prop into state?');
  await questionDialog.getByRole('button', { name: 'Save question' }).click();
  await expect(questionDialog).toBeHidden();

  // Linked objects appear for the current entry.
  let context = await openStudyContext(page, mobile, 'Cards');
  await expect(context.getByRole('article', { name: 'card: Where should derived state live?' })).toBeVisible();
  await expect(context.getByRole('button', { name: /Show source in My Notes/ })).toBeVisible();

  context = await openStudyContext(page, mobile, 'Questions');
  await expect(context.getByRole('article', { name: /^question: When is it fine/ })).toContainText('Unanswered');

  // Manual creation from the rail.
  context = await openStudyContext(page, mobile, 'Ideas');
  await context.getByRole('button', { name: 'New idea' }).click();
  const ideaDialog = page.getByRole('dialog', { name: 'Save an idea' });
  await ideaDialog.getByLabel('Title', { exact: true }).fill('Refactor the profile form to derive fullName');
  await ideaDialog.getByLabel(/^Category/).fill('Project');
  await ideaDialog.getByRole('button', { name: 'Save idea' }).click();
  await expect(ideaDialog).toBeHidden();
  await expect(context.getByRole('article', { name: /^idea: Refactor the profile form/ })).toContainText('Project');

  // Everything is linked to this entry and topic in storage.
  const stored = await page.evaluate(() =>
    Object.entries(localStorage)
      .filter(([key]) => key.includes(':record:'))
      .map(([, value]) => JSON.parse(value) as Record<string, unknown>),
  );
  const entries = stored.filter((record) => record['topicId'] === TOPIC_ID && !('journalEntryId' in record));
  const entry = entries[0];
  const linked = stored.filter((record) => 'journalEntryId' in record);
  expect(entries).toHaveLength(1);
  expect(entry).toBeDefined();
  expect(linked).toHaveLength(3);
  for (const record of linked) {
    expect(record['journalEntryId']).toBe(entry?.['id']);
    expect(record['topicId']).toBe(TOPIC_ID);
  }

  if (mobile) {
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Study context' })).toBeHidden();
    // Phone layout: no inline rail, the notebook keeps the width, and the utility bar stays reachable.
    await expect(page.getByRole('complementary', { name: 'Study context for this entry' })).toHaveCount(0);
    const paper = await page.locator('.notebook__paper').boundingBox();
    const viewport = page.viewportSize();
    expect(paper?.width ?? 0).toBeGreaterThan((viewport?.width ?? 0) * 0.9);
    await expect(page.getByRole('navigation', { name: 'Study context' })).toBeVisible();
    return;
  }

  // Collapsing the rail widens the notebook and keeps the objects.
  const before = await page.locator('.notebook__paper').boundingBox();
  await page.getByRole('button', { name: 'Hide study context' }).click();
  await expect(page.getByRole('tablist', { name: 'Study objects' })).toHaveCount(0);
  const after = await page.locator('.notebook__paper').boundingBox();
  expect(after?.width ?? 0).toBeGreaterThanOrEqual(before?.width ?? 0);
  await page.getByRole('button', { name: 'Show cards (1)' }).click();
  await expect(page.getByRole('article', { name: 'card: Where should derived state live?' })).toBeVisible();

  // The layout follows the window without a reload: tablet width moves the rail into the utility bar.
  await page.setViewportSize({ width: 820, height: 900 });
  await expect(page.getByRole('navigation', { name: 'Study context' })).toBeVisible();
  await expect(page.getByRole('complementary', { name: 'Study context for this entry' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Open course navigation' })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.getByRole('navigation', { name: 'Study context' })).toHaveCount(0);
  await expect(page.getByRole('article', { name: 'card: Where should derived state live?' })).toBeVisible();
});
