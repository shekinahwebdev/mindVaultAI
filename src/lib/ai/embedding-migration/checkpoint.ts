import { prisma } from "@/lib/db";

export const OPENAI_MIGRATION_GLOBAL_KEY = "openai_embedding_migration_v1";

export type OpenAIMigrationCheckpointPayload = {
  cancelled?: boolean;
  notesProcessed: number;
  notesFailed: number;
  chunksProcessed: number;
  chunksFailed: number;
  lastNoteId?: string;
  lastChunkCursor?: {
    documentId: string;
    processingVersion: number;
    chunkIndex: number;
  };
  updatedAt: string;
};

export function emptyMigrationCheckpoint(): OpenAIMigrationCheckpointPayload {
  return {
    notesProcessed: 0,
    notesFailed: 0,
    chunksProcessed: 0,
    chunksFailed: 0,
    updatedAt: new Date().toISOString(),
  };
}

export async function readOpenAIMigrationCheckpoint(): Promise<OpenAIMigrationCheckpointPayload> {
  const row = await prisma.embeddingMigrationCheckpoint.findUnique({
    where: { key: OPENAI_MIGRATION_GLOBAL_KEY },
  });
  if (!row?.payload || typeof row.payload !== "object") {
    return emptyMigrationCheckpoint();
  }
  return { ...emptyMigrationCheckpoint(), ...(row.payload as OpenAIMigrationCheckpointPayload) };
}

export async function writeOpenAIMigrationCheckpoint(
  payload: OpenAIMigrationCheckpointPayload,
): Promise<void> {
  await prisma.embeddingMigrationCheckpoint.upsert({
    where: { key: OPENAI_MIGRATION_GLOBAL_KEY },
    create: {
      key: OPENAI_MIGRATION_GLOBAL_KEY,
      payload: { ...payload, updatedAt: new Date().toISOString() },
    },
    update: {
      payload: { ...payload, updatedAt: new Date().toISOString() },
    },
  });
}

export async function requestOpenAIMigrationCancel(): Promise<void> {
  const current = await readOpenAIMigrationCheckpoint();
  await writeOpenAIMigrationCheckpoint({ ...current, cancelled: true });
}
