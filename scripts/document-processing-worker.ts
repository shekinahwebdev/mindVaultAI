import "dotenv/config";

import {
  createWorkerId,
  runDocumentWorkerLoop,
} from "@/lib/documents/processing/worker-run";

const workerId = createWorkerId();

let shuttingDown = false;

function shutdown(signal: string) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  console.log("[documents:worker]", { event: "shutdown", signal, workerId });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

async function main() {
  if (!process.env.DATABASE_URL) {
    console.error("DATABASE_URL is required.");
    process.exitCode = 1;
    return;
  }

  console.log("[documents:worker]", { event: "started", workerId });

  await runDocumentWorkerLoop({
    workerId,
    shouldContinue: () => !shuttingDown,
  });

  console.log("[documents:worker]", { event: "stopped", workerId });
}

main().catch((error) => {
  console.error("[documents:worker]", { event: "fatal", error });
  process.exitCode = 1;
});
