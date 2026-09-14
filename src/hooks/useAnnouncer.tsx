import { useCallback, useState, type ReactNode } from 'react';

const ZERO_WIDTH_SPACE = '​';

/**
 * One polite live region for the page. Repeating a message alternates a
 * zero-width suffix so identical announcements are still read out.
 */
export function useAnnouncer(): { announce: (message: string) => void; region: ReactNode } {
  const [state, setState] = useState({ message: '', tick: 0 });
  const announce = useCallback((message: string) => setState((prev) => ({ message, tick: prev.tick + 1 })), []);
  const region = (
    <div role="status" aria-live="polite" aria-atomic="true" className="visually-hidden">
      {state.tick % 2 === 1 ? `${state.message}${ZERO_WIDTH_SPACE}` : state.message}
    </div>
  );
  return { announce, region };
}
