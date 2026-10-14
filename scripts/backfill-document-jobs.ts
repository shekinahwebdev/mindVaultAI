import "dotenv/config";

import { backfillMissingProcessingJobs } from "@/lib/documents/processing/job-create";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required.");
    process.exitCode = 1;
    return;
  }

  const created = await backfillMissingProcessingJobs();
  console.log(`Backfill complete. Created ${created} processing job(s).`);
}

main().catch((error) => {
  console.error("Backfill failed:", error);
  process.exitCode = 1;
});
