import { embedText, EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "@/lib/ai/embed-text";
import { ProcessingError } from "@/lib/documents/processing/job-errors";

import { buildDocumentChunkEmbeddingInput } from "./embedding-input";

export type EmbedFn = typeof embedText;

export type EmbedChunksOptions = {
  documentTitle: string;
  chunkIndexes: number[];
  readChunkContent: (chunkIndex: number) => Promise<string | null>;
  writeEmbedding: (params: {
    chunkIndex: number;
    embedding: number[];
    model: string;
    dimensions: number;
  }) => Promise<void>;
  concurrency?: number;
  embed?: EmbedFn;
  signal?: AbortSignal;
  onChunkEmbedded?: (completed: number, total: number) => Promise<void>;
};

function classifyEmbedFailure(reason: string): ProcessingError {
  if (reason === "rate_limit" || reason === "timeout") {
    return new ProcessingError(`Embedding provider ${reason}.`, "transient");
  }
  return new ProcessingError("Embedding generation failed.", "transient");
}

async function mapWithConcurrency<T>(
  items: T[],
  concurrency: number,
  worker: (item: T) => Promise<void>,
): Promise<void> {
  let index = 0;
  const runners = Array.from({ length: Math.max(1, concurrency) }, async () => {
    while (index < items.length) {
      const current = items[index];
      index += 1;
      if (current === undefined) {
        break;
      }
      await worker(current);
    }
  });
  await Promise.all(runners);
}

export async function embedDocumentChunks(options: EmbedChunksOptions): Promise<void> {
  const embed = options.embed ?? embedText;
  const concurrency = options.concurrency ?? 3;
  const total = options.chunkIndexes.length;
  let completed = 0;

  await mapWithConcurrency(options.chunkIndexes, concurrency, async (chunkIndex) => {
    if (options.signal?.aborted) {
      throw new ProcessingError("Processing aborted.", "transient");
    }

    const content = await options.readChunkContent(chunkIndex);
    if (!content) {
      throw new ProcessingError("Chunk content missing during embedding.", "transient");
    }

    const input = buildDocumentChunkEmbeddingInput(options.documentTitle, content);
    const result = await embed({ text: input, taskType: "note" });

    if (!result.ok) {
      throw classifyEmbedFailure(result.reason);
    }
    if (result.embedding.length !== EMBEDDING_DIMENSIONS) {
      throw new ProcessingError("Invalid embedding dimensions.", "transient");
    }

    await options.writeEmbedding({
      chunkIndex,
      embedding: result.embedding,
      model: EMBEDDING_MODEL,
      dimensions: EMBEDDING_DIMENSIONS,
    });

    completed += 1;
    if (options.onChunkEmbedded) {
      await options.onChunkEmbedded(completed, total);
    }
  });
}
