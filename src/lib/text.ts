/** Trims a value and treats blank strings as absent. */
export function trimToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function truncate(value: string, maxLength: number): string {
  if (value.length <= maxLength) return value;
  return `${value.slice(0, Math.max(0, maxLength - 1)).trimEnd()}…`;
}

export function collapseWhitespace(value: string): string {
  return value.trim().replace(/\s+/g, ' ');
}
