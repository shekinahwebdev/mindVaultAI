/**
 * Display label: trimmed, internal whitespace collapsed, casing preserved.
 * Canonical key: lowercase display (punctuation preserved, e.g. C++, Node.js).
 */

const WHITESPACE = /\s+/g;

export function normalizeTagDisplayName(input: string): string {
  return input.trim().replace(WHITESPACE, " ");
}

/** Canonical uniqueness/search key derived from the display name. */
export function normalizeTagName(input: string): string {
  return normalizeTagDisplayName(input).toLowerCase();
}

export function normalizeTagFields(raw: string): {
  name: string;
  normalizedName: string;
} {
  const name = normalizeTagDisplayName(raw);
  const normalizedName = name.toLowerCase();
  return { name, normalizedName };
}
