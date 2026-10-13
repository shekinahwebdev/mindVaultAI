import "dotenv/config";

import { reconcilePlaceholderSucceededJobs } from "@/lib/documents/indexing/reconcile-placeholder-jobs";

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required.");
    process.exitCode = 1;
    return;
  }

  const result = await reconcilePlaceholderSucceededJobs();
  console.log("[documents:reconcile]", { event: "completed", ...result });
}

main().catch((error) => {
  console.error("[documents:reconcile]", { event: "fatal", error });
  process.exitCode = 1;
});
