// Centralized date parsing & formatting helpers
// Normalizes a value that may be Date | string | number | null/undefined into a valid Date or null.
export type DateInput = Date | string | number | null | undefined;

export function parseDate(input: DateInput): Date | null {
  if (input == null) return null;
  if (input instanceof Date) return isNaN(input.getTime()) ? null : input;
  if (typeof input === "number") {
    const d = new Date(input);
    return isNaN(d.getTime()) ? null : d;
  }
  if (typeof input === "string") {
    const trimmed = input.trim();
    if (!trimmed) return null;
    const d = new Date(trimmed);
    return isNaN(d.getTime()) ? null : d;
  }
  // Fallback coercion
  try {
    const d = new Date(String(input));
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

// Formats a date safely with provided formatter or locale options.
export function formatDateSafe(
  input: DateInput,
  opts?: Intl.DateTimeFormatOptions,
  locale: string = "en-US"
): string {
  const d = parseDate(input);
  if (!d) return "Invalid Date";
  return d.toLocaleDateString(locale, opts);
}

// Returns ISO string or null
export function toIso(input: DateInput): string | null {
  const d = parseDate(input);
  return d ? d.toISOString() : null;
}
