import type { Editor } from '@tiptap/react';
import { Unlink } from 'lucide-react';
import { useEffect, useId, useRef, useState, type FormEvent, type RefObject } from 'react';
import { Button } from '../../components/ui/Button';
import { normalizeLinkHref } from './links';

interface LinkEditorProps {
  editor: Editor;
  anchorRef: RefObject<HTMLElement | null>;
  onClose: (restoreFocus: boolean) => void;
}

export function LinkEditor({ editor, anchorRef, onClose }: LinkEditorProps) {
  const id = useId();
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [value, setValue] = useState(() => {
    const href: unknown = editor.getAttributes('link')['href'];
    return typeof href === 'string' ? href : '';
  });
  const [error, setError] = useState<string | null>(null);
  const [hasLink] = useState(() => editor.isActive('link'));
  const onCloseRef = useRef(onClose);
  useEffect(() => {
    onCloseRef.current = onClose;
  });

  useEffect(() => {
    inputRef.current?.focus();
    inputRef.current?.select();
    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target as Node;
      if (formRef.current?.contains(target) || anchorRef.current?.contains(target)) return;
      onCloseRef.current(false);
    };
    document.addEventListener('pointerdown', closeOnOutsidePointer);
    return () => document.removeEventListener('pointerdown', closeOnOutsidePointer);
  }, [anchorRef]);

  const apply = (event: FormEvent) => {
    event.preventDefault();
    const href = normalizeLinkHref(value);
    if (!href) {
      setError('Enter a web address, for example react.dev/learn.');
      inputRef.current?.focus();
      return;
    }
    if (editor.state.selection.empty && !editor.isActive('link')) {
      editor
        .chain()
        .focus()
        .insertContent({ type: 'text', text: href, marks: [{ type: 'link', attrs: { href } }] })
        .run();
    } else {
      editor.chain().focus().extendMarkRange('link').setLink({ href }).run();
    }
    onClose(false);
  };

  const removeLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    onClose(false);
  };

  return (
    <form
      ref={formRef}
      className="link-editor"
      aria-label="Link"
      noValidate
      onSubmit={apply}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          onClose(true);
        }
      }}
    >
      <label htmlFor={id} className="link-editor__label">
        Link address
      </label>
      <div className="link-editor__row">
        <input
          ref={inputRef}
          id={id}
          type="text"
          inputMode="url"
          autoComplete="off"
          spellCheck={false}
          className="field__control link-editor__input"
          placeholder="https://"
          value={value}
          onChange={(event) => {
            setValue(event.target.value);
            setError(null);
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
        />
        <Button type="submit" size="sm" variant="primary">
          Apply
        </Button>
        {hasLink && (
          <Button size="sm" variant="ghost" icon={<Unlink aria-hidden="true" />} onClick={removeLink}>
            Remove
          </Button>
        )}
      </div>
      {error && (
        <p id={`${id}-error`} className="field__error">
          {error}
        </p>
      )}
    </form>
  );
}
