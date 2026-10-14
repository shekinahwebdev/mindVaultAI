import { DocumentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

import { serializeDocument, type SerializedDocument } from "./serialize";

const LISTABLE_STATUSES: DocumentStatus[] = [
  DocumentStatus.PENDING_UPLOAD,
  DocumentStatus.QUEUED,
  DocumentStatus.PROCESSING,
  DocumentStatus.READY,
  DocumentStatus.FAILED,
  DocumentStatus.DELETING,
];

async function findJobForDocument(documentId: string, processingVersion: number) {
  return prisma.documentProcessingJob.findUnique({
    where: {
      documentId_processingVersion: {
        documentId,
        processingVersion,
      },
    },
  });
}

export async function listDocumentsForUser(userId: string): Promise<SerializedDocument[]> {
  const rows = await prisma.document.findMany({
    where: {
      userId,
      status: { in: LISTABLE_STATUSES },
    },
    orderBy: { createdAt: "desc" },
  });

  const results: SerializedDocument[] = [];
  for (const row of rows) {
    const job = await findJobForDocument(row.id, row.processingVersion);
    results.push(serializeDocument(row, job));
  }
  return results;
}

export async function getDocumentForUser(
  userId: string,
  documentId: string,
): Promise<SerializedDocument | null> {
  const row = await prisma.document.findFirst({
    where: {
      id: documentId,
      userId,
      status: { in: LISTABLE_STATUSES },
    },
  });

  if (!row) {
    return null;
  }

  const job = await findJobForDocument(row.id, row.processingVersion);
  return serializeDocument(row, job);
}

export async function createDocumentDownloadUrl(
  userId: string,
  documentId: string,
  createUrl: (storageKey: string, filename: string) => Promise<string>,
): Promise<
  | { ok: true; downloadUrl: string; expiresInSeconds: number }
  | { ok: false; status: number; message: string }
> {
  const row = await prisma.document.findFirst({
    where: {
      id: documentId,
      userId,
      status: {
        in: [
          DocumentStatus.QUEUED,
          DocumentStatus.PROCESSING,
          DocumentStatus.READY,
          DocumentStatus.FAILED,
        ],
      },
    },
  });

  if (!row) {
    return { ok: false, status: 404, message: "Document not found." };
  }

  if (!row.uploadedAt) {
    return { ok: false, status: 409, message: "Upload is not complete yet." };
  }

  const expiresInSeconds = 5 * 60;
  const downloadUrl = await createUrl(row.storageKey, row.originalFilename);

  return { ok: true, downloadUrl, expiresInSeconds };
}
