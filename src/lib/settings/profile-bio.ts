export const PROFILE_BIO_MAX_LENGTH = 200;

/** Trim outer whitespace; empty → null. Preserves internal spaces and line breaks. */
export function normalizeProfileBio(value: string): string | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }
  return trimmed;
}

export function profileBioLengthError(length: number): string | null {
  if (length > PROFILE_BIO_MAX_LENGTH) {
    return `Bio must be at most ${PROFILE_BIO_MAX_LENGTH} characters.`;
  }
  return null;
}
