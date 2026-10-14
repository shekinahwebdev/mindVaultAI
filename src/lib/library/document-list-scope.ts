import { DocumentStatus } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";

/** Documents visible in vault lists (excludes expired uploads and archived). */
export const LIBRARY_DOCUMENT_STATUSES: DocumentStatus[] = [
  DocumentStatus.PENDING_UPLOAD,
  DocumentStatus.QUEUED,
  DocumentStatus.PROCESSING,
  DocumentStatus.READY,
  DocumentStatus.FAILED,
  DocumentStatus.DELETING,
];

export function activeLibraryDocumentWhere(userId: string): Prisma.DocumentWhereInput {
  return {
    userId,
    archivedAt: null,
    status: { in: LIBRARY_DOCUMENT_STATUSES },
  };
}
