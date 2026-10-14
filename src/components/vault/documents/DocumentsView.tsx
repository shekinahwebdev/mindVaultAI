"use client";

import { motion } from "framer-motion";
import { Download, FileText, Loader2, Trash2, Upload } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { usePreferences } from "@/lib/settings/preferences-context";

import { ContentCard } from "@/components/mv/ContentCard";
import { EmptyState } from "@/components/mv/EmptyState";
import { PageHeader } from "@/components/mv/PageHeader";
import { PageStack } from "@/components/mv/PageStack";
import { VaultDialog } from "@/components/vault/VaultDialog";
import {
  completeDocumentUploadRequest,
  deleteDocumentRequest,
  downloadDocumentRequest,
  initiateDocumentUploadRequest,
  listDocumentsRequest,
  retryDocumentUploadRequest,
  uploadFileToPresignedUrl,
  type SerializedDocument,
} from "@/lib/documents/documents-client";
import { DOCUMENT_ALLOWED_MIME, DOCUMENT_MAX_SIZE_BYTES } from "@/lib/documents/config";
import { toastError, toastSuccess } from "@/lib/vault-toast";
import { cn } from "@/lib/utils";

import {
  vaultDestructiveButton,
  vaultPrimaryButton,
  vaultSecondaryButton,
} from "../vault-controls";
import { vaultEase } from "../vault-motion";

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const ACTIVE_POLL_STATUSES = new Set([
  "queued",
  "processing",
  "retrying",
  "upload_pending",
  "deleting",
]);

export function DocumentsView() {
  const searchParams = useSearchParams();
  const focusDocumentId = searchParams.get("doc");
  const focusPage = searchParams.get("page");
  const { preferences } = usePreferences();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [documents, setDocuments] = useState<SerializedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [pendingDocumentId, setPendingDocumentId] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SerializedDocument | null>(null);
  const [deleting, setDeleting] = useState(false);

  async function refresh() {
    setLoading(true);
    const { data } = await listDocumentsRequest();
    if (data?.ok) {
      setDocuments(data.documents);
    } else {
      toastError(data?.message ?? "Could not load documents.");
    }
    setLoading(false);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      const { data } = await listDocumentsRequest();
      if (cancelled) return;
      if (data?.ok) {
        setDocuments(data.documents);
      } else {
        toastError(data?.message ?? "Could not load documents.");
      }
      setLoading(false);
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, []);

  const shouldPoll = useMemo(
    () => documents.some((doc) => ACTIVE_POLL_STATUSES.has(doc.processingDisplayStatus)),
    [documents],
  );

  useEffect(() => {
    if (!shouldPoll || uploading) {
      return;
    }

    const intervalMs = preferences.reducedMotion ? 12_000 : 5_000;
    const id = window.setInterval(() => {
      void listDocumentsRequest().then(({ data }) => {
        if (data?.ok) {
          setDocuments(data.documents);
        }
      });
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [shouldPoll, uploading, preferences.reducedMotion]);

  async function runUpload(file: File, existingDocumentId?: string) {
    if (file.type !== DOCUMENT_ALLOWED_MIME && !file.name.toLowerCase().endsWith(".pdf")) {
      toastError("Only PDF files are supported.");
      return;
    }
    if (file.size > DOCUMENT_MAX_SIZE_BYTES) {
      toastError("File is too large.");
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      let documentId = existingDocumentId;
      let uploadUrl: string;

      if (existingDocumentId) {
        const retry = await retryDocumentUploadRequest(existingDocumentId);
        if (!retry.data?.ok) {
          toastError(retry.data?.message ?? "Could not retry upload.");
          return;
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
          toastError(init.data?.message ?? "Upload could not start.");
          return;
        }
        uploadUrl = init.data.uploadUrl;
        documentId = init.data.document.id;
        setPendingDocumentId(documentId);
      }

      await uploadFileToPresignedUrl(uploadUrl, file, setUploadProgress);

      const complete = await completeDocumentUploadRequest(documentId!);
      if (!complete.data?.ok) {
        toastError(complete.data?.message ?? "Upload verification failed. You can retry.");
        await refresh();
        return;
      }

      toastSuccess("PDF uploaded. Processing will begin in a future update.");
      setPendingDocumentId(null);
      await refresh();
    } catch {
      toastError("Upload interrupted. Retry when your connection is stable.");
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  }

  function onFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    const retryId = pendingDocumentId ?? undefined;
    event.target.value = "";
    if (file) {
      void runUpload(file, retryId);
    }
  }

  async function onDownload(document: SerializedDocument) {
    const { data } = await downloadDocumentRequest(document.id);
    if (!data?.ok) {
      toastError(data?.message ?? "Download unavailable.");
      return;
    }
    window.open(data.downloadUrl, "_blank", "noopener,noreferrer");
  }

  async function confirmDelete() {
    if (!deleteTarget) return;
    setDeleting(true);
    const { data } = await deleteDocumentRequest(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (!data?.ok) {
      toastError(data?.message ?? "Delete failed.");
      return;
    }
    toastSuccess("Document deleted.");
    await refresh();
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: vaultEase }}
    >
      <PageStack>
        <PageHeader
          title="Documents"
          lead="Upload PDFs to your private vault storage. Text extraction and search come in a later phase."
        />

        <ContentCard>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-[0.875rem] text-muted-foreground">
                PDF only · max {Math.floor(DOCUMENT_MAX_SIZE_BYTES / (1024 * 1024))} MB per file
              </p>
              {uploading ? (
                <div className="mt-2">
                  <div className="h-1.5 w-full max-w-xs overflow-hidden rounded-full bg-mv-panel">
                    <div
                      className="h-full bg-foreground transition-[width]"
                      style={{ width: `${Math.round(uploadProgress * 100)}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[0.8125rem] text-muted-foreground">
                    Uploading… {Math.round(uploadProgress * 100)}%
                  </p>
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap gap-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="application/pdf,.pdf"
                className="sr-only"
                onChange={onFileChange}
              />
              <button
                type="button"
                className={cn(vaultPrimaryButton, "inline-flex items-center gap-2")}
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden />
                ) : (
                  <Upload className="size-4" aria-hidden />
                )}
                Upload PDF
              </button>
              {pendingDocumentId ? (
                <button
                  type="button"
                  className={vaultSecondaryButton}
                  disabled={uploading}
                  onClick={() => fileInputRef.current?.click()}
                >
                  Retry upload
                </button>
              ) : null}
            </div>
          </div>
        </ContentCard>

        {loading ? (
          <ContentCard>
            <div className="flex items-center gap-2 text-[0.875rem] text-muted-foreground">
              <Loader2 className="size-4 animate-spin" aria-hidden />
              Loading documents…
            </div>
          </ContentCard>
        ) : documents.length === 0 ? (
          <EmptyState
            visual={<FileText className="size-10 text-muted-foreground" aria-hidden />}
            title="No documents yet"
            description="Upload a PDF to store it securely. Processing and AI search are not enabled in this phase."
          />
        ) : (
          <ContentCard padding="none" className="overflow-hidden">
            <ul className="divide-y divide-border">
              {documents.map((document) => (
                <li
                  key={document.id}
                  className={cn(
                    "flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
                    focusDocumentId === document.id &&
                      "bg-mv-panel/50 ring-1 ring-inset ring-foreground/10",
                  )}
                >
                  <div className="min-w-0">
                    <p className="truncate text-[0.9375rem] font-medium text-foreground">
                      {document.title}
                      {focusDocumentId === document.id && focusPage ? (
                        <span className="text-muted-foreground">{` · cited page ${focusPage}`}</span>
                      ) : null}
                    </p>
                    <p className="text-[0.8125rem] text-muted-foreground">
                      {formatBytes(document.sizeBytes)} · {document.processingLabel}
                      {document.processingJob &&
                      document.processingDisplayStatus === "retrying" ? (
                        <span>{` · attempt ${document.processingJob.attemptCount}/${document.processingJob.maxAttempts}`}</span>
                      ) : null}
                    </p>
                    {document.status === "PENDING_UPLOAD" ? (
                      <button
                        type="button"
                        className="mt-1 text-[0.8125rem] font-medium text-foreground underline-offset-2 hover:underline"
                        onClick={() => {
                          setPendingDocumentId(document.id);
                          fileInputRef.current?.click();
                        }}
                      >
                        Resume upload
                      </button>
                    ) : null}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {document.uploadedAt ? (
                      <button
                        type="button"
                        className={cn(vaultSecondaryButton, "inline-flex items-center gap-1.5")}
                        onClick={() => void onDownload(document)}
                      >
                        <Download className="size-3.5" aria-hidden />
                        Download
                      </button>
                    ) : null}
                    <button
                      type="button"
                      className={cn(vaultDestructiveButton, "inline-flex items-center gap-1.5")}
                      onClick={() => setDeleteTarget(document)}
                    >
                      <Trash2 className="size-3.5" aria-hidden />
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </ContentCard>
        )}
      </PageStack>

      <VaultDialog
        open={deleteTarget !== null}
        title="Delete document?"
        description={
          deleteTarget
            ? `“${deleteTarget.title}” will be removed from storage. This cannot be undone.`
            : ""
        }
        onClose={() => setDeleteTarget(null)}
      >
        <div className="flex justify-end gap-2.5">
          <button
            type="button"
            className={vaultSecondaryButton}
            disabled={deleting}
            onClick={() => setDeleteTarget(null)}
          >
            Cancel
          </button>
          <button
            type="button"
            className={vaultDestructiveButton}
            disabled={deleting}
            onClick={() => void confirmDelete()}
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </VaultDialog>
    </motion.div>
  );
}
