import { readAuthJson } from "@/lib/auth/client";

import { DOCUMENT_ALLOWED_MIME, DOCUMENT_MAX_SIZE_BYTES } from "./config";
import type { SerializedDocument } from "./serialize";

export type { SerializedDocument };

export type InitiateUploadPayload = {
  filename: string;
  sizeBytes: number;
  mimeType: string;
};

export type InitiateUploadResponse =
  | {
      ok: true;
      document: SerializedDocument;
      uploadUrl: string;
      uploadExpiresAt: string;
      presignedExpiresInSeconds: number;
    }
  | { ok: false; message?: string; code?: string };

export async function initiateDocumentUploadRequest(payload: InitiateUploadPayload) {
  const response = await fetch("/api/documents/upload/initiate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await readAuthJson<InitiateUploadResponse>(response);
  return { response, data };
}

export type CompleteUploadResponse =
  | { ok: true; document: SerializedDocument }
  | { ok: false; message?: string; code?: string };

export async function completeDocumentUploadRequest(documentId: string) {
  const response = await fetch("/api/documents/upload/complete", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ documentId }),
  });
  const data = await readAuthJson<CompleteUploadResponse>(response);
  return { response, data };
}

export async function retryDocumentUploadRequest(documentId: string) {
  const response = await fetch(`/api/documents/${documentId}/upload/retry`, {
    method: "POST",
  });
  const data = await readAuthJson<InitiateUploadResponse>(response);
  return { response, data };
}

export type ListDocumentsResponse =
  | { ok: true; documents: SerializedDocument[] }
  | { ok: false; message?: string };

export async function listDocumentsRequest() {
  const response = await fetch("/api/documents");
  const data = await readAuthJson<ListDocumentsResponse>(response);
  return { response, data };
}

export type DocumentDetailResponse =
  | { ok: true; document: SerializedDocument }
  | { ok: false; message?: string };

export async function getDocumentRequest(documentId: string) {
  const response = await fetch(`/api/documents/${documentId}`);
  const data = await readAuthJson<DocumentDetailResponse>(response);
  return { response, data };
}

export type DownloadDocumentResponse =
  | { ok: true; downloadUrl: string; expiresInSeconds: number }
  | { ok: false; message?: string };

export async function downloadDocumentRequest(documentId: string) {
  const response = await fetch(`/api/documents/${documentId}/download`);
  const data = await readAuthJson<DownloadDocumentResponse>(response);
  return { response, data };
}

export type DeleteDocumentResponse = { ok: true } | { ok: false; message?: string; code?: string };

export async function deleteDocumentRequest(documentId: string) {
  const response = await fetch(`/api/documents/${documentId}`, { method: "DELETE" });
  const data = await readAuthJson<DeleteDocumentResponse>(response);
  return { response, data };
}

export type UploadPdfDocumentResult =
  | { ok: true; document: SerializedDocument }
  | { ok: false; message: string };

/** Client-side PDF upload using existing initiate → S3 → complete APIs. */
export async function uploadPdfDocumentFromFile(
  file: File,
  options?: {
    onProgress?: (ratio: number) => void;
    existingDocumentId?: string;
  },
): Promise<UploadPdfDocumentResult> {
  if (file.type !== DOCUMENT_ALLOWED_MIME && !file.name.toLowerCase().endsWith(".pdf")) {
    return { ok: false, message: "Only PDF files are supported." };
  }
  if (file.size > DOCUMENT_MAX_SIZE_BYTES) {
    return { ok: false, message: "File is too large." };
  }

  let documentId = options?.existingDocumentId;
  let uploadUrl: string;

  if (options?.existingDocumentId) {
    const retry = await retryDocumentUploadRequest(options.existingDocumentId);
    if (!retry.data?.ok) {
      return { ok: false, message: retry.data?.message ?? "Could not retry upload." };
    }
    uploadUrl = retry.data.uploadUrl;
    documentId = retry.data.document.id;
  } else {
    const init = await initiateDocumentUploadRequest({
      filename: file.name,
      sizeBytes: file.size,
      mimeType: DOCUMENT_ALLOWED_MIME,
    });
    if (!init.data?.ok) {
      return { ok: false, message: init.data?.message ?? "Upload could not start." };
    }
    uploadUrl = init.data.uploadUrl;
    documentId = init.data.document.id;
  }

  try {
    await uploadFileToPresignedUrl(uploadUrl, file, options?.onProgress);
  } catch {
    return { ok: false, message: "Upload interrupted. Please try again." };
  }

  const complete = await completeDocumentUploadRequest(documentId!);
  if (!complete.data?.ok) {
    return { ok: false, message: complete.data?.message ?? "Upload verification failed." };
  }

  return { ok: true, document: complete.data.document };
}

/** PUT file bytes to S3 presigned URL with upload progress. */
export function uploadFileToPresignedUrl(
  uploadUrl: string,
  file: File,
  onProgress?: (ratio: number) => void,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl);
    xhr.setRequestHeader("Content-Type", file.type || "application/pdf");

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(event.loaded / event.total);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
        return;
      }
      reject(new Error(`Upload failed (${xhr.status})`));
    };

    xhr.onerror = () => reject(new Error("Upload failed."));
    xhr.send(file);
  });
}
