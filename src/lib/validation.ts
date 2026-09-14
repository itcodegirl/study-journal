export type FieldErrors<Field extends string> = Partial<Record<Field, string>>;

export function hasErrors(errors: FieldErrors<string>): boolean {
  return Object.values(errors).some(Boolean);
}

interface TextRule {
  value: string;
  maxLength: number;
  requiredMessage?: string;
  tooLongMessage: string;
}

/** Validates a trimmed text field; returns the error message or undefined. */
export function checkText({ value, maxLength, requiredMessage, tooLongMessage }: TextRule): string | undefined {
  const trimmed = value.trim();
  if (!trimmed) return requiredMessage;
  if (trimmed.length > maxLength) return tooLongMessage;
  return undefined;
}
