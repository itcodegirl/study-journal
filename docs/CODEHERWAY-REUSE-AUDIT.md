# CodeHerWay Reuse Audit for Study Journal

**Project:** Study Journal  
**Source repository:** `itcodegirl/codeherway-platform`  
**Target artifact:** `docs/CODEHERWAY-REUSE-AUDIT.md`  
**Audit purpose:** Determine which CodeHerWay notes, cards, spaced-repetition, persistence, and interaction patterns should be reused, adapted, rewritten, or explicitly left behind before Study Journal implementation begins.  
**Status:** Implementation-readiness audit  
**Decision rule:** Reuse proven logic; do not copy CodeHerWay product assumptions or UI wholesale.

---

# 1. Executive Summary

CodeHerWay contains several strong, production-shaped systems that can accelerate Study Journal, especially the spaced-repetition scheduler, review queue concepts, card creation validation, accessibility patterns, optimistic persistence patterns, and durable background-write ideas.

However, the Study Journal has a different product model:

> **Notes are the primary learning surface. Cards, questions, ideas, and highlights are deliberate objects created from the notebook.**

That difference matters.

The current CodeHerWay notes implementation includes lesson-specific assumptions, feature-flag branching, legacy note fallbacks, and a `useLessonNoteEntries` path that currently creates or maintains a spaced-repetition card as part of note creation/editing. That behavior directly conflicts with the Study Journal requirement that **notes must never automatically become cards**.

Therefore:

| Area | Decision |
|---|---|
| `srAlgorithm.ts` | **REUSE** |
| SR defaults/constants | **REUSE** |
| `useReviewQueue.ts` | **ADAPT** |
| `CardFormDialog.tsx` behavior | **ADAPT** |
| focus-trap/modal accessibility patterns | **REUSE / ADAPT** |
| note autosave concept | **ADAPT** |
| note optimistic CRUD pattern | **ADAPT** |
| `LessonNotesPanel.tsx` UI | **REWRITE** |
| `useLessonNoteEntries.ts` as-is | **DO NOT USE** |
| legacy `notes` / `note_entries` dual-model assumptions | **DO NOT USE** |
| CodeHerWay lesson/course identity model | **DO NOT USE DIRECTLY** |
| progress write queue core idea | **ADAPT** |
| entire CodeHerWay progress operation registry | **DO NOT COPY WHOLESALE** |
| Notes → Card automatic coupling | **PROHIBITED** |
| body-portal modal strategy | **REUSE** |
| source/provenance linkage concepts | **REUSE / IMPROVE** |

The implementation should treat CodeHerWay as a **library of proven patterns**, not as a codebase to transplant.

---

# 2. Study Journal Requirements That Govern Reuse

Every reuse decision in this audit is subordinate to these Study Journal rules.

## 2.1 Notebook-first

The notebook is the primary product surface.

Supporting tools must not dictate the data model or UI.

## 2.2 Deliberate card creation

A note, highlight, question, or selected passage may **suggest** a card creation flow, but the learner must explicitly choose to create and shape the card.

No automatic note-to-card creation is allowed.

## 2.3 Source relationships are first-class

Cards, questions, ideas, and highlights should preserve:

- journal entry
- topic
- selected source context when applicable
- originating object id when applicable

## 2.4 Structured domain model

Study Journal should model its own entities:

- `Course`
- `Module`
- `Topic`
- `JournalEntry`
- `Highlight`
- `Question`
- `Idea`
- `StudyCard`

Do not inherit CodeHerWay's lesson-centric identifiers simply because they already exist.

## 2.5 Cross-device writing experience

All reused behavior must work with:

- laptop
- desktop
- tablet
- mobile

The notebook must retain layout priority.

---

# 3. Evidence Reviewed

The audit reviewed the current/default-branch implementations and relevant CodeHerWay audit documentation, including:

- `src/services/srAlgorithm.ts`
- `src/hooks/useReviewQueue.ts`
- `src/features/cards/CardFormDialog.tsx`
- `src/features/cards/cardDefaults.ts`
- `src/services/srDefaults.ts` through its re-export relationship
- `src/components/learning/LessonNotesPanel.tsx`
- `src/hooks/useLessonNoteEntries.ts`
- `src/services/progressService.ts`
- `src/services/progressWriteQueue.ts`
- `docs/audits/notes-sr-card-system-audit.md`

Important historical context from CodeHerWay's own notes/cards audit was also considered, particularly prior issues involving:

- multiple note data models
- note/card provenance
- question-text card identity
- note-to-card coupling
- duplicated note/card surfaces
- modal containment
- schema drift
- learner-created content trust

Several earlier findings have since been remediated. Reuse decisions below are based on the current implementation where inspected, not blindly on the historical audit.

---

# 4. Decision Classification

Each candidate is classified as one of:

## REUSE
The logic is sufficiently generic, proven, and aligned with Study Journal.

Reuse with minimal changes.

## ADAPT
The underlying behavior is valuable but is coupled to CodeHerWay domain, providers, persistence, or UI assumptions.

Extract the behavior and rebuild the boundary.

## REWRITE
The current implementation solves a CodeHerWay-specific UX problem and should not become the Study Journal implementation.

Use it only as behavioral reference.

## DO NOT USE
The behavior or architecture conflicts with Study Journal requirements or imports unnecessary technical debt.

---

# 5. Spaced-Repetition Scheduler

## Source

`src/services/srAlgorithm.ts`

## Decision

# **REUSE**

## Why

The scheduler is one of the strongest reuse candidates.

It is:

- pure
- clock-parameterized
- isolated from React
- isolated from UI
- isolated from Supabase
- based on four learner grades
- already used for both free-recall and multiple-choice review paths
- explicit about same-session reshow behavior

Supported grades:

```ts
type SRGradeInput = 'forgot' | 'hard' | 'good' | 'easy';
```

The algorithm returns:

- interval
- ease
- repetition count
- next review
- same-session reshow signal

This is exactly the kind of logic that should be reused rather than rewritten for decorative reasons.

## Study Journal action

Extract or copy the pure scheduler into a Study Journal-owned module such as:

```text
src/features/cards/scheduling/srAlgorithm.ts
```

or:

```text
src/services/spacedRepetition.ts
```

## Required changes

Minimal.

Potential changes should be limited to:

- naming
- domain types
- tests
- import paths

Do **not** alter scheduling behavior during the first Study Journal phase unless there is a documented product reason.

## Required tests to port

Port the existing grade-sequence coverage for:

- forgot
- hard
- good
- easy
- ease minimum
- ease maximum
- repetition count
- next-review calculation
- same-session reshow

---

# 6. SR Defaults

## Source

`src/features/cards/cardDefaults.ts`

and the underlying:

`src/services/srDefaults.ts`

## Decision

# **REUSE**

## Why

CodeHerWay already centralized initial spaced-repetition values rather than duplicating constants in multiple forms and services.

Study Journal should preserve that discipline.

## Study Journal action

Create one Study Journal source of truth:

```text
src/features/cards/scheduling/cardDefaults.ts
```

Example responsibility:

- starting ease
- starting interval
- day duration constant
- future scheduler constants if needed

## Important

Do not scatter scheduling seed values across:

- card dialog
- selection toolbar
- review page
- persistence service

One source of truth only.

---

# 7. Review Queue Hook

## Source

`src/hooks/useReviewQueue.ts`

## Decision

# **ADAPT**

## Strengths worth preserving

The current hook provides valuable patterns:

- in-memory card state
- ref-backed current-state access
- add-to-queue behavior
- grade behavior
- same-session reshow handling
- edit
- delete
- restore
- bury
- due-card filtering
- identity fallback strategy
- optimistic local state updates
- persistence dispatch after state mutation

It also now prefers stable identities where available instead of relying only on question text.

That is a substantial improvement over the older architecture.

## Why not copy as-is

The hook is coupled to:

- CodeHerWay `AuthUser`
- CodeHerWay `ProgressWrite`
- `dbWrite`
- `createProgressWrite`
- platform card identity
- CodeHerWay provider structure
- legacy fallback identity behavior
- CodeHerWay SR card type

Study Journal does not need those assumptions.

## Study Journal action

Create a Study Journal-specific hook, likely:

```text
src/features/cards/hooks/useReviewQueue.ts
```

Separate it into two layers.

### Layer 1: Pure review/domain logic

Responsibilities:

- grade card
- compute next schedule
- same-session reshow
- bury
- due filtering

### Layer 2: Persistence adapter

Responsibilities:

- create
- update schedule
- edit
- delete
- restore
- retry/failure behavior

This is cleaner than binding domain review behavior directly to a CodeHerWay write-dispatch system.

## Identity requirement

Study Journal cards should use stable ids from the start.

Recommended:

```ts
interface StudyCard {
  id: string;
  journalEntryId: string;
  sourceObjectId?: string;
  sourceObjectType?: 'note' | 'highlight' | 'question' | 'takeaway';
  prompt: string;
  answer: string;
}
```

Question text must never be treated as canonical identity.

---

# 8. Card Authoring Form

## Source

`src/features/cards/CardFormDialog.tsx`

## Decision

# **ADAPT**

## What is good

The CodeHerWay form has several strong patterns:

- one consolidated card-authoring form
- explicit question and answer requirements
- optional hint
- error feedback
- success feedback
- dedupe handling
- body portal
- focus trap
- escape-close behavior
- modal labeling
- accessible live status
- configurable wrapper behavior
- source-specific initial values

These are valuable.

## What should change

Study Journal should not visually reuse the CodeHerWay card modal.

The notebook interaction should feel native to the Study Journal.

A likely Study Journal flow:

```text
Select text
    ↓
Make Card
    ↓
Notebook-native card composer
    ↓
Prompt
Answer
Optional hint
Source preview
    ↓
Save
```

## Recommended implementation

Extract/recreate these behaviors:

- validation rules
- focus management
- modal/drawer accessibility
- initial text hydration
- save/error states

Build a new component:

```text
src/features/cards/components/CardComposer.tsx
```

and responsive containers such as:

```text
CardComposerDialog.tsx
CardComposerSheet.tsx
```

Desktop/laptop may use a dialog or side panel.

Mobile should prefer a sheet/full-height drawer if that produces a better keyboard experience.

---

# 9. Modal Portal and Focus Management

## Sources

- `CardFormDialog.tsx`
- `useFocusTrap`

## Decision

# **REUSE / ADAPT**

## Why

CodeHerWay already learned an important browser-layout lesson: fixed overlays can become trapped by contained ancestors and stacking contexts.

Its card form deliberately portals the modal to `document.body`.

Study Journal should retain this pattern for true global overlays.

## Study Journal action

Create a reusable accessible overlay primitive.

Example:

```text
src/components/ui/Dialog.tsx
src/hooks/useFocusTrap.ts
```

Requirements:

- portal to body
- escape closes when appropriate
- focus trapped
- focus restored on close
- accessible title
- modal semantics
- outside click behavior intentionally defined
- mobile keyboard behavior tested

---

# 10. Lesson Notes Panel

## Source

`src/components/learning/LessonNotesPanel.tsx`

## Decision

# **REWRITE**

## Useful patterns

The component demonstrates:

- debounced save
- unmount flush
- visible save/error state
- preserving unsaved text after failure
- character limits
- keyboard-aware focus
- accessible tabs
- lazy-loading secondary note surfaces
- source navigation
- explicit note/card bridge

These behaviors are worth studying.

## Why the UI must not be reused

`LessonNotesPanel` is built around:

- a CodeHerWay lesson surface
- tabs for "This lesson" and "All notes"
- feature flags
- legacy NotesMap fallback
- cue-required discrete notes
- lesson catalog navigation
- lesson-specific analytics
- current CodeHerWay content limits
- CodeHerWay panel styling

Study Journal's notebook is not a panel inside a lesson.

The notebook **is the primary page**.

## Study Journal replacement

Create:

```text
JournalNotebook
JournalEditor
JournalSection
JournalSaveStatus
JournalSelectionToolbar
```

Do not embed the Study Journal inside a CodeHerWay-shaped "notes panel."

---

# 11. Autosave Pattern

## Source

`LessonNotesPanel.tsx`

## Decision

# **ADAPT**

## Valuable behavior

The current implementation includes:

- 800 ms debounce
- local React state
- dirty comparison
- pending timer cleanup
- save on unmount when a debounce is pending
- explicit failure state
- preservation of unsaved text on failure

These are good trust-preserving patterns.

## Study Journal requirement

Autosave is more important in Study Journal because the notebook is the core product.

Recommended architecture:

```text
Editor transaction
    ↓
local document state
    ↓
local recovery snapshot
    ↓
debounced persistence
    ↓
server acknowledgement
    ↓
Saved
```

## Recommended state machine

```ts
type SaveState =
  | 'idle'
  | 'dirty'
  | 'saving'
  | 'saved'
  | 'offline'
  | 'error';
```

## Improvements over direct CodeHerWay reuse

Study Journal should distinguish:

- local draft preserved
- server synced
- offline but safe
- save failed

Do not label something merely "Saved" if it only exists in volatile component state.

---

# 12. Discrete Note Entries Hook

## Source

`src/hooks/useLessonNoteEntries.ts`

## Decision

# **DO NOT USE AS-IS**

## Critical conflict

The current hook creates a spaced-repetition card after a note is created:

```text
addNote
→ insertNoteEntry
→ addToSRQueue(noteToSRCard(...))
```

It also edits or creates a linked SR card when the note is edited, and removes the linked card when the note is deleted.

That is a deliberate CodeHerWay behavior, but it conflicts with Study Journal.

Study Journal requires:

> **Writing a note must never automatically create a review card.**

## Why this matters

The notebook is for thinking.

Not every:

- observation
- example
- reflection
- idea
- partial explanation

deserves spaced repetition.

Automatic conversion would:

- flood the review queue
- reduce learner control
- make note-taking feel consequential
- discourage free writing
- create poor recall prompts
- blur note and card identity

## What can be extracted

The optimistic CRUD pattern is useful:

- temporary id
- optimistic insertion
- rollback on failure
- persisted id replacement
- optimistic edit
- rollback on edit failure
- optimistic delete
- restore on delete failure

Extract the **CRUD pattern**, not the note/card behavior.

## Study Journal replacement

Use something like:

```text
useJournalObjects
useJournalNotes
```

with no dependency on card services.

Then card creation happens through an explicit command:

```text
createCardFromSelection(...)
```

or:

```text
openCardComposer(source)
```

---

# 13. Notes Data Model

## CodeHerWay evidence

CodeHerWay has historically contained both:

- legacy `notes`
- granular `note_entries`

Its own audit identified the cost of parallel note models and multiple note surfaces.

The current code has improved the granular path, but the legacy/fallback architecture remains part of the component environment.

## Decision

# **DO NOT IMPORT THE DUAL-MODE MODEL**

Study Journal should start clean.

## Recommended Study Journal model

Use one canonical journal model.

For example:

```ts
interface JournalEntry {
  id: string;
  topicId: string;
  title: string;
  contentJson: EditorDocument;
  myVersionJson?: EditorDocument;
  createdAt: string;
  updatedAt: string;
}
```

Then use separate tables/entities for:

- highlights
- questions
- ideas
- cards

If small inline notebook comments need separate storage later, add them intentionally.

Do not create a legacy note table "just in case."

---

# 14. Progress Service

## Source

`src/services/progressService.ts`

## Decision

# **ADAPT SELECTIVELY**

## Useful patterns

The service demonstrates:

- centralized database access
- user-scoped reads
- thin data functions
- RPC wrappers for note mutations
- id-preferred card writes
- explicit scheduling persistence
- separation between UI and Supabase calls

These are worth carrying forward.

## Why not copy whole service

The file handles many CodeHerWay domains:

- quizzes
- lessons
- bookmarks
- challenges
- course visits
- CodeHerWay notes
- SR cards
- platform-card progress

Study Journal should not inherit an enormous generic "progress service."

## Study Journal replacement

Split by domain.

Recommended:

```text
src/features/journal/data/journalRepository.ts
src/features/cards/data/cardRepository.ts
src/features/questions/data/questionRepository.ts
src/features/ideas/data/ideaRepository.ts
src/features/highlights/data/highlightRepository.ts
```

or equivalent service modules.

## Rule

Components should not make direct Supabase calls.

Retain CodeHerWay's centralization principle.

---

# 15. Durable Write Queue

## Source

`src/services/progressWriteQueue.ts`

## Decision

# **ADAPT THE QUEUE CORE, NOT THE OPERATION REGISTRY**

## Strong behaviors

The queue contains valuable reliability thinking:

- localStorage-backed queued writes
- retry attempts
- age limits
- maximum queue size
- sanitization
- dedupe keys
- operation dispatch
- replay
- permanent-vs-retry failure handling

This is excellent reference material for a study tool where learner writing must not disappear.

## Why not copy wholesale

The operation registry is full of CodeHerWay-specific writes:

- lessons
- quiz scores
- bookmarks
- challenges
- course visits
- CodeHerWay notes
- multiple card variants

Study Journal does not need this registry.

## Recommended Study Journal design

Extract a generic durable-write primitive:

```ts
interface DurableWrite<TPayload> {
  id: string;
  resourceKey: string;
  operation: string;
  payload: TPayload;
  createdAt: string;
  attemptCount: number;
}
```

Then register only Study Journal operations.

Example:

```text
saveJournalEntry
createCard
updateCard
deleteCard
createQuestion
updateQuestion
createIdea
updateIdea
createHighlight
deleteHighlight
```

## Priority

Journal-entry writes should receive the highest durability guarantees.

---

# 16. Optimistic UI

## Sources

- `useLessonNoteEntries.ts`
- `useReviewQueue.ts`

## Decision

# **REUSE THE PATTERN**

Study Journal should feel immediate.

Use optimistic state for:

- questions
- ideas
- cards
- lightweight journal objects

But notebook text should also have a local recovery copy before remote confirmation.

## Required rollback behavior

If a write fails:

- preserve learner input
- communicate failure
- never silently remove text
- never leave a fake "saved" state

---

# 17. Card Identity

## Current CodeHerWay state

Current CodeHerWay code has improved identity handling by preferring:

1. platform id
2. row id
3. source note id
4. question text fallback

This is safer than older question-only identity.

## Decision

# **IMPROVE FURTHER IN STUDY JOURNAL**

Study Journal should never need question text as identity.

Every card should have a stable UUID from creation.

Recommended:

```ts
interface StudyCard {
  id: string;
  // ...
}
```

Client-generated UUIDs are acceptable if the persistence architecture supports them.

## Reason

The learner must be able to:

- edit question
- edit answer
- merge later if needed
- delete
- preserve review history
- maintain source links

without identity ambiguity.

---

# 18. Card Dedupe

## Current CodeHerWay behavior

The current card queue and authoring form still use question text for duplicate detection in some flows.

## Decision

# **ADAPT**

Question-text duplicate prevention can be helpful UX, but it must not be database identity.

## Study Journal approach

Use duplicate detection as a warning:

> "You already have a similar card."

Possible MVP rule:

- exact normalized prompt match within the same learner account
- user may edit or cancel
- do not silently overwrite

Future semantic duplicate detection is out of scope.

---

# 19. Source Provenance

## CodeHerWay pattern

Current CodeHerWay cards can carry:

- `sourceLessonKey`
- `sourceNoteKey`

This is useful but lesson-specific.

## Decision

# **REUSE THE CONCEPT, GENERALIZE THE MODEL**

Study Journal needs stronger provenance.

Recommended:

```ts
type SourceObjectType =
  | 'journal-selection'
  | 'highlight'
  | 'question'
  | 'takeaway'
  | 'manual';

interface StudyCardSource {
  journalEntryId: string;
  topicId: string;
  sourceObjectId?: string;
  sourceObjectType: SourceObjectType;
  selectedText?: string;
}
```

This allows the card review screen to offer:

> View in notebook

and return the learner to the source entry.

---

# 20. Note-to-Card Bridge

## Decision

# **REWRITE AS A STUDY JOURNAL COMMAND**

Do not copy the CodeHerWay note-to-card coupling.

Study Journal should use an explicit source-aware creation command.

Example:

```ts
openCardComposer({
  source: {
    type: 'journal-selection',
    journalEntryId,
    selectedText,
  },
  suggestedAnswer: selectedText,
});
```

The learner then shapes:

- question
- answer
- hint

before saving.

## Requirement

No background operation may create a card merely because:

- a note was saved
- a note was edited
- text was highlighted
- a question was captured

Card creation always requires explicit learner intent.

---

# 21. Questions and Ideas

## CodeHerWay reuse

There is no need to force these into the notes or cards architecture.

## Decision

# **NEW STUDY JOURNAL IMPLEMENTATION**

Questions and ideas should be independent first-class entities.

Do not overload:

- notes
- bookmarks
- card hints
- tags

to simulate them.

This is one of the places where a clean new domain model is better than reuse.

---

# 22. Highlights

## Decision

# **NEW IMPLEMENTATION**

CodeHerWay note source categories should not dictate the Study Journal highlight system.

Highlights should be editor-native annotations with stable metadata.

Recommended fields:

```ts
interface Highlight {
  id: string;
  journalEntryId: string;
  type: 'important' | 'understood' | 'review' | 'definition' | 'project-idea';
  selectedText: string;
  anchor: EditorSelectionAnchor;
  note?: string;
}
```

The exact anchoring mechanism depends on the chosen Tiptap persistence design.

---

# 23. Feature Flags

## CodeHerWay pattern

The notes implementation still contains feature branches such as:

- note entries enabled
- notes-to-card enabled

## Decision

# **DO NOT RECREATE FLAG COMPLEXITY IN MVP**

Study Journal is greenfield enough that Phase 1 should have one canonical flow.

Only add feature flags when there is a real deployment need.

Do not ship:

```text
legacy notebook
new notebook
fallback notebook
experimental notebook
```

simultaneously.

That is how software begins collecting archaeology layers before it has users.

---

# 24. Search

## CodeHerWay reuse

CodeHerWay has several note search surfaces historically.

## Decision

# **REWRITE AROUND ONE SEARCH MODEL**

Study Journal should eventually have one cross-object search service.

Phase 1 should keep this narrow:

- topics
- journal entry titles/content

Later:

- cards
- questions
- ideas
- highlights

Do not copy three separate note-search implementations.

---

# 25. Accessibility

## CodeHerWay strengths

The reviewed systems show useful accessibility discipline:

- focus traps
- `aria-live`
- alert/status distinction
- modal labels
- roving tabindex on tabs
- keyboard handling
- mobile keyboard-aware focus behavior

## Decision

# **REUSE THE PATTERNS**

Study Journal should treat these as baseline engineering standards.

## Required Study Journal checks

- editor toolbar keyboard navigation
- selected-text toolbar keyboard access
- accessible highlight semantics
- collapsible right rail state announced
- mobile sheet focus handling
- no keyboard trap in Tiptap
- save status announced without becoming noisy

---

# 26. Responsive Behavior Reuse

## Decision

# **REWRITE FOR NOTEBOOK-FIRST LAYOUT**

CodeHerWay's responsive behavior is useful as implementation reference but the Study Journal layout is fundamentally different.

Study Journal responsive priority:

```text
Notebook
> current study actions
> context rail
> navigation
```

At narrow widths:

- preserve notebook width
- collapse right rail
- move navigation into drawer
- move card/question/idea context into sheet/drawer

Do not shrink all three desktop columns until none are pleasant.

---

# 27. Analytics

## Decision

# **DO NOT PORT DURING PHASE 1**

CodeHerWay uses analytics events throughout learning surfaces.

Study Journal Phase 1 should not begin by copying analytics infrastructure.

Dogfooding observations are more useful initially.

If analytics are later added, measure meaningful workflow outcomes such as:

- study session started
- journal entry edited
- My Version completed
- card deliberately created
- question resolved

Avoid measuring typing volume as a proxy for learning.

---

# 28. Database Reuse

## Decision

# **REUSE SUPABASE AS A PLATFORM IF DESIRED; DO NOT REUSE CODEHERWAY TABLES**

The Study Journal should have its own schema.

Do not point Study Journal directly at:

- `notes`
- `note_entries`
- `sr_cards`

in the CodeHerWay project.

## Reasons

- separate product domain
- independent migration history
- cleaner naming
- no CodeHerWay feature flags
- no legacy constraints
- no accidental cross-product data
- easier portfolio architecture explanation

## Recommended ownership

Use either:

- a separate Supabase project, or
- a clearly isolated schema/project strategy

The safest default is a separate project.

---

# 29. Recommended Study Journal Persistence Schema

A practical first version:

## `journal_entries`

```text
id
user_id
topic_id
title
content_json
my_version_json
clicked_json        optional
confused_json       optional
takeaways_json      optional
created_at
updated_at
```

## `study_cards`

```text
id
user_id
journal_entry_id
topic_id
source_object_id
source_object_type
prompt
answer
hint
added_at
next_review
interval_days
ease
repetition_count
last_grade
graded_at
created_at
updated_at
```

## `study_questions`

```text
id
user_id
journal_entry_id
topic_id
text
answer
status
created_at
answered_at
updated_at
```

## `study_ideas`

```text
id
user_id
journal_entry_id
topic_id
title
description
category
status
created_at
updated_at
```

## `study_highlights`

The exact persistence strategy should be finalized with the Tiptap selection/annotation model before schema freeze.

---

# 30. Recommended Extraction Boundary

Do not make Study Journal import runtime modules directly from the CodeHerWay repository.

Instead:

1. identify proven behavior
2. port the minimal code
3. rename it for Study Journal
4. port relevant tests
5. remove CodeHerWay dependencies
6. document provenance in internal architecture notes if useful
7. validate independently

## Why

Direct cross-repo runtime dependency would create:

- coupling
- deployment complexity
- release coordination
- accidental CodeHerWay regressions
- awkward portfolio ownership

Study Journal should own its implementation.

---

# 31. File-by-File Decision Matrix

| CodeHerWay file/system | Decision | Study Journal treatment |
|---|---|---|
| `src/services/srAlgorithm.ts` | **REUSE** | Port pure scheduler and tests |
| `src/services/srDefaults.ts` | **REUSE** | Port scheduling seed values |
| `src/features/cards/cardDefaults.ts` | **REUSE/ADAPT** | Preserve centralized defaults pattern |
| `src/hooks/useReviewQueue.ts` | **ADAPT** | Rebuild around Study Journal card types and repository adapter |
| `src/features/cards/CardFormDialog.tsx` | **ADAPT** | Reuse validation/accessibility behavior; redesign UI |
| `src/hooks/useFocusTrap.ts` | **REUSE/ADAPT** | Port if sufficiently generic |
| `src/components/learning/LessonNotesPanel.tsx` | **REWRITE** | Notebook replaces panel model |
| 800 ms note debounce pattern | **ADAPT** | Use as starting autosave interval, validate during dogfooding |
| unmount save flush | **REUSE/ADAPT** | Preserve with local recovery safeguards |
| note save/error state | **REUSE CONCEPT** | Expand into explicit sync state |
| `src/hooks/useLessonNoteEntries.ts` | **DO NOT USE AS-IS** | Extract optimistic CRUD only |
| note→SR card automatic behavior | **PROHIBITED** | Never port |
| `src/services/progressService.ts` | **ADAPT SELECTIVELY** | Split into Study Journal repositories |
| `src/services/progressWriteQueue.ts` | **ADAPT CORE** | Extract durable generic write queue |
| CodeHerWay operation registry | **DO NOT COPY** | Create only Study Journal operations |
| CodeHerWay `notes` legacy store | **DO NOT USE** | No legacy model |
| CodeHerWay `note_entries` schema | **REFERENCE ONLY** | New Study Journal schema |
| CodeHerWay `sr_cards` table | **REFERENCE ONLY** | New Study Journal table |
| question-text unique identity | **DO NOT USE AS IDENTITY** | Stable UUID from creation |
| source lesson/note linkage | **REUSE CONCEPT** | Generalize to journal/topic/object provenance |
| body portal for modal | **REUSE** | Keep |
| roving tabs / aria-live patterns | **REUSE** | Apply where applicable |
| CodeHerWay analytics | **DEFER** | Not part of Phase 1 |
| CodeHerWay feature flags | **DO NOT PORT BY DEFAULT** | One canonical MVP path |

---

# 32. Required Pre-Implementation Refactors in Study Journal

Before feature implementation proceeds deeply, create these Study Journal-owned modules.

## 32.1 Card scheduling

```text
src/features/cards/scheduling/
├── srAlgorithm.ts
├── cardDefaults.ts
└── srAlgorithm.test.ts
```

## 32.2 Persistence interfaces

```text
src/features/journal/data/journalRepository.ts
src/features/cards/data/cardRepository.ts
src/features/questions/data/questionRepository.ts
src/features/ideas/data/ideaRepository.ts
```

## 32.3 Durable write abstraction

```text
src/lib/durableWrites/
├── queue.ts
├── storage.ts
├── replay.ts
└── types.ts
```

Only implement as much as Phase 1 needs.

## 32.4 Card composer

```text
src/features/cards/components/
├── CardComposer.tsx
├── CardComposerDialog.tsx
└── CardComposerSheet.tsx
```

## 32.5 Journal autosave

```text
src/features/journal/hooks/useJournalAutosave.ts
```

This must own:

- debounce
- dirty state
- local recovery
- remote save
- error state
- unmount/route-change safety

---

# 33. Prohibited Reuse

The following should be explicitly forbidden in the Phase 1 implementation prompt.

## Do not:

1. Copy `LessonNotesPanel.tsx` and restyle it.
2. Copy `useLessonNoteEntries.ts` without removing card coupling.
3. Auto-create cards from notes.
4. Auto-create cards from highlights.
5. Use raw question text as card identity.
6. Introduce both legacy and new note stores.
7. Make Study Journal depend on CodeHerWay providers.
8. Point Study Journal directly at CodeHerWay production tables.
9. Copy the full `progressWriteQueue` registry.
10. recreate CodeHerWay feature-flag branching unless a real release need exists.
11. bring CodeHerWay lesson catalog assumptions into the Study Journal domain.
12. treat CodeHerWay UI as the visual source of truth.

---

# 34. Reuse Validation Checklist

Before a reused module is accepted into Study Journal, verify:

- [ ] No CodeHerWay provider dependency remains.
- [ ] No CodeHerWay route dependency remains.
- [ ] No lesson-key assumption remains unless intentionally mapped.
- [ ] No automatic note-to-card behavior remains.
- [ ] Stable ids are used.
- [ ] Source provenance uses Study Journal entities.
- [ ] Tests have been ported or rewritten.
- [ ] Accessibility behavior remains intact.
- [ ] Mobile behavior has been considered.
- [ ] No CodeHerWay production database table is required.
- [ ] The module can be explained as a Study Journal-owned abstraction.

---

# 35. Phase 1 Reuse Order

Use CodeHerWay components in this order of dependency.

## Step 1 — Port scheduler

Port:

- SR algorithm
- defaults
- tests

Validate independently.

## Step 2 — Define Study Journal card model

Do this before adapting review queue.

## Step 3 — Adapt review behavior

Port only:

- scheduling dispatch
- reshow
- bury
- due logic
- optimistic card state

Connect to Study Journal repositories.

## Step 4 — Build notebook persistence

Use CodeHerWay's autosave/retry lessons, but implement a Study Journal-owned autosave hook.

## Step 5 — Build explicit card composer

Adapt form validation/accessibility behavior.

Do not wire card creation into note save.

## Step 6 — Build questions and ideas independently

No CodeHerWay emulation required.

## Step 7 — Add durable writes

Start with journal entry reliability.

Then extend to other object writes if needed.

---

# 36. Testing Requirements for Reused Behavior

## Scheduler

- [ ] forgot resets repetition behavior correctly
- [ ] forgot schedules same-session reshow
- [ ] hard updates correctly
- [ ] good updates correctly
- [ ] easy updates correctly
- [ ] ease clamps correctly
- [ ] next review uses controlled clock

## Review queue

- [ ] stable id survives prompt edit
- [ ] editing prompt does not reset schedule
- [ ] deleting removes correct id
- [ ] due filter is correct
- [ ] forgot reappears during same session
- [ ] bury hides until expected time

## Autosave

- [ ] typing does not write on every keystroke
- [ ] debounce saves latest content
- [ ] route change does not lose pending content
- [ ] browser refresh restores latest safe draft
- [ ] remote error does not erase local text
- [ ] offline state is distinguishable from fully synced

## Card composer

- [ ] prompt required
- [ ] answer required
- [ ] selected text may prefill but remains editable
- [ ] saving requires explicit action
- [ ] focus trap works
- [ ] escape behavior works
- [ ] mobile keyboard does not cover critical controls

## Note/card independence

- [ ] saving a note creates zero cards
- [ ] editing a note creates zero cards
- [ ] deleting a note does not delete a card unless a later explicit product rule defines a source-deletion policy
- [ ] highlighting creates zero cards
- [ ] card creation occurs only through explicit card action

---

# 37. Important Source-Deletion Decision

Study Journal should **not** inherit CodeHerWay's current behavior where deleting a linked note can delete the linked card.

A learned card may remain valuable after its source note changes or disappears.

## Recommended Phase 1 rule

When source content is deleted:

- retain the card
- mark source link unavailable if necessary
- do not delete review history automatically

This preserves learner work.

A future explicit "delete source and linked objects" action may be designed separately if needed.

---

# 38. Architecture Recommendation

The strongest Study Journal architecture is:

```text
Notebook UI
   ↓
Feature commands/hooks
   ↓
Domain models
   ↓
Repositories
   ↓
Durable write layer
   ↓
Supabase
```

Spaced repetition stays pure:

```text
Card state
   ↓
srAlgorithm
   ↓
new schedule
   ↓
card repository
```

Card creation stays explicit:

```text
Selection
   ↓
Card Composer
   ↓
Learner edits
   ↓
Save
   ↓
Card repository
```

Notes never own the card lifecycle.

---

# 39. Final Audit Verdict

CodeHerWay is a valuable implementation source for Study Journal, but it should be treated as a **pattern library**, not as a donor application to clone.

## Best reuse candidates

### Directly reusable
- spaced-repetition algorithm
- scheduling defaults
- accessibility primitives
- modal portal pattern
- pure review utilities where sufficiently isolated

### Adapt carefully
- review queue
- autosave
- optimistic CRUD
- durable write queue
- card authoring validation
- persistence service patterns
- source-link concepts

### Rewrite
- notebook UI
- note editor
- journal page
- right context rail
- responsive study layout
- search
- question/idea/highlight surfaces

### Explicitly reject
- automatic note-to-card conversion
- lesson-specific provider coupling
- dual note-store architecture
- question text as identity
- CodeHerWay database tables as Study Journal persistence
- entire progress operation registry
- legacy feature-flag complexity

---

# 40. Go / No-Go Decision

## **GO for Phase 1 implementation with constraints**

Study Journal can safely reuse selected CodeHerWay logic **after extraction into Study Journal-owned modules**.

Implementation should not begin by copying entire CodeHerWay notes/card components.

The first safe coding sequence is:

1. establish Study Journal domain types
2. port and test SR scheduler
3. define Study Journal persistence interfaces
4. implement notebook autosave
5. build notebook editor
6. implement explicit card composer
7. adapt review queue
8. implement questions and ideas
9. add responsive context rail
10. validate the complete vertical slice through real study sessions

---

# 41. Immediate Next Action

Create the Phase 1 implementation task from this audit with the following non-negotiable instruction:

> Reuse CodeHerWay only according to `CODEHERWAY-REUSE-AUDIT.md`. Do not copy whole notes/card surfaces, do not introduce CodeHerWay providers or production-table dependencies, and do not create cards automatically from notes, highlights, questions, or journal edits.

The first implementation milestone should prove:

> **Open topic → write in notebook → autosave safely → select text → deliberately create card/question/idea → see linked object → refresh → all work remains intact.**
