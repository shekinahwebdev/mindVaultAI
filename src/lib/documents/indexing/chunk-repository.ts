import { getWriteProviderSpec } from "@/lib/ai/embedding-providers/config";
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
  provider?: "gemini" | "openai";
}): Promise<void> {
  const vectorLiteral = toVectorLiteral(params.embedding);
  if (params.provider === "openai") {
    await prisma.$executeRaw`
      UPDATE document_chunks
      SET
        openai_embedding = ${vectorLiteral}::vector,
        openai_embedding_model = ${params.model},
        openai_embedding_dimensions = ${params.dimensions},
        updated_at = now()
      WHERE document_id = ${params.documentId}
        AND processing_version = ${params.processingVersion}
        AND chunk_index = ${params.chunkIndex}
    `;
    return;
  }
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
  const writeSpec = getWriteProviderSpec();
  if (writeSpec.provider === "openai") {
    const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM document_chunks
      WHERE document_id = ${documentId}
        AND processing_version = ${processingVersion}
        AND openai_embedding IS NOT NULL
        AND openai_embedding_model = ${writeSpec.model}
        AND openai_embedding_dimensions = ${writeSpec.dimensions}
    `;
    return Number(rows[0]?.count ?? 0);
  }
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM document_chunks
    WHERE document_id = ${documentId}
      AND processing_version = ${processingVersion}
      AND embedding IS NOT NULL
      AND embedding_model = ${writeSpec.model}
      AND embedding_dimensions = ${writeSpec.dimensions}
  `;
  return Number(rows[0]?.count ?? 0);
}

export async function listChunkIndexesMissingEmbedding(
  documentId: string,
  processingVersion: number,
): Promise<number[]> {
  const writeSpec = getWriteProviderSpec();
  if (writeSpec.provider === "openai") {
    const rows = await prisma.$queryRaw<Array<{ chunk_index: number }>>`
      SELECT chunk_index
      FROM document_chunks
      WHERE document_id = ${documentId}
        AND processing_version = ${processingVersion}
        AND (
          openai_embedding IS NULL
          OR openai_embedding_model IS DISTINCT FROM ${writeSpec.model}
          OR openai_embedding_dimensions IS DISTINCT FROM ${writeSpec.dimensions}
        )
      ORDER BY chunk_index ASC
    `;
    return rows.map((row) => row.chunk_index);
  }
  const rows = await prisma.$queryRaw<Array<{ chunk_index: number }>>`
    SELECT chunk_index
    FROM document_chunks
    WHERE document_id = ${documentId}
      AND processing_version = ${processingVersion}
      AND (
        embedding IS NULL
        OR embedding_model IS DISTINCT FROM ${writeSpec.model}
        OR embedding_dimensions IS DISTINCT FROM ${writeSpec.dimensions}
      )
    ORDER BY chunk_index ASC
  `;
  return rows.map((row) => row.chunk_index);
}

export type DocumentChunkOpenAIMigrationRow = {
  documentId: string;
  processingVersion: number;
  chunkIndex: number;
  content: string;
  documentTitle: string;
};

export async function countDocumentChunksNeedingOpenAIEmbedding(
  model: string,
  dimensions: number,
): Promise<number> {
  const rows = await prisma.$queryRaw<Array<{ count: bigint }>>`
    SELECT COUNT(*)::bigint AS count
    FROM document_chunks dc
    INNER JOIN documents d ON d.id = dc.document_id
    WHERE d.status = 'READY'
      AND d.archived_at IS NULL
      AND (
        dc.openai_embedding IS NULL
        OR dc.openai_embedding_model IS DISTINCT FROM ${model}
        OR dc.openai_embedding_dimensions IS DISTINCT FROM ${dimensions}
      )
  `;
  return Number(rows[0]?.count ?? 0);
}

/** READY document chunks missing OpenAI vectors (for migration; reuses stored text). */
export async function listDocumentChunksNeedingOpenAIEmbedding(params: {
  model: string;
  dimensions: number;
  afterDocumentId?: string;
  limit: number;
}): Promise<DocumentChunkOpenAIMigrationRow[]> {
  const afterId = params.afterDocumentId ?? "";
  return prisma.$queryRaw<DocumentChunkOpenAIMigrationRow[]>`
    SELECT
      dc.document_id AS "documentId",
      dc.processing_version AS "processingVersion",
      dc.chunk_index AS "chunkIndex",
      dc.content AS content,
      d.title AS "documentTitle"
    FROM document_chunks dc
    INNER JOIN documents d ON d.id = dc.document_id
    WHERE d.status = 'READY'
      AND d.archived_at IS NULL
      AND (
        dc.openai_embedding IS NULL
        OR dc.openai_embedding_model IS DISTINCT FROM ${params.model}
        OR dc.openai_embedding_dimensions IS DISTINCT FROM ${params.dimensions}
      )
      AND (${afterId} = '' OR dc.document_id > ${afterId})
    ORDER BY dc.document_id ASC, dc.processing_version ASC, dc.chunk_index ASC
    LIMIT ${params.limit}
  `;
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
