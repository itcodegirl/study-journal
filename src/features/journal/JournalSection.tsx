import type { Editor } from '@tiptap/react';
import { ChevronRight } from 'lucide-react';
import { useCallback, useId, useRef, useState } from 'react';
import { cx } from '../../lib/classNames';
import type { RichTextDoc } from '../editor/editor.types';
import { NotebookEditor } from '../editor/NotebookEditor';
import type { JournalSectionConfig } from './journal.sections';
import type { SelectionSource } from './journal.types';
import { getPlainText } from './journal.utils';
import { JournalSelectionMenu } from './JournalSelectionMenu';
import type { StudyObjectKind } from './studyObjects';

export interface SectionHandlers {
  onChange: (doc: RichTextDoc) => void;
  onFocus: () => void;
  onReady: (editor: Editor | null) => void;
}

interface JournalSectionProps {
  config: JournalSectionConfig;
  initialContent: RichTextDoc | undefined;
  open: boolean;
  onToggle?: (() => void) | undefined;
  active: boolean;
  handlers: SectionHandlers;
  onCreateFromSelection: (kind: StudyObjectKind, source: SelectionSource) => void;
}

export function JournalSection({ config, initialContent, open, onToggle, active, handlers, onCreateFromSelection }: JournalSectionProps) {
  const titleId = useId();
  const hintId = useId();
  const bodyId = useId();
  const headingRef = useRef<HTMLHeadingElement>(null);
  const [hasText, setHasText] = useState(() => config.collapsible && getPlainText(initialContent).length > 0);

  const { onChange } = handlers;
  const handleChange = useCallback(
    (doc: RichTextDoc) => {
      onChange(doc);
      if (config.collapsible) setHasText(getPlainText(doc).length > 0);
    },
    [config.collapsible, onChange],
  );

  const renderSelectionMenu = useCallback(
    (editor: Editor) => <JournalSelectionMenu editor={editor} section={config.key} onCreate={onCreateFromSelection} />,
    [config.key, onCreateFromSelection],
  );

  const focusHeading = useCallback(() => headingRef.current?.focus(), []);

  return (
    <section
      className={cx('section', active && 'section--active', config.collapsible && 'section--collapsible')}
      aria-labelledby={titleId}
      data-section={config.key}
    >
      <div className="section__header">
        <h2 id={titleId} ref={headingRef} tabIndex={-1} className="section__title">
          {config.collapsible ? (
            <button type="button" className="section__toggle" aria-expanded={open} aria-controls={bodyId} onClick={onToggle}>
              <ChevronRight aria-hidden="true" className="section__chevron" />
              <span>{config.title}</span>
              {hasText && !open && <span className="section__badge">has notes</span>}
            </button>
          ) : (
            <>
              <span>{config.title}</span>
              {config.kicker && <span className="section__kicker">{config.kicker}</span>}
            </>
          )}
        </h2>
      </div>
      <p id={hintId} className="visually-hidden">
        Rich text. Select text to highlight or underline it, or to save it as a card, question, or idea.
      </p>
      <div id={bodyId} className="section__body" hidden={!open}>
        <NotebookEditor
          placeholder={config.placeholder}
          initialContent={initialContent}
          labelledBy={titleId}
          describedBy={hintId}
          onChange={handleChange}
          onFocus={handlers.onFocus}
          onReady={handlers.onReady}
          onLeave={focusHeading}
          renderSelectionMenu={renderSelectionMenu}
        />
      </div>
    </section>
  );
}
