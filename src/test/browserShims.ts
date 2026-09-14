// jsdom lacks layout APIs that the app (matchMedia) and ProseMirror (range
// geometry, scrollIntoView) touch. These shims keep component tests honest about
// behavior without pretending to measure layout.

let viewportWidth = 1440;
const mediaListeners = new Set<() => void>();

function evaluateMediaQuery(query: string): boolean {
  return query.split(' and ').every((clause) => {
    const match = clause.match(/\((min|max)-width:\s*([\d.]+)px\)/);
    if (!match) return false;
    const limit = Number(match[2]);
    return match[1] === 'min' ? viewportWidth >= limit : viewportWidth <= limit;
  });
}

export function setViewportWidth(width: number): void {
  viewportWidth = width;
  mediaListeners.forEach((listener) => listener());
}

const emptyRect = (): DOMRect => ({
  x: 0,
  y: 0,
  width: 0,
  height: 0,
  top: 0,
  right: 0,
  bottom: 0,
  left: 0,
  toJSON: () => ({}),
});

const emptyRectList = (): DOMRectList =>
  Object.assign([] as DOMRect[], { item: () => null }) as unknown as DOMRectList;

export function installBrowserShims(): void {
  window.matchMedia = (query: string) => {
    const listeners = new Map<EventListenerOrEventListenerObject, () => void>();
    const list = {
      get matches() {
        return evaluateMediaQuery(query);
      },
      media: query,
      onchange: null,
      addEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
        const notify = () => {
          if (typeof listener === 'function') listener(new Event('change'));
          else listener.handleEvent(new Event('change'));
        };
        listeners.set(listener, notify);
        mediaListeners.add(notify);
      },
      removeEventListener: (_type: string, listener: EventListenerOrEventListenerObject) => {
        const notify = listeners.get(listener);
        if (notify) mediaListeners.delete(notify);
        listeners.delete(listener);
      },
      addListener: () => undefined,
      removeListener: () => undefined,
      dispatchEvent: () => false,
    };
    return list as unknown as MediaQueryList;
  };

  Range.prototype.getBoundingClientRect = emptyRect;
  Range.prototype.getClientRects = emptyRectList;
  Element.prototype.getClientRects = emptyRectList;
  Element.prototype.scrollIntoView = () => undefined;
  document.elementFromPoint = () => null;
  window.scrollTo = () => undefined;
}
