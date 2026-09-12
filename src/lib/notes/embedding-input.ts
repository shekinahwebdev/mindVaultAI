/**
 * Text sent to the embedding model for a note. Title + content only —
 * never userId/categoryId/ids/timestamps, none of which describe what the
 * note is *about*, which is the only thing a semantic vector should encode.
 */
export function buildNoteEmbeddingInput(title: string, content: string): string {
  return `Title: ${title}\n\nContent:\n${content}`;
}
