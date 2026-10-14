/**
 * Backfills OpenAI embedding columns for notes + READY PDF chunks without
 * touching Gemini vectors. Resumable via embedding_migration_checkpoints.
 *
 * Usage:
 *   npm run embeddings:migrate-openai -- --dry-run
 *   npm run embeddings:migrate-openai
 *   npm run embeddings:migrate-openai -- --once
 *   npm run embeddings:migrate-openai -- --cancel
 */
import "dotenv/config";

import { validateEmbeddingEnvironment } from "@/lib/ai/embedding-providers/config";
import {
  countOpenAIMigrationRemaining,
  runOpenAIMigrationBatch,
} from "@/lib/ai/embedding-migration/migrate-openai-batch";
import {
  readOpenAIMigrationCheckpoint,
  requestOpenAIMigrationCancel,
} from "@/lib/ai/embedding-migration/checkpoint";
import { prisma } from "@/lib/db";

const NOTE_BATCH = 20;
const CHUNK_BATCH = 15;
const MAX_BATCHES_PER_RUN = 200;

const args = new Set(process.argv.slice(2));
const isDryRun = args.has("--dry-run");
const runOnce = args.has("--once");
const cancel = args.has("--cancel");

async function main() {
  if (cancel) {
    await requestOpenAIMigrationCancel();
    console.log("OpenAI migration cancel requested (checked between batches).");
    return;
  }

  const configError = validateEmbeddingEnvironment("openai");
  if (configError && !isDryRun) {
    console.error(configError);
    process.exitCode = 1;
    return;
  }

  if (isDryRun) {
    const remaining = await countOpenAIMigrationRemaining();
    const checkpoint = await readOpenAIMigrationCheckpoint();
    console.log("[dry-run] OpenAI migration status");
    console.log(`  notes remaining: ${remaining.notes}`);
    console.log(`  chunks remaining: ${remaining.chunks}`);
    console.log(`  checkpoint notes processed: ${checkpoint.notesProcessed}`);
    console.log(`  checkpoint chunks processed: ${checkpoint.chunksProcessed}`);
    return;
  }

  let batches = 0;
  let done = false;
  while (!done && batches < MAX_BATCHES_PER_RUN) {
    const result = await runOpenAIMigrationBatch({
      noteBatchSize: NOTE_BATCH,
      chunkBatchSize: CHUNK_BATCH,
    });
    batches += 1;
    done = result.done;
    console.log(
      `[batch ${batches}] notes ok=${result.checkpoint.notesProcessed} fail=${result.checkpoint.notesFailed} | chunks ok=${result.checkpoint.chunksProcessed} fail=${result.checkpoint.chunksFailed}`,
    );
    if (result.checkpoint.cancelled) {
      console.log("Migration cancelled.");
      break;
    }
    if (runOnce) break;
  }

  const remaining = await countOpenAIMigrationRemaining();
  if (done) {
    console.log("OpenAI column backfill complete.");
  } else {
    console.log(
      `Paused with ${remaining.notes} note(s) and ${remaining.chunks} chunk(s) remaining. Re-run to continue.`,
    );
  }
}

main()
  .catch((error) => {
    console.error("OpenAI migration failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
