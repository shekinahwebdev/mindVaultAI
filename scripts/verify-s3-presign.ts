import "dotenv/config";

import { createDocumentS3Adapter } from "@/lib/storage/s3/client";

async function main() {
  const s3 = createDocumentS3Adapter();
  const url = await s3.createPresignedUploadUrl({
    storageKey: "users/local-dev-check/dry-run/presign-test.pdf",
    contentType: "application/pdf",
    sizeBytes: 1024,
    expiresInSeconds: 60,
  });
  if (!url.startsWith("https://")) {
    console.error("Unexpected presigned URL shape.");
    process.exitCode = 1;
    return;
  }
  console.log("presign_ok");
}

main().catch((error) => {
  console.error("presign_failed", (error as { name?: string }).name ?? "Error");
  process.exitCode = 1;
});
