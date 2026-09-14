type RandomSource = Pick<Crypto, 'getRandomValues'> & Partial<Pick<Crypto, 'randomUUID'>>;

/**
 * Creates a stable v4 UUID at object-creation time. Identity never depends on
 * prompt or question text.
 *
 * `crypto.randomUUID` only exists in secure contexts, so previews opened over
 * plain http on a LAN address fall back to `getRandomValues`.
 */
export function createId(source: RandomSource = globalThis.crypto): string {
  if (typeof source.randomUUID === 'function') return source.randomUUID();

  const bytes = source.getRandomValues(new Uint8Array(16));
  bytes[6] = ((bytes[6] ?? 0) & 0x0f) | 0x40;
  bytes[8] = ((bytes[8] ?? 0) & 0x3f) | 0x80;
  const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}
