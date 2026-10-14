import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

export type DocumentKeywordChunkRow = {
  documentId: string;
  title: string;
  originalFilename: string;
  updatedAt: Date;
  chunkContent: string;
  pageStart: number;
  pageEnd: number;
  matchKind: "title" | "filename" | "body";
};

const KEYWORD_CHUNK_CANDIDATE_LIMIT = 120;

/**
 * Keyword matches for READY documents: metadata + one best chunk row per document.
 */
export async function searchDocumentsByKeyword(
  userId: string,
  query: string,
  documentIds: string[] | null,
): Promise<DocumentKeywordChunkRow[]> {
  if (documentIds !== null && documentIds.length === 0) {
    return [];
  }

  const pattern = `%${query}%`;

  const scopeFilter =
    documentIds && documentIds.length > 0
      ? Prisma.sql`AND d.id IN (${Prisma.join(documentIds)})`
      : Prisma.empty;

  const metadataRows = await prisma.$queryRaw<
    Array<{
      documentId: string;
      title: string;
      originalFilename: string;
      updatedAt: Date;
      matchKind: string;
    }>
  >`
    SELECT
      d.id AS "documentId",
      d.title AS title,
      d.original_filename AS "originalFilename",
      d.updated_at AS "updatedAt",
      CASE
        WHEN LOWER(d.title) = LOWER(${query}) THEN 'title'
        WHEN d.title ILIKE ${pattern} THEN 'title'
        WHEN d.original_filename ILIKE ${pattern} THEN 'filename'
        ELSE 'title'
      END AS "matchKind"
    FROM documents d
    WHERE d.user_id = ${userId}
      AND d.archived_at IS NULL
      AND d.status = 'READY'
      ${scopeFilter}
      AND (
        d.title ILIKE ${pattern}
        OR d.original_filename ILIKE ${pattern}
      )
  `;

  const bodyRows = await prisma.$queryRaw<
    Array<{
      documentId: string;
      title: string;
      originalFilename: string;
      updatedAt: Date;
      chunkContent: string;
      pageStart: number;
      pageEnd: number;
    }>
  >`
    SELECT DISTINCT ON (d.id)
      d.id AS "documentId",
      d.title AS title,
      d.original_filename AS "originalFilename",
      d.updated_at AS "updatedAt",
      dc.content AS "chunkContent",
      dc.page_start AS "pageStart",
      dc.page_end AS "pageEnd"
    FROM documents d
    INNER JOIN document_chunks dc ON dc.document_id = d.id
    WHERE d.user_id = ${userId}
      AND d.archived_at IS NULL
      AND d.status = 'READY'
      ${scopeFilter}
      AND dc.content ILIKE ${pattern}
    ORDER BY d.id, dc.page_start ASC, dc.chunk_index ASC
    LIMIT ${KEYWORD_CHUNK_CANDIDATE_LIMIT}
  `;

  const byId = new Map<string, DocumentKeywordChunkRow>();

  for (const row of metadataRows) {
    byId.set(row.documentId, {
      documentId: row.documentId,
      title: row.title,
      originalFilename: row.originalFilename,
      updatedAt: row.updatedAt,
      chunkContent: "",
      pageStart: 1,
      pageEnd: 1,
      matchKind: row.matchKind === "filename" ? "filename" : "title",
    });
  }

  for (const row of bodyRows) {
    const existing = byId.get(row.documentId);
    if (existing && (existing.matchKind === "title" || existing.matchKind === "filename")) {
      if (!existing.chunkContent) {
        existing.chunkContent = row.chunkContent;
        existing.pageStart = row.pageStart;
        existing.pageEnd = row.pageEnd;
      }
      continue;
    }
    byId.set(row.documentId, {
      documentId: row.documentId,
      title: row.title,
      originalFilename: row.originalFilename,
      updatedAt: row.updatedAt,
      chunkContent: row.chunkContent,
      pageStart: row.pageStart,
      pageEnd: row.pageEnd,
      matchKind: "body",
    });
  }

  return [...byId.values()];
}
