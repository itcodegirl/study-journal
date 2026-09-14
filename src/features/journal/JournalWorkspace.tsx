import type { Editor } from '@tiptap/react';
import { useCallback, useId, useMemo, useState } from 'react';
import { flushSync } from 'react-dom';
import { Drawer } from '../../components/ui/Drawer';
import { useAnnouncer } from '../../hooks/useAnnouncer';
import { MEDIA_QUERIES, useMediaQuery } from '../../hooks/useMediaQuery';
import { readPreference, writePreference } from '../../lib/storage';
import { useRepositories } from '../../services/repositories';
import type { TopicTrail } from '../courses/courses.types';
import { findTextRange } from '../editor/editorSelection';
import type { ComposerOutcome } from './composer/ComposerDialog';
import { ComposerHost, type StudyCollections } from './composer/ComposerHost';
import { useJournalAutosave } from './hooks/useJournalAutosave';
import { useLinkedCollection } from './hooks/useLinkedCollection';
import { getSectionTitle, JOURNAL_SECTIONS } from './journal.sections';
import { JOURNAL_SECTION_KEYS, type JournalEntry, type JournalSectionKey, type SelectionSource } from './journal.types';
import { getPlainText } from './journal.utils';
import { JournalHeader } from './JournalHeader';
import { JournalNotebook } from './JournalNotebook';
import type { SectionHandlers } from './JournalSection';
import { JournalStatus } from './JournalStatus';
import { countStudyObjects, StudyContextRail, StudyContextRailStrip } from './rail/StudyContextRail';
import { StudyUtilityBar } from './rail/StudyUtilityBar';
import { KIND_LABELS, type ComposerRequest, type StudyObjectKind } from './studyObjects';

type RailPreference = 'open' | 'collapsed';

const isRailPreference = (value: unknown): value is RailPreference => value === 'open' || value === 'collapsed';

function selectionRequest(kind: StudyObjectKind, source: SelectionSource): ComposerRequest {
  const base = { source, returnTo: source.section };
  switch (kind) {
    case 'card':
      return { kind, ...base };
    case 'question':
      return { kind, ...base };
    case 'idea':
      return { kind, ...base };
  }
}

function initialOpenSections(entry: JournalEntry): Record<JournalSectionKey, boolean> {
  const open = {} as Record<JournalSectionKey, boolean>;
  for (const section of JOURNAL_SECTIONS) {
    // Reflections stay compact unless the learner already wrote in them.
    open[section.key] = !section.collapsible || getPlainText(entry[section.key]).length > 0;
  }
  return open;
}

interface JournalWorkspaceProps {
  trail: TopicTrail;
  entry: JournalEntry;
  recovered: boolean;
}

/** Everything for one open entry: notebook, autosave, linked study objects, and their composers. */
export function JournalWorkspace({ trail, entry, recovered }: JournalWorkspaceProps) {
  const repositories = useRepositories();
  const autosave = useJournalAutosave(entry, { repository: repositories.journal, recovery: repositories.recovery, recovered });
  const cards = useLinkedCollection(repositories.cards, entry.id);
  const questions = useLinkedCollection(repositories.questions, entry.id);
  const ideas = useLinkedCollection(repositories.ideas, entry.id);
  const collections: StudyCollections = { cards, questions, ideas };

  const inlineLayout = useMediaQuery(MEDIA_QUERIES.inlineLayout);
  const wide = useMediaQuery(MEDIA_QUERIES.wide);
  const isPhone = useMediaQuery(MEDIA_QUERIES.mobile);
  const { announce, region } = useAnnouncer();
  const railId = useId();

  const [railPreference, setRailPreference] = useState(() => readPreference('rail', isRailPreference));
  const railOpen = railPreference ? railPreference === 'open' : wide;
  const [contextDrawerOpen, setContextDrawerOpen] = useState(false);
  const [tab, setTab] = useState<StudyObjectKind>('card');
  const [composer, setComposer] = useState<ComposerRequest | null>(null);
  const [editors, setEditors] = useState<Partial<Record<JournalSectionKey, Editor>>>({});
  const [activeSection, setActiveSection] = useState<JournalSectionKey>('content');
  const [openSections, setOpenSections] = useState(() => initialOpenSections(entry));

  const link = useMemo(() => ({ journalEntryId: entry.id, topicId: entry.topicId }), [entry.id, entry.topicId]);

  const { update } = autosave;
  const handlers = useMemo(() => {
    const map = {} as Record<JournalSectionKey, SectionHandlers>;
    for (const key of JOURNAL_SECTION_KEYS) {
      map[key] = {
        onChange: (doc) => update(key, doc),
        onFocus: () => setActiveSection(key),
        onReady: (editor) =>
          setEditors((previous) => {
            if (editor) return { ...previous, [key]: editor };
            const { [key]: _removed, ...rest } = previous;
            return rest;
          }),
      };
    }
    return map;
  }, [update]);

  const setRail = (next: RailPreference) => {
    setRailPreference(next);
    writePreference('rail', next);
  };

  const openContext = (kind: StudyObjectKind) => {
    setTab(kind);
    if (inlineLayout) setRail('open');
    else setContextDrawerOpen(true);
  };

  const createFromSelection = useCallback(
    (kind: StudyObjectKind, source: SelectionSource) => setComposer(selectionRequest(kind, source)),
    [setComposer],
  );

  const closeComposer = (outcome: ComposerOutcome) => {
    const request = composer;
    flushSync(() => setComposer(null));
    if (!request) return;
    if (outcome === 'saved') {
      setTab(request.kind);
      announce(`${request.existing ? 'Changes to the' : 'New'} ${KIND_LABELS[request.kind].singular} saved to this entry.`);
    }
    if (request.returnTo) editors[request.returnTo]?.commands.focus();
  };

  const revealSource = (source: SelectionSource) => {
    const title = getSectionTitle(source.section);
    flushSync(() => {
      setContextDrawerOpen(false);
      setOpenSections((previous) => (previous[source.section] ? previous : { ...previous, [source.section]: true }));
    });
    const editor = editors[source.section];
    if (!editor) return;
    const range = findTextRange(editor.state.doc, source.text);
    if (!range) {
      editor.commands.focus('end');
      announce(`Couldn’t find that passage in ${title}; it may have been edited.`);
      return;
    }
    editor.chain().focus().setTextSelection(range).scrollIntoView().run();
    announce(`Showing the source in ${title}.`);
  };

  const counts = countStudyObjects(collections);
  const railControl = inlineLayout
    ? { open: railOpen, id: railId, onToggle: () => setRail(railOpen ? 'collapsed' : 'open') }
    : undefined;

  return (
    <div className="journal-layout" data-rail={inlineLayout ? (railOpen ? 'open' : 'collapsed') : 'off'}>
      <div className="journal-main">
        <div className="journal-page">
          <JournalHeader trail={trail} entry={entry} railControl={railControl} />
          {recovered && (
            <p className="recovery-notice" role="status">
              Restored writing that hadn’t finished saving last time. It will be saved again now.
            </p>
          )}
          <JournalNotebook
            entry={entry}
            editors={editors}
            activeSection={activeSection}
            openSections={openSections}
            onToggleSection={(key) => setOpenSections((previous) => ({ ...previous, [key]: !previous[key] }))}
            handlers={handlers}
            onCreateFromSelection={createFromSelection}
            status={<JournalStatus autosave={autosave} entry={entry} />}
          />
        </div>
        {!inlineLayout && <StudyUtilityBar counts={counts} onOpen={openContext} />}
      </div>

      {inlineLayout && (
        <div id={railId} className="journal-rail-slot">
          {railOpen ? (
            <StudyContextRail
              id={`${railId}-rail`}
              collections={collections}
              tab={tab}
              onTabChange={setTab}
              onCreate={(kind) => setComposer({ kind })}
              onEdit={setComposer}
              onRevealSource={revealSource}
            />
          ) : (
            <StudyContextRailStrip counts={counts} onExpand={openContext} />
          )}
        </div>
      )}

      {!inlineLayout && contextDrawerOpen && (
        <Drawer title="Study context" side={isPhone ? 'bottom' : 'right'} onClose={() => setContextDrawerOpen(false)}>
          <StudyContextRail
            id={`${railId}-drawer`}
            variant="drawer"
            collections={collections}
            tab={tab}
            onTabChange={setTab}
            onCreate={(kind) => setComposer({ kind })}
            onEdit={setComposer}
            onRevealSource={revealSource}
          />
        </Drawer>
      )}

      {composer && <ComposerHost request={composer} link={link} collections={collections} onClose={closeComposer} />}
      {region}
    </div>
  );
}
