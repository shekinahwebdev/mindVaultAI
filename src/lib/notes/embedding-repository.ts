import { NoteType } from "@/generated/prisma/enums";
import { Prisma } from "@/generated/prisma/client";
import {
  getProviderSpec,
  type EmbeddingProviderName,
} from "@/lib/ai/embedding-providers/config";
import { getRetrievalProviderSpec } from "@/lib/ai/embed-text";
import { prisma } from "@/lib/db";

function toVectorLiteral(embedding: number[]): string {
  return `[${embedding.join(",")}]`;
}

const NO_GEMINI_MODEL_TAG = "__no_gemini__";

export async function upsertNoteEmbedding(
  noteId: string,
  embedding: number[],
  model: string,
  dimensions: number,
): Promise<void> {
  const vectorLiteral = toVectorLiteral(embedding);
  const id = crypto.randomUUID();

  await prisma.$executeRaw`
    INSERT INTO note_embeddings (id, note_id, embedding, model, dimensions, created_at, updated_at)
    VALUES (${id}, ${noteId}, ${vectorLiteral}::vector, ${model}, ${dimensions}, now(), now())
    ON CONFLICT (note_id)
    DO UPDATE SET
      embedding = EXCLUDED.embedding,
      model = EXCLUDED.model,
      dimensions = EXCLUDED.dimensions,
      updated_at = now()
  `;
}

export async function upsertNoteOpenAIEmbedding(
  noteId: string,
  embedding: number[],
  model: string,
  dimensions: number,
): Promise<void> {
  const vectorLiteral = toVectorLiteral(embedding);
  const id = crypto.randomUUID();
  const placeholder = toVectorLiteral(new Array(dimensions).fill(0));

  await prisma.$executeRaw`
    INSERT INTO note_embeddings (
      id, note_id, embedding, model, dimensions,
      openai_embedding, openai_model, openai_dimensions,
      created_at, updated_at
    )
    VALUES (
      ${id}, ${noteId},
      ${placeholder}::vector, ${NO_GEMINI_MODEL_TAG}, ${dimensions},
      ${vectorLiteral}::vector, ${model}, ${dimensions},
      now(), now()
    )
    ON CONFLICT (note_id)
    DO UPDATE SET
      openai_embedding = EXCLUDED.openai_embedding,
      openai_model = EXCLUDED.openai_model,
      openai_dimensions = EXCLUDED.openai_dimensions,
      updated_at = now()
  `;
}

export async function upsertNoteEmbeddingForProvider(
  provider: EmbeddingProviderName,
  noteId: string,
  embedding: number[],
  model: string,
  dimensions: number,
): Promise<void> {
  if (provider === "openai") {
    await upsertNoteOpenAIEmbedding(noteId, embedding, model, dimensions);
    return;
  }
  await upsertNoteEmbedding(noteId, embedding, model, dimensions);
}

export async function findNoteIdsNeedingEmbedding(
  userId: string,
  currentModel: string,
  currentDimensions: number,
): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT n.id
    FROM notes n
    LEFT JOIN note_embeddings ne ON ne.note_id = n.id
    WHERE n.user_id = ${userId}
      AND n.archived_at IS NULL
      AND (
        ne.note_id IS NULL
        OR ne.model <> ${currentModel}
        OR ne.dimensions <> ${currentDimensions}
      )
    ORDER BY n.created_at ASC
  `;

  return rows.map((row) => row.id);
}

export type NoteOpenAIMigrationRow = {
  id: string;
  title: string;
  content: string;
};

export async function listNotesNeedingOpenAIEmbedding(params: {
  model: string;
  dimensions: number;
  afterNoteId?: string;
  limit: number;
}): Promise<NoteOpenAIMigrationRow[]> {
  const afterId = params.afterNoteId ?? "";
  return prisma.$queryRaw<NoteOpenAIMigrationRow[]>`
    SELECT n.id, n.title, n.content
    FROM notes n
    LEFT JOIN note_embeddings ne ON ne.note_id = n.id
    WHERE n.archived_at IS NULL
      AND (
        ne.openai_embedding IS NULL
        OR ne.openai_model IS DISTINCT FROM ${params.model}
        OR ne.openai_dimensions IS DISTINCT FROM ${params.dimensions}
      )
      AND (${afterId} = '' OR n.id > ${afterId})
    ORDER BY n.id ASC
    LIMIT ${params.limit}
  `;
}

export async function findNoteIdsNeedingOpenAIEmbedding(
  userId: string,
  currentModel: string,
  currentDimensions: number,
): Promise<string[]> {
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    SELECT n.id
    FROM notes n
    LEFT JOIN note_embeddings ne ON ne.note_id = n.id
    WHERE n.user_id = ${userId}
      AND n.archived_at IS NULL
      AND (
        ne.openai_embedding IS NULL
        OR ne.openai_model IS DISTINCT FROM ${currentModel}
        OR ne.openai_dimensions IS DISTINCT FROM ${currentDimensions}
      )
    ORDER BY n.created_at ASC
  `;

  return rows.map((row) => row.id);
}

export type SemanticSearchRow = {
  id: string;
  title: string;
  content: string;
  type: NoteType;
  sourceUrl: string | null;
  categoryId: string | null;
  categoryName: string | null;
  createdAt: Date;
  updatedAt: Date;
  similarity: number;
};

export type NoteSimilaritySearchOptions = {
  noteIds?: string[];
  restrictToNoteIds?: boolean;
  retrievalProvider?: EmbeddingProviderName;
};

export async function searchNotesBySimilarity(
  userId: string,
  queryEmbedding: number[],
  topK: number,
  options?: NoteSimilaritySearchOptions,
): Promise<SemanticSearchRow[]> {
  const scopeIds = options?.noteIds?.filter(Boolean) ?? [];
  if (options?.restrictToNoteIds && scopeIds.length === 0) {
    return [];
  }

  const retrievalProvider = options?.retrievalProvider ?? getRetrievalProviderSpec().provider;
  const spec = getProviderSpec(retrievalProvider);
  const vectorLiteral = toVectorLiteral(queryEmbedding);
  const noteScope =
    options?.restrictToNoteIds || scopeIds.length > 0
      ? Prisma.sql`AND n.id IN (${Prisma.join(scopeIds)})`
      : Prisma.empty;

  if (retrievalProvider === "openai") {
    return prisma.$queryRaw<SemanticSearchRow[]>`
      SELECT
        n.id AS id,
        n.title AS title,
        n.content AS content,
        n.type AS type,
        n.source_url AS "sourceUrl",
        n.category_id AS "categoryId",
        c.name AS "categoryName",
        n.created_at AS "createdAt",
        n.updated_at AS "updatedAt",
        1 - (ne.openai_embedding <=> ${vectorLiteral}::vector) AS similarity
      FROM note_embeddings ne
      JOIN notes n ON n.id = ne.note_id
      LEFT JOIN categories c ON c.id = n.category_id
      WHERE n.user_id = ${userId}
        AND n.archived_at IS NULL
        AND ne.openai_embedding IS NOT NULL
        AND ne.openai_model = ${spec.model}
        AND ne.openai_dimensions = ${spec.dimensions}
        ${noteScope}
      ORDER BY ne.openai_embedding <=> ${vectorLiteral}::vector ASC
      LIMIT ${topK}
    `;
  }

  return prisma.$queryRaw<SemanticSearchRow[]>`
    SELECT
      n.id AS id,
      n.title AS title,
      n.content AS content,
      n.type AS type,
      n.source_url AS "sourceUrl",
      n.category_id AS "categoryId",
      c.name AS "categoryName",
      n.created_at AS "createdAt",
      n.updated_at AS "updatedAt",
      1 - (ne.embedding <=> ${vectorLiteral}::vector) AS similarity
    FROM note_embeddings ne
    JOIN notes n ON n.id = ne.note_id
    LEFT JOIN categories c ON c.id = n.category_id
    WHERE n.user_id = ${userId}
      AND n.archived_at IS NULL
      AND ne.model = ${spec.model}
      AND ne.dimensions = ${spec.dimensions}
      ${noteScope}
    ORDER BY ne.embedding <=> ${vectorLiteral}::vector ASC
    LIMIT ${topK}
  `;
}
