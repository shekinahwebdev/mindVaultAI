import { embedTextOpenAI } from "@/lib/ai/embed-text-openai";
import { getProviderSpec } from "@/lib/ai/embedding-providers/config";
import { buildDocumentChunkEmbeddingInput } from "@/lib/documents/indexing/embedding-input";
import {
  countDocumentChunksNeedingOpenAIEmbedding,
  listDocumentChunksNeedingOpenAIEmbedding,
  upsertChunkEmbedding,
} from "@/lib/documents/indexing/chunk-repository";
import { buildNoteEmbeddingInput } from "@/lib/notes/embedding-input";
import {
  listNotesNeedingOpenAIEmbedding,
  upsertNoteOpenAIEmbedding,
} from "@/lib/notes/embedding-repository";
import { prisma } from "@/lib/db";

import {
  readOpenAIMigrationCheckpoint,
  writeOpenAIMigrationCheckpoint,
  type OpenAIMigrationCheckpointPayload,
} from "./checkpoint";

export type OpenAIMigrationBatchOptions = {
  noteBatchSize: number;
  chunkBatchSize: number;
};

export type OpenAIMigrationBatchResult = {
  checkpoint: OpenAIMigrationCheckpointPayload;
  done: boolean;
};

async function embedNoteOpenAI(noteId: string, title: string, content: string) {
  const text = buildNoteEmbeddingInput(title, content);
  const result = await embedTextOpenAI({ text, taskType: "note" });
  if (!result.ok) {
    return result;
  }
  await upsertNoteOpenAIEmbedding(noteId, result.embedding, result.meta.model, result.meta.dimensions);
  return result;
}

async function embedChunkOpenAI(params: {
  documentId: string;
  processingVersion: number;
  chunkIndex: number;
  content: string;
  documentTitle: string;
}) {
  const text = buildDocumentChunkEmbeddingInput(params.documentTitle, params.content);
  const result = await embedTextOpenAI({ text, taskType: "note" });
  if (!result.ok) {
    return result;
  }
  await upsertChunkEmbedding({
    documentId: params.documentId,
    processingVersion: params.processingVersion,
    chunkIndex: params.chunkIndex,
    embedding: result.embedding,
    model: result.meta.model,
    dimensions: result.meta.dimensions,
    provider: "openai",
  });
  return result;
}

export async function countOpenAIMigrationRemaining(): Promise<{ notes: number; chunks: number }> {
  const spec = getProviderSpec("openai");
  const [noteRows, chunks] = await Promise.all([
    prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*)::bigint AS count
      FROM notes n
      LEFT JOIN note_embeddings ne ON ne.note_id = n.id
      WHERE n.archived_at IS NULL
        AND (
          ne.openai_embedding IS NULL
          OR ne.openai_model IS DISTINCT FROM ${spec.model}
          OR ne.openai_dimensions IS DISTINCT FROM ${spec.dimensions}
        )
    `,
    countDocumentChunksNeedingOpenAIEmbedding(spec.model, spec.dimensions),
  ]);
  return {
    notes: Number(noteRows[0]?.count ?? 0),
    chunks,
  };
}

/**
 * One bounded batch: notes first (global cursor), then PDF chunks.
 * Never writes to Gemini columns.
 */
export async function runOpenAIMigrationBatch(
  options: OpenAIMigrationBatchOptions,
): Promise<OpenAIMigrationBatchResult> {
  const spec = getProviderSpec("openai");
  let checkpoint = await readOpenAIMigrationCheckpoint();
  if (checkpoint.cancelled) {
    return { checkpoint, done: false };
  }

  const notes = await listNotesNeedingOpenAIEmbedding({
    model: spec.model,
    dimensions: spec.dimensions,
    afterNoteId: checkpoint.lastNoteId,
    limit: options.noteBatchSize,
  });

  for (const note of notes) {
    if (checkpoint.cancelled) break;
    const outcome = await embedNoteOpenAI(note.id, note.title, note.content);
    if (outcome.ok) {
      checkpoint = {
        ...checkpoint,
        notesProcessed: checkpoint.notesProcessed + 1,
        lastNoteId: note.id,
      };
    } else {
      checkpoint = { ...checkpoint, notesFailed: checkpoint.notesFailed + 1, lastNoteId: note.id };
    }
    await writeOpenAIMigrationCheckpoint(checkpoint);
  }

  if (notes.length >= options.noteBatchSize) {
    const remaining = await countOpenAIMigrationRemaining();
    return { checkpoint, done: remaining.notes === 0 && remaining.chunks === 0 };
  }

  const chunks = await listDocumentChunksNeedingOpenAIEmbedding({
    model: spec.model,
    dimensions: spec.dimensions,
    limit: options.chunkBatchSize,
  });

  for (const chunk of chunks) {
    if (checkpoint.cancelled) break;
    const outcome = await embedChunkOpenAI(chunk);
    if (outcome.ok) {
      checkpoint = {
        ...checkpoint,
        chunksProcessed: checkpoint.chunksProcessed + 1,
        lastChunkCursor: {
          documentId: chunk.documentId,
          processingVersion: chunk.processingVersion,
          chunkIndex: chunk.chunkIndex,
        },
      };
    } else {
      checkpoint = { ...checkpoint, chunksFailed: checkpoint.chunksFailed + 1 };
    }
    await writeOpenAIMigrationCheckpoint(checkpoint);
  }

  const remaining = await countOpenAIMigrationRemaining();
  const done = remaining.notes === 0 && remaining.chunks === 0;
  return { checkpoint, done };
}
