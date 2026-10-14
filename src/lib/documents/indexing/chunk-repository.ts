import { prisma } from "@/lib/db";

import type { DocumentChunkDraft } from "./chunk-text";

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

export async function upsertChunkContents(
  documentId: string,
  processingVersion: number,
  chunks: DocumentChunkDraft[],
): Promise<void> {
  for (const chunk of chunks) {
    const id = crypto.randomUUID();
    await prisma.$executeRaw`
      INSERT INTO document_chunks (
        id, document_id, processing_version, chunk_index,
        content, page_start, page_end, character_count, token_count,
        created_at, updated_at
      )
      VALUES (
        ${id}, ${documentId}, ${processingVersion}, ${chunk.chunkIndex},
        ${chunk.content}, ${chunk.pageStart}, ${chunk.pageEnd},
        ${chunk.characterCount}, ${chunk.tokenCount},
        now(), now()
      )
      ON CONFLICT (document_id, processing_version, chunk_index)
      DO UPDATE SET
        content = EXCLUDED.content,
        page_start = EXCLUDED.page_start,
        page_end = EXCLUDED.page_end,
        character_count = EXCLUDED.character_count,
        token_count = EXCLUDED.token_count,
        updated_at = now()
    `;
  }
}

export async function upsertChunkEmbedding(params: {
  documentId: string;
  processingVersion: number;
  chunkIndex: number;
  embedding: number[];
  model: string;
  dimensions: number;
}): Promise<void> {
  const vectorLiteral = toVectorLiteral(params.embedding);
  await prisma.$executeRaw`
    UPDATE document_chunks
    SET
      embedding = ${vectorLiteral}::vector,
      embedding_model = ${params.model},
      embedding_dimensions = ${params.dimensions},
      updated_at = now()
    WHERE document_id = ${params.documentId}
      AND processing_version = ${params.processingVersion}
      AND chunk_index = ${params.chunkIndex}
  `;
}

export async function countChunksForVersion(
  documentId: string,
  processingVersion: number,
): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM document_chunks
    WHERE document_id = ${documentId}
      AND processing_version = ${processingVersion}
  `;
  return Number(rows[0]?.count ?? 0);
}

export async function countEmbeddedChunksForVersion(
  documentId: string,
  processingVersion: number,
): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM document_chunks
    WHERE document_id = ${documentId}
      AND processing_version = ${processingVersion}
      AND embedding IS NOT NULL
      AND embedding_dimensions = 768
  `;
  return Number(rows[0]?.count ?? 0);
}

export async function listChunkIndexesMissingEmbedding(
  documentId: string,
  processingVersion: number,
): Promise<number[]> {
  const rows = await prisma.$queryRaw<Array<{ chunk_index: number }>>`
    SELECT chunk_index
    FROM document_chunks
    WHERE document_id = ${documentId}
      AND processing_version = ${processingVersion}
      AND embedding IS NULL
    ORDER BY chunk_index ASC
  `;
  return rows.map((row) => row.chunk_index);
}

export async function getChunkContentByIndex(
  documentId: string,
  processingVersion: number,
  chunkIndex: number,
): Promise<string | null> {
  const rows = await prisma.$queryRaw<Array<{ content: string }>>`
    SELECT content
    FROM document_chunks
    WHERE document_id = ${documentId}
      AND processing_version = ${processingVersion}
      AND chunk_index = ${chunkIndex}
    LIMIT 1
  `;
  return rows[0]?.content ?? null;
}

export async function deleteChunksForDocument(documentId: string): Promise<void> {
  await prisma.documentChunk.deleteMany({ where: { documentId } });
}
