/**
 * Generates embeddings for notes that don't have a current one yet —
 * notes created before embeddings existed, or ones whose embedding was
 * made by a since-changed model/dimension configuration.
 *
 * Idempotent: re-running only touches notes that still need work, so it's
 * safe to run repeatedly (e.g. after adding a batch of notes some other
 * way, or after a real provider outage left some notes unembedded).
 *
 * Usage:
 *   npm run embeddings:backfill           # generate + store
 *   npm run embeddings:backfill -- --dry-run   # report counts only, no API calls
 */
import "dotenv/config";

import { prisma } from "@/lib/db";
import { backfillEmbeddingsForUser } from "@/lib/notes/embedding-service";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "@/lib/ai/embed-text";
import { findNoteIdsNeedingEmbedding } from "@/lib/notes/embedding-repository";

const isDryRun = process.argv.includes("--dry-run");

async function main() {
  if (!process.env.GEMINI_API_KEY && !isDryRun) {
    console.error(
      "GEMINI_API_KEY is not set. Set it in .env, or run with --dry-run to only report counts.",
    );
    process.exitCode = 1;
    return;
  }

  const users = await prisma.user.findMany({ select: { id: true, email: true } });

  let totalMissing = 0;
  let totalSucceeded = 0;
  let totalFailed = 0;

  for (const user of users) {
    if (isDryRun) {
      const ids = await findNoteIdsNeedingEmbedding(user.id, EMBEDDING_MODEL, EMBEDDING_DIMENSIONS);
      if (ids.length > 0) {
        // Note ids only — never note titles/content, which are private.
        console.log(`[dry-run] user ${user.id}: ${ids.length} note(s) need embedding`);
      }
      totalMissing += ids.length;
      continue;
    }

    const result = await backfillEmbeddingsForUser(user.id);
    if (result.total > 0) {
      console.log(
        `user ${user.id}: ${result.succeeded}/${result.total} embedded, ${result.failed} failed`,
      );
    }
    totalMissing += result.total;
    totalSucceeded += result.succeeded;
    totalFailed += result.failed;
  }

  console.log("---");
  if (isDryRun) {
    console.log(`Dry run complete. ${totalMissing} note(s) would be embedded.`);
  } else {
    console.log(
      `Backfill complete. ${totalSucceeded}/${totalMissing} embedded, ${totalFailed} failed.`,
    );
    if (totalFailed > 0) {
      console.log("Failed notes can be retried by running this script again.");
    }
  }
}

main()
  .catch((error) => {
    console.error("Backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
