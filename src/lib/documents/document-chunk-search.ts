import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export type DocumentChunkSearchRow = {
  chunkId: string;
  documentId: string;
  documentTitle: string;
  content: string;
  pageStart: number;
  pageEnd: number;
  chunkIndex: number;
  similarity: number;
};

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

/**
 * Cosine similarity search over READY document chunks for one user.
 * userId must come from the authenticated session — never from client input alone.
 */
export type DocumentChunkSearchOptions = {
  /** When set, restrict retrieval to these document ids (must already be user-owned READY). */
  documentIds?: string[];
  /** When true, never search the full vault — empty documentIds returns no rows. */
  restrictToDocumentIds?: boolean;
};

export async function searchDocumentChunksBySimilarity(
  userId: string,
  queryEmbedding: number[],
  topK: number,
  options?: DocumentChunkSearchOptions,
): Promise<DocumentChunkSearchRow[]> {
  const vectorLiteral = toVectorLiteral(queryEmbedding);
  const scopeIds = options?.documentIds?.filter(Boolean) ?? [];

  if (options?.restrictToDocumentIds) {
    if (scopeIds.length === 0) {
      return [];
    }
  }

  const documentScope =
    options?.restrictToDocumentIds || scopeIds.length > 0
      ? Prisma.sql`AND d.id IN (${Prisma.join(scopeIds)})`
      : Prisma.empty;

  return prisma.$queryRaw<DocumentChunkSearchRow[]>`
    SELECT
      dc.id AS "chunkId",
      d.id AS "documentId",
      d.title AS "documentTitle",
      dc.content AS content,
      dc.page_start AS "pageStart",
      dc.page_end AS "pageEnd",
      dc.chunk_index AS "chunkIndex",
      1 - (dc.embedding <=> ${vectorLiteral}::vector) AS similarity
    FROM document_chunks dc
    INNER JOIN documents d ON d.id = dc.document_id
    WHERE d.user_id = ${userId}
      AND d.status = 'READY'
      AND d.archived_at IS NULL
      AND dc.embedding IS NOT NULL
      ${documentScope}
    ORDER BY dc.embedding <=> ${vectorLiteral}::vector ASC
    LIMIT ${topK}
  `;
}
