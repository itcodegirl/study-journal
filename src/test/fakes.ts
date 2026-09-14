import type { KeyValueStorage } from '../lib/storage';

/** In-memory Web Storage stand-in; `failWrites` simulates quota or permission errors. */
export class MemoryStorage implements KeyValueStorage {
  readonly values = new Map<string, string>();
  failWrites = false;

  getItem(key: string): string | null {
    return this.values.get(key) ?? null;
  }

  setItem(key: string, value: string): void {
    if (this.failWrites) throw new DOMException('The quota has been exceeded.', 'QuotaExceededError');
    this.values.set(key, value);
  }

  removeItem(key: string): void {
    this.values.delete(key);
  }
}

export interface Deferred<T> {
  promise: Promise<T>;
  resolve(value: T): void;
  reject(reason?: unknown): void;
}

export function createDeferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

export const paragraphDoc = (text: string) => ({
  type: 'doc',
  content: [{ type: 'paragraph', content: [{ type: 'text', text }] }],
});
