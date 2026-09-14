import { describe, expect, it } from 'vitest';
import { createId } from './ids';

const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;

describe('createId', () => {
  it('creates unique v4 UUIDs', () => {
    const ids = Array.from({ length: 50 }, () => createId());
    ids.forEach((id) => expect(id).toMatch(UUID_V4));
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('falls back to getRandomValues when randomUUID is unavailable (non-secure contexts)', () => {
    const source = { getRandomValues: globalThis.crypto.getRandomValues.bind(globalThis.crypto) };
    expect(createId(source)).toMatch(UUID_V4);
  });
});
