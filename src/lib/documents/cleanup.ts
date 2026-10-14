import { DocumentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { createDocumentS3Adapter } from "@/lib/storage/s3/client";
import type { DocumentS3Adapter } from "@/lib/storage/s3/types";

/**
 * Expire stale PENDING_UPLOAD rows and remove orphaned S3 objects.
 * Invoke from an external scheduler (cron, worker) — not from a Next.js timer.
 *
 * Deployment: run on a schedule, e.g. hourly:
 *   curl -X POST -H "Authorization: Bearer $MINDVAULT_CLEANUP_SECRET" ...
 */
export type DocumentCleanupResult = {
  expiredDocuments: number;
  orphanedObjectsDeleted: number;
  errors: number;
};

export async function runDocumentUploadCleanup(
  now: Date = new Date(),
  s3: DocumentS3Adapter = createDocumentS3Adapter(),
): Promise<DocumentCleanupResult> {
  let expiredDocuments = 0;
  let orphanedObjectsDeleted = 0;
  let errors = 0;

  const stale = await prisma.document.findMany({
    where: {
      status: DocumentStatus.PENDING_UPLOAD,
      uploadExpiresAt: { lte: now },
    },
    select: { id: true, storageKey: true },
    take: 100,
  });

  for (const doc of stale) {
    try {
      await s3.deleteObject(doc.storageKey).catch(() => {});
      await prisma.$transaction([
        prisma.storageReservation.deleteMany({ where: { documentId: doc.id } }),
        prisma.document.update({
          where: { id: doc.id },
          data: { status: DocumentStatus.EXPIRED },
        }),
      ]);
      expiredDocuments += 1;
    } catch (error) {
      errors += 1;
      console.error("[documents:cleanup] expire failed", { id: doc.id, error });
    }
  }

  const expiredWithKeys = await prisma.document.findMany({
    where: { status: DocumentStatus.EXPIRED },
    select: { id: true, storageKey: true },
    take: 100,
  });

  for (const doc of expiredWithKeys) {
    try {
      await s3.deleteObject(doc.storageKey);
      orphanedObjectsDeleted += 1;
      await prisma.document.delete({ where: { id: doc.id } });
    } catch (error) {
      errors += 1;
      console.error("[documents:cleanup] orphan delete failed", { id: doc.id, error });
    }
  }

  return { expiredDocuments, orphanedObjectsDeleted, errors };
}
