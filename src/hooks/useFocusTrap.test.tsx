// Ported from CodeHerWay `src/hooks/useFocusTrap.test.tsx`; scroll-lock
// assertions follow the <html> overflow adaptation documented in the hook.
import { fireEvent, render, screen } from '@testing-library/react';
import { useRef, useState } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useFocusTrap } from './useFocusTrap';

function TrapHarness({
  initialFocus = 'container',
  onEscape = vi.fn(),
}: {
  initialFocus?: 'container' | 'first-tabbable';
  onEscape?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const dialogRef = useRef<HTMLDivElement>(null);

  useFocusTrap(dialogRef, {
    enabled: open,
    initialFocus,
    onEscape: () => {
      onEscape();
      setOpen(false);
    },
  });

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open dialog
      </button>
      {open && (
        <div ref={dialogRef} role="dialog" aria-label="Practice dialog" tabIndex={-1}>
          <button type="button">First action</button>
          <button type="button" hidden>
            Hidden action
          </button>
          <button type="button" style={{ visibility: 'hidden' }}>
            Invisible action
          </button>
          <span aria-hidden="true">
            <button type="button">Decorative action</button>
          </span>
          <button type="button">Last action</button>
        </div>
      )}
    </>
  );
}

function SiblingNestedHarness({ onOuterEscape = vi.fn(), onInnerEscape = vi.fn() }) {
  const [outerOpen, setOuterOpen] = useState(false);
  const [innerOpen, setInnerOpen] = useState(false);
  const outerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  useFocusTrap(outerRef, {
    enabled: outerOpen,
    initialFocus: 'first-tabbable',
    onEscape: () => {
      onOuterEscape();
      setOuterOpen(false);
    },
  });
  useFocusTrap(innerRef, {
    enabled: innerOpen,
    initialFocus: 'first-tabbable',
    onEscape: () => {
      onInnerEscape();
      setInnerOpen(false);
    },
  });

  return (
    <>
      <button type="button" onClick={() => setOuterOpen(true)}>
        Open outer
      </button>
      {outerOpen && (
        <div ref={outerRef} role="dialog" aria-label="Outer sheet" tabIndex={-1}>
          <button type="button" onClick={() => setInnerOpen(true)}>
            Open inner
          </button>
          <button type="button">Outer action</button>
        </div>
      )}
      {innerOpen && (
        <div ref={innerRef} role="dialog" aria-label="Inner dialog" tabIndex={-1}>
          <button type="button">Inner first</button>
          <button type="button">Inner last</button>
        </div>
      )}
    </>
  );
}

describe('useFocusTrap', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('style');
  });

  it('moves initial focus into the dialog, locks scrolling, and restores focus to the trigger', () => {
    const onEscape = vi.fn();
    render(<TrapHarness initialFocus="first-tabbable" onEscape={onEscape} />);

    const trigger = screen.getByRole('button', { name: /open dialog/i });
    trigger.focus();
    fireEvent.click(trigger);

    expect(screen.getByRole('button', { name: /first action/i })).toHaveFocus();
    expect(document.documentElement.style.overflow).toBe('hidden');

    fireEvent.keyDown(window, { key: 'Escape' });

    expect(onEscape).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole('dialog', { name: /practice dialog/i })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
    expect(document.documentElement.style.overflow).toBe('');
  });

  it('wraps keyboard focus between the first and last visible tabbable controls', () => {
    render(<TrapHarness initialFocus="first-tabbable" />);
    fireEvent.click(screen.getByRole('button', { name: /open dialog/i }));

    const firstAction = screen.getByRole('button', { name: /first action/i });
    const lastAction = screen.getByRole('button', { name: /last action/i });

    firstAction.focus();
    fireEvent.keyDown(window, { key: 'Tab', shiftKey: true });
    expect(lastAction).toHaveFocus();

    lastAction.focus();
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(firstAction).toHaveFocus();
  });

  it('keeps Escape from leaking to later background key handlers', () => {
    const backgroundHandler = vi.fn();
    render(<TrapHarness />);
    fireEvent.click(screen.getByRole('button', { name: /open dialog/i }));
    window.addEventListener('keydown', backgroundHandler);

    const event = new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true });
    window.dispatchEvent(event);

    expect(event.defaultPrevented).toBe(true);
    expect(backgroundHandler).not.toHaveBeenCalled();
    window.removeEventListener('keydown', backgroundHandler);
  });
});

describe('useFocusTrap — nested overlays', () => {
  afterEach(() => {
    document.documentElement.removeAttribute('style');
  });

  it('unwinds one layer per Escape and restores focus at each step', () => {
    const onOuterEscape = vi.fn();
    const onInnerEscape = vi.fn();
    render(<SiblingNestedHarness onOuterEscape={onOuterEscape} onInnerEscape={onInnerEscape} />);

    const trigger = screen.getByRole('button', { name: /open outer/i });
    trigger.focus();
    fireEvent.click(trigger);
    const innerTrigger = screen.getByRole('button', { name: /open inner/i });
    innerTrigger.focus();
    fireEvent.click(innerTrigger);
    expect(screen.getByRole('button', { name: /inner first/i })).toHaveFocus();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onInnerEscape).toHaveBeenCalledTimes(1);
    expect(onOuterEscape).not.toHaveBeenCalled();
    expect(innerTrigger).toHaveFocus();

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(screen.queryByRole('dialog', { name: /outer sheet/i })).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });

  it('releases the scroll lock only when the last overlay closes', () => {
    render(<SiblingNestedHarness />);
    fireEvent.click(screen.getByRole('button', { name: /open outer/i }));
    fireEvent.click(screen.getByRole('button', { name: /open inner/i }));
    expect(document.documentElement.style.overflow).toBe('hidden');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(document.documentElement.style.overflow).toBe('hidden');

    fireEvent.keyDown(window, { key: 'Escape' });
    expect(document.documentElement.style.overflow).toBe('');
  });
});
