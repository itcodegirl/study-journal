// useFocusTrap — accessibility hook for modal dialogs, drawers, and sheets.
//
// Provenance: ported from CodeHerWay `src/hooks/useFocusTrap.ts`
// (REUSE/ADAPT per docs/CODEHERWAY-REUSE-AUDIT.md). The trap stack, focus
// restoration, and Tab/Escape handling are unchanged. One adaptation: the
// scroll lock sets `overflow: hidden` on <html> instead of `position: fixed` on
// <body>. Study Journal's sidebar, toolbar, and rail are `position: sticky`,
// and a fixed body makes them jump behind every open overlay; overlays also set
// `overscroll-behavior: contain` so touch scrolling does not chain to the page.
//
// Keeps keyboard focus inside a container while it is open, restores focus to
// the previously focused element on close, and handles Escape-to-close.
// Overlays may nest: traps share a module-level stack, so only the top layer
// answers Escape and Tab.

import { useEffect, useRef } from 'react';
import type { RefObject } from 'react';

const TABBABLE_SELECTOR =
  'a[href], button:not([disabled]), input:not([disabled]), ' +
  'select:not([disabled]), textarea:not([disabled]), ' +
  '[tabindex]:not([tabindex="-1"])';

function isHiddenFromFocus(element: Element): boolean {
  if (!(element instanceof HTMLElement)) return true;
  if (element.hidden || element.closest('[hidden], [aria-hidden="true"]')) return true;

  const style = window.getComputedStyle(element);
  return style.display === 'none' || style.visibility === 'hidden';
}

interface UseFocusTrapOptions {
  enabled: boolean;
  onEscape?: () => void;
  lockScroll?: boolean;
  initialFocus?: 'container' | 'first-tabbable';
}

// Reference-counted scroll lock shared across every trap, so overlapping
// overlays can close in any order without leaving the page locked.
let scrollLockCount = 0;
let previousOverflow = '';

function acquireScrollLock(): void {
  if (scrollLockCount === 0) {
    previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
  }
  scrollLockCount += 1;
}

function releaseScrollLock(): void {
  if (scrollLockCount === 0) return;
  scrollLockCount -= 1;
  if (scrollLockCount === 0) document.documentElement.style.overflow = previousOverflow;
}

// Trap stack — which open overlay is the top layer. Every trap listens on
// `window`, but only the trap the stack names as topmost reacts to Escape or
// Tab, and lower traps never stop propagation.
interface TrapEntry {
  container: RefObject<HTMLElement | null>;
}

const trapStack: TrapEntry[] = [];

// Open order decides the top layer, with one correction: a container nested
// inside another trap's container is drawn above it, whatever the push order
// (React runs a child's effects before its parent's).
function resolveTopmostTrap(): TrapEntry | undefined {
  for (let i = trapStack.length - 1; i >= 0; i -= 1) {
    const entry = trapStack[i];
    const element = entry?.container.current;
    if (!entry || !element) return entry;
    const wrapsAnotherTrap = trapStack.some((other) => {
      const otherElement = other.container.current;
      return other !== entry && otherElement != null && element.contains(otherElement);
    });
    if (!wrapsAnotherTrap) return entry;
  }
  return trapStack[trapStack.length - 1];
}

export function useFocusTrap(containerRef: RefObject<HTMLElement | null>, options: UseFocusTrapOptions): void {
  const { enabled, onEscape, lockScroll = true, initialFocus = 'container' } = options;

  // Read onEscape through a ref so an inline callback does not rebuild the trap
  // (and re-capture the focus-restore target) on every render.
  const onEscapeRef = useRef(onEscape);
  useEffect(() => {
    onEscapeRef.current = onEscape;
  });

  useEffect(() => {
    if (!enabled) return undefined;

    if (lockScroll) acquireScrollLock();

    const entry: TrapEntry = { container: containerRef };
    trapStack.push(entry);

    const previouslyFocused = document.activeElement;
    const container = containerRef.current;
    if (container) {
      if (initialFocus === 'first-tabbable') {
        const first = container.querySelector(TABBABLE_SELECTOR);
        ((first || container) as HTMLElement).focus();
      } else {
        container.focus();
      }
    }

    const getTabbables = (): HTMLElement[] => {
      const root = containerRef.current;
      if (!root) return [];
      return Array.from(root.querySelectorAll(TABBABLE_SELECTOR)).filter(
        (el) => !isHiddenFromFocus(el),
      ) as HTMLElement[];
    };

    const handleKey = (event: KeyboardEvent) => {
      if (resolveTopmostTrap() !== entry) return;

      if (event.key === 'Escape') {
        const escape = onEscapeRef.current;
        if (escape) {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
          escape();
        }
        return;
      }

      if (event.key !== 'Tab') return;

      const tabbables = getTabbables();
      const first = tabbables[0];
      const last = tabbables[tabbables.length - 1];
      if (!first || !last) {
        event.preventDefault();
        containerRef.current?.focus();
        return;
      }

      const active = document.activeElement;

      if (!containerRef.current?.contains(active)) {
        event.preventDefault();
        first.focus();
        return;
      }

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      const stackIndex = trapStack.lastIndexOf(entry);
      if (stackIndex !== -1) trapStack.splice(stackIndex, 1);
      if (lockScroll) releaseScrollLock();
      if (previouslyFocused && previouslyFocused instanceof HTMLElement && document.contains(previouslyFocused)) {
        previouslyFocused.focus();
        return;
      }
      // The element to restore is gone; hand focus to the overlay still open
      // below rather than letting it fall to <body>.
      trapStack[trapStack.length - 1]?.container.current?.focus();
    };
  }, [containerRef, enabled, initialFocus, lockScroll]);
}
