/** Max chars passed to query embedding for semantic retrieval (includes dialogue context). */
export const RETRIEVAL_EMBEDDING_QUERY_MAX_CHARS = 2000;

export const RETRIEVAL_EMBEDDING_QUERY_MIN_CHARS = 2;

export function isValidRetrievalEmbeddingQuery(text: string): boolean {
  const query = text.trim();
  return (
    query.length >= RETRIEVAL_EMBEDDING_QUERY_MIN_CHARS &&
    query.length <= RETRIEVAL_EMBEDDING_QUERY_MAX_CHARS
  );
}
