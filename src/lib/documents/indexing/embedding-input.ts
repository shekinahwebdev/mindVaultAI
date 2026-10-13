/** Max characters sent to Gemini for a single chunk embedding (provider safety). */
export const DOCUMENT_CHUNK_EMBED_MAX_CHARS = 12_000;

export function buildDocumentChunkEmbeddingInput(title: string, chunkContent: string): string {
  const safeTitle = title.trim().slice(0, 500);
  const safeContent = chunkContent.trim();
  if (safeContent.length > DOCUMENT_CHUNK_EMBED_MAX_CHARS) {
    throw new Error("Document chunk exceeds embedding input limit.");
  }
  return `Document: ${safeTitle}\n\nContent:\n${safeContent}`;
}
