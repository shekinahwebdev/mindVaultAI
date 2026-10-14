import { DocumentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { getOrCreateUserSubscription } from "@/lib/billing/subscription-repository";
import { isS3Configured } from "@/lib/storage/s3/config";
import { createDocumentS3Adapter } from "@/lib/storage/s3/client";
import {
  classifyS3ClientError,
  logS3ClientError,
  userMessageForS3ClientError,
} from "@/lib/storage/s3/s3-errors";
import type { DocumentS3Adapter } from "@/lib/storage/s3/types";

import {
  DOCUMENT_ALLOWED_MIME,
  DOCUMENT_MAX_INITIATES_PER_HOUR,
  DOCUMENT_PENDING_UPLOAD_TTL_MINUTES,
  DOCUMENT_PRESIGNED_UPLOAD_TTL_SECONDS,
  DOCUMENT_SERVER_ERROR,
} from "./config";
import { assertDocumentUploadAllowed } from "./entitlement";
import { buildDocumentStorageKey } from "./storage-key";
import { assertStorageAllowanceTx } from "./storage-quota";
import { serializeDocument } from "./serialize";
import { ensureProcessingJobForDocumentTx } from "./processing/job-create";
import { cancelProcessingJobsForDocumentTx } from "./processing/job-repository";
import { validatePdfHeaderForUpload } from "./pdf-validation";
export type InitiateUploadInput = {
  filename: string;
  title: string;
  sizeBytes: number;
  mimeType: string;
};

export type InitiateUploadResult =
  | {
      ok: true;
      document: ReturnType<typeof serializeDocument>;
      uploadUrl: string;
      uploadExpiresAt: string;
      presignedExpiresInSeconds: number;
    }
  | {
      ok: false;
      status: number;
      code?: string;
      message: string;
    };

export type CompleteUploadResult =
  | { ok: true; document: ReturnType<typeof serializeDocument> }
  | { ok: false; status: number; code?: string; message: string };

export type RetryUploadResult = InitiateUploadResult;

function pendingUploadExpiresAt(from: Date): Date {
  return new Date(from.getTime() + DOCUMENT_PENDING_UPLOAD_TTL_MINUTES * 60 * 1000);
}

async function countRecentInitiates(userId: string, since: Date): Promise<number> {
  return prisma.document.count({
    where: {
      userId,
      createdAt: { gte: since },
    },
  });
}

export async function initiateDocumentUpload(
  userId: string,
  input: InitiateUploadInput,
  s3: DocumentS3Adapter = createDocumentS3Adapter(),
): Promise<InitiateUploadResult> {
  if (!isS3Configured()) {
    return {
      ok: false,
      status: 503,
      code: "storage_unavailable",
      message: "Document storage is not configured.",
    };
  }

  const allowed = await assertDocumentUploadAllowed(userId);
  if (!allowed.ok) {
    return { ok: false, status: 403, code: allowed.code, message: allowed.message };
  }

  const hourAgo = new Date(Date.now() - 60 * 60 * 1000);
  const recent = await countRecentInitiates(userId, hourAgo);
  if (recent >= DOCUMENT_MAX_INITIATES_PER_HOUR) {
    return {
      ok: false,
      status: 429,
      code: "rate_limited",
      message: "Too many upload attempts. Try again later.",
    };
  }

  const now = new Date();
  const uploadExpiresAt = pendingUploadExpiresAt(now);
  const documentId = crypto.randomUUID();
  const storageKey = buildDocumentStorageKey(userId, documentId, input.filename);

  try {
    await getOrCreateUserSubscription(userId);

    const document = await prisma.$transaction(async (tx) => {
      const quota = await assertStorageAllowanceTx(tx, userId, input.sizeBytes, now);
      if (!quota.ok) {
        throw new QuotaError(quota.message);
      }

      const created = await tx.document.create({
        data: {
          id: documentId,
          userId,
          title: input.title,
          originalFilename: input.filename,
          mimeType: input.mimeType,
          sizeBytes: input.sizeBytes,
          storageKey,
          status: DocumentStatus.PENDING_UPLOAD,
          uploadExpiresAt,
        },
      });

      await tx.storageReservation.create({
        data: {
          userId,
          documentId: created.id,
          reservedBytes: input.sizeBytes,
          expiresAt: uploadExpiresAt,
        },
      });

      return created;
    });

    const uploadUrl = await s3.createPresignedUploadUrl({
      storageKey,
      contentType: DOCUMENT_ALLOWED_MIME,
      sizeBytes: input.sizeBytes,
      expiresInSeconds: DOCUMENT_PRESIGNED_UPLOAD_TTL_SECONDS,
    });

    return {
      ok: true,
      document: serializeDocument(document),
      uploadUrl,
      uploadExpiresAt: uploadExpiresAt.toISOString(),
      presignedExpiresInSeconds: DOCUMENT_PRESIGNED_UPLOAD_TTL_SECONDS,
    };
  } catch (error) {
    if (error instanceof QuotaError) {
      return { ok: false, status: 413, code: "storage_limit", message: error.message };
    }
    logS3ClientError("initiate", error);
    const kind = classifyS3ClientError(error);
    if (kind !== "unknown") {
      const status =
        kind === "credentials_missing" || kind === "config_missing" ? 503 : 500;
      return {
        ok: false,
        status,
        code: `storage_${kind}`,
        message: userMessageForS3ClientError(kind),
      };
    }
    console.error("[documents:initiate]", error);
    return { ok: false, status: 500, message: DOCUMENT_SERVER_ERROR };
  }
}

class QuotaError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "QuotaError";
  }
}

export async function completeDocumentUpload(
  userId: string,
  documentId: string,
  s3: DocumentS3Adapter = createDocumentS3Adapter(),
): Promise<CompleteUploadResult> {
  const document = await prisma.document.findFirst({
    where: { id: documentId, userId },
  });

  if (!document) {
    return { ok: false, status: 404, message: "Document not found." };
  }

  if (
    document.status === DocumentStatus.QUEUED ||
    document.status === DocumentStatus.PROCESSING ||
    document.status === DocumentStatus.READY
  ) {
    await prisma.$transaction(async (tx) => {
      await ensureProcessingJobForDocumentTx(tx, {
        documentId: document.id,
        processingVersion: document.processingVersion,
      });
    });
    const withProcessing = await loadDocumentForResponse(documentId, userId);
    return { ok: true, document: withProcessing ?? serializeDocument(document) };
  }

  if (document.status === DocumentStatus.EXPIRED) {
    return { ok: false, status: 410, code: "upload_expired", message: "Upload window expired." };
  }

  if (document.status === DocumentStatus.DELETING) {
    return { ok: false, status: 409, message: "Document is being deleted." };
  }

  if (document.status !== DocumentStatus.PENDING_UPLOAD) {
    return { ok: false, status: 409, message: "Upload cannot be completed for this document." };
  }

  const now = new Date();
  if (document.uploadExpiresAt <= now) {
    await markDocumentExpired(document.id);
    return { ok: false, status: 410, code: "upload_expired", message: "Upload window expired." };
  }

  const head = await s3.headObject(document.storageKey);
  if (!head) {
    return {
      ok: false,
      status: 400,
      code: "upload_missing",
      message: "No file found in storage. Finish uploading to S3 first.",
    };
  }

  if (head.sizeBytes !== document.sizeBytes) {
    return {
      ok: false,
      status: 400,
      code: "size_mismatch",
      message: "Uploaded file size does not match the declared size.",
    };
  }

  const headerBytes = await s3.readObjectBytes(document.storageKey, 8);
  if (!validatePdfHeaderForUpload(headerBytes)) {
    await s3.deleteObject(document.storageKey).catch((error) => {
      console.error("[documents:complete] cleanup invalid pdf failed:", error);
    });
    await prisma.$transaction([
      prisma.storageReservation.deleteMany({ where: { documentId: document.id } }),
      prisma.document.update({
        where: { id: document.id },
        data: {
          status: DocumentStatus.FAILED,
          failureReason: "File is not a valid PDF.",
        },
      }),
    ]);
    return {
      ok: false,
      status: 400,
      code: "invalid_pdf",
      message: "File is not a valid PDF.",
    };
  }

  try {
    const updated = await prisma.$transaction(async (tx) => {
      const current = await tx.document.findFirst({
        where: { id: documentId, userId, status: DocumentStatus.PENDING_UPLOAD },
      });
      if (!current) {
        return null;
      }

      await tx.storageReservation.deleteMany({ where: { documentId: current.id } });

      const doc = await tx.document.update({
        where: { id: current.id },
        data: {
          status: DocumentStatus.QUEUED,
          uploadedAt: now,
          failureReason: null,
        },
      });

      await ensureProcessingJobForDocumentTx(tx, {
        documentId: doc.id,
        processingVersion: doc.processingVersion,
      });

      console.log("[documents:job]", {
        event: "job_created",
        documentId: doc.id,
        processingVersion: doc.processingVersion,
      });

      return doc;
    });

    if (!updated) {
      const again = await prisma.document.findFirst({ where: { id: documentId, userId } });
      if (again && again.status === DocumentStatus.QUEUED) {
        const withProcessing = await loadDocumentForResponse(documentId, userId);
        return { ok: true, document: withProcessing ?? serializeDocument(again) };
      }
      return { ok: false, status: 409, message: "Upload could not be completed." };
    }

    const withProcessing = await loadDocumentForResponse(documentId, userId);
    return { ok: true, document: withProcessing ?? serializeDocument(updated) };
  } catch (error) {
    console.error("[documents:complete] db failed after s3 upload", {
      documentId,
      error,
    });
    return {
      ok: false,
      status: 503,
      code: "completion_pending",
      message:
        "Upload received but confirmation failed. Retry complete — your file remains in storage.",
    };
  }
}

export async function retryDocumentUpload(
  userId: string,
  documentId: string,
  s3: DocumentS3Adapter = createDocumentS3Adapter(),
): Promise<RetryUploadResult> {
  const document = await prisma.document.findFirst({
    where: { id: documentId, userId },
  });

  if (!document) {
    return { ok: false, status: 404, message: "Document not found." };
  }

  if (document.status !== DocumentStatus.PENDING_UPLOAD) {
    return {
      ok: false,
      status: 409,
      message: "Only pending uploads can be retried.",
    };
  }

  const now = new Date();
  if (document.uploadExpiresAt <= now) {
    await markDocumentExpired(document.id);
    return { ok: false, status: 410, code: "upload_expired", message: "Upload window expired." };
  }

  const refreshedExpiresAt = pendingUploadExpiresAt(now);
  await prisma.$transaction([
    prisma.document.update({
      where: { id: document.id },
      data: { uploadExpiresAt: refreshedExpiresAt },
    }),
    prisma.storageReservation.updateMany({
      where: { documentId: document.id },
      data: { expiresAt: refreshedExpiresAt },
    }),
  ]);

  const uploadUrl = await s3.createPresignedUploadUrl({
    storageKey: document.storageKey,
    contentType: DOCUMENT_ALLOWED_MIME,
    sizeBytes: document.sizeBytes,
    expiresInSeconds: DOCUMENT_PRESIGNED_UPLOAD_TTL_SECONDS,
  });

  return {
    ok: true,
    document: serializeDocument(document),
    uploadUrl,
    uploadExpiresAt: refreshedExpiresAt.toISOString(),
    presignedExpiresInSeconds: DOCUMENT_PRESIGNED_UPLOAD_TTL_SECONDS,
  };
}

async function markDocumentExpired(documentId: string): Promise<void> {
  await prisma.$transaction([
    prisma.storageReservation.deleteMany({ where: { documentId } }),
    prisma.document.updateMany({
      where: { id: documentId, status: DocumentStatus.PENDING_UPLOAD },
      data: { status: DocumentStatus.EXPIRED },
    }),
  ]);
}

export async function deleteDocumentForUser(
  userId: string,
  documentId: string,
  s3: DocumentS3Adapter = createDocumentS3Adapter(),
): Promise<
  | { ok: true }
  | { ok: false; status: number; code?: string; message: string; retryable?: boolean }
> {
  const document = await prisma.document.findFirst({
    where: { id: documentId, userId },
  });

  if (!document) {
    return { ok: false, status: 404, message: "Document not found." };
  }

  if (document.status === DocumentStatus.DELETING) {
    return tryFinishDeleting(document.id, document.storageKey, s3, userId);
  }

  await prisma.$transaction(async (tx) => {
    await tx.document.update({
      where: { id: document.id },
      data: { status: DocumentStatus.DELETING, failureReason: null },
    });
    await cancelProcessingJobsForDocumentTx(tx, document.id);
  });

  return tryFinishDeleting(document.id, document.storageKey, s3, userId);
}

async function tryFinishDeleting(
  documentId: string,
  storageKey: string,
  s3: DocumentS3Adapter,
  userId: string,
): Promise<
  | { ok: true }
  | { ok: false; status: number; code?: string; message: string; retryable?: boolean }
> {
  try {
    await s3.deleteObject(storageKey);
  } catch (error) {
    console.error("[documents:delete] s3 failed", { documentId, error });
    await prisma.document.update({
      where: { id: documentId },
      data: {
        status: DocumentStatus.DELETING,
        failureReason: "Storage deletion failed. Retry delete.",
      },
    });
    return {
      ok: false,
      status: 502,
      code: "storage_delete_failed",
      message: "Could not delete file from storage. Try again.",
      retryable: true,
    };
  }

  await prisma.$transaction(async (tx) => {
    await cancelProcessingJobsForDocumentTx(tx, documentId);
    await tx.storageReservation.deleteMany({ where: { documentId } });
    await tx.document.deleteMany({ where: { id: documentId, userId } });
  });

  return { ok: true };
}

async function loadDocumentForResponse(documentId: string, userId: string) {
  const { getDocumentForUser } = await import("./document-repository");
  return getDocumentForUser(userId, documentId);
}
