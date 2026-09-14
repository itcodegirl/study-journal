import { useCallback, useSyncExternalStore } from 'react';

/**
 * Breakpoints follow the notebook's comfortable minimum width, not device names:
 * the sidebar and rail only sit beside the notebook once there is room for all three.
 */
export const MEDIA_QUERIES = {
  mobile: '(max-width: 767.98px)',
  inlineLayout: '(min-width: 1100px)',
  wide: '(min-width: 1280px)',
  coarsePointer: '(pointer: coarse)',
} as const;

export function useMediaQuery(query: string): boolean {
  const subscribe = useCallback(
    (onChange: () => void) => {
      const list = window.matchMedia(query);
      list.addEventListener('change', onChange);
      return () => list.removeEventListener('change', onChange);
    },
    [query],
  );
  return useSyncExternalStore(
    subscribe,
    () => window.matchMedia(query).matches,
    () => false,
  );
}
