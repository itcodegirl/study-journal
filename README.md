# Study Journal

A notebook-centered study journal. Open a topic, write on a ruled notebook page, explain the concept back in your own words, highlight and underline what matters, and deliberately turn selected passages into cards, questions, and ideas that stay linked to the entry they came from.

Phase 1 proves one vertical slice:

```text
Frontend Development → React Fundamentals → State → State derived from props
```

Open topic → write → autosave → refresh → select text → make a card / question / idea → see it in the rail → everything survives a reload.

## Product rules (non-negotiable)

- Notes never become cards automatically. A card, question, or idea exists only after the learner fills in a form and presses Save.
- Every card, question, and idea keeps `journalEntryId`, `topicId`, and (when it came from a selection) the source text and section.
- The notebook wins layout conflicts on desktop, laptop, tablet, and phone.
- Autosave is visible but quiet: only failures are announced.
- No AI-generated notes or cards.

## Run it

Requires Node 22+.

```bash
npm install
```

```bash
npm run dev
```

Then open the printed URL (default `http://localhost:5173`). The app opens on the first topic; pick **State derived from props** from the course list.

Other scripts:

| Command | What it does |
| --- | --- |
| `npm run check` | Typecheck, lint, and unit/component tests |
| `npm test` | Vitest (node project for logic, jsdom project for components) |
| `npm run typecheck` | `tsc --noEmit` with strict settings |
| `npm run lint` | ESLint (TypeScript + React hooks rules) |
| `npm run build` | Typecheck, then a production Vite build |
| `npm run test:e2e` | Playwright flow across desktop, laptop, and phone projects |

Playwright needs a browser. Either download its Chromium once (`npx playwright install chromium`) or point it at an installed browser:

```bash
PLAYWRIGHT_CHANNEL=msedge npm run test:e2e
```

In PowerShell: `$env:PLAYWRIGHT_CHANNEL = 'msedge'; npm run test:e2e`. (`chrome` works the same way.) The e2e config builds the app and serves it on port 4173 by itself.

## Persistence

Phase 1 stores everything in this browser's `localStorage` behind repository interfaces:

- `src/features/journal/data/journalRepository.ts` — one entry per topic, saved as Tiptap JSON
- `src/features/cards/data/cardRepository.ts`, `src/features/questions/data/questionRepository.ts`, `src/features/ideas/data/ideaRepository.ts` — linked study objects
- `src/features/journal/data/journalRecovery.ts` — a `sessionStorage` copy of writing that failed to save or was pending when the tab was hidden; restored on the next open if it is newer than the saved entry

Components never touch storage directly, so a Supabase (or other) adapter can implement the same interfaces later. Nothing points at CodeHerWay tables.

## How it is organized

```text
src/
  app/            App, routes, AppShell (sidebar / top bar / drawers)
  components/ui/  Button, Dialog, Drawer, form fields
  features/
    courses/      seed catalog, catalog helpers, CourseSidebar
    editor/       Tiptap extensions, NotebookEditor, EditorToolbar, link editor, selection helpers
    journal/      JournalPage → JournalWorkspace → notebook sections, selection menu, status,
                  autosave controller + hook, composers, rail, utility bar, repositories
    cards/        model, validation, repository, CardComposer, rail list, scheduling/ (ported SR scheduler)
    questions/    model, validation, repository, QuestionComposer, rail list
    ideas/        model, validation, repository, IdeaComposer, rail list
  hooks/          useFocusTrap (ported), useMediaQuery, useRovingFocus, useAnnouncer
  lib/            ids, storage, text, validation helpers
  services/       local record store, shared study-object repository, repositories context
```

## CodeHerWay reuse

Reuse follows [docs/CODEHERWAY-REUSE-AUDIT.md](docs/CODEHERWAY-REUSE-AUDIT.md). Ported into Study Journal-owned modules with their tests, with no runtime dependency on the CodeHerWay repository:

- `src/features/cards/scheduling/srAlgorithm.ts` — the four-grade scheduler (forgot / hard / good / easy), behavior unchanged
- `src/features/cards/scheduling/cardDefaults.ts` — the single source of scheduling seed values
- `src/hooks/useFocusTrap.ts` — trap stack, focus restore, Escape handling; the scroll lock was adapted to `overflow: hidden` on `<html>` because this app's sidebar, toolbar, and rail are sticky

Adapted as patterns rather than copied: the 800 ms autosave debounce with save-on-leave, the card form's explicit-submit and keep-input-on-failure behavior, optimistic CRUD with rollback, body-portaled modals. The lesson notes panel, the note-to-card automation, the progress service, the write-queue registry, and CodeHerWay's tables were not used.

Cards carry review metadata from creation (`schedule` with ease, interval, repetition count, next review), so a future review phase needs no migration, but Phase 1 exposes no review UI.

## Verifying the Phase 1 slice by hand

1. `npm run dev`, open the app, choose **State derived from props**.
2. Type in **My Notes** and **My Version**. The status in the toolbar goes *Unsaved changes → Saving… → Saved h:mm*.
3. Refresh. Both sections come back.
4. Select text. The floating menu offers Highlight, Underline, Make card, Question, Idea. Try Highlight and Underline.
5. Choose **Make card** with text selected. Save with an empty prompt: the form blocks it. Fill the prompt, save: the card appears under **Cards** in the rail with a "Show source" chip that jumps back to the passage.
6. Repeat with **Question** and **Idea**, and create one of each manually with the **New …** buttons in the rail.
7. Press **Hide study context** (desktop/laptop). The notebook widens; the collapsed strip keeps the counts; reopening restores the lists.
8. Narrow the window below ~1100 px: the course list moves behind the menu button and the rail becomes a bottom utility bar that opens a sheet. Below 768 px the sheet slides up from the bottom and composers become full-screen sheets.
9. Keyboard: Tab through the toolbar (arrow keys move within it), Escape in the editor clears a selection then leaves the editor, Alt+F10 jumps into the selection menu, Escape closes dialogs and drawers.

## Known limitations

- Single-browser persistence only; no accounts or sync yet.
- Highlights are editor marks, not separate records, and have no semantic types.
- No review UI, global cards/questions/ideas pages, dashboard, or search.
- The production bundle is one ~820 kB chunk (mostly Tiptap/ProseMirror); code splitting is deferred.
- Reveal-source finds the first line of the saved passage; if that line was edited away it says so instead of guessing.
