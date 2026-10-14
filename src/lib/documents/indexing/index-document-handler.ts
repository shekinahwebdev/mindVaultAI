import { DocumentStatus } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";
import { ProcessingError } from "@/lib/documents/processing/job-errors";
import type { ProcessingHandler } from "@/lib/documents/processing/processing-handler";

import { chunkNormalizedPages } from "./chunk-text";
import {
  countEmbeddedChunksForVersion,
  getChunkContentByIndex,
  listChunkIndexesMissingEmbedding,
  upsertChunkContents,
  upsertChunkEmbedding,
} from "./chunk-repository";
import { updateDocumentProcessingProgress } from "./document-progress";
import { embedDocumentChunks, type EmbedFn } from "./embed-chunks";
import { finalizeDocumentIndexing } from "./finalize-indexing";
import { verifyJobOwnership } from "./job-ownership";
import { normalizeExtractedPages } from "./normalize-text";
import { extractPdfText } from "./pdf-extraction";
import { getPipelineSpec } from "./processing-version";
import { PROCESSING_STAGES } from "./processing-stages";

export type IndexDocumentHandlerDeps = {
  embed?: EmbedFn;
  embedConcurrency?: number;
};

async function loadDocumentForJob(documentId: string) {
  return prisma.document.findUnique({
    where: { id: documentId },
    select: { title: true, status: true, processingVersion: true, sizeBytes: true },
  });
}

function assertDocumentProcessable(
  doc: { title: string; status: DocumentStatus; processingVersion: number } | null,
  processingVersion: number,
): string {
  if (!doc) {
    throw new ProcessingError("Document no longer exists.", "permanent");
  }
  if (doc.status === DocumentStatus.DELETING) {
    throw new ProcessingError("Document is being deleted.", "permanent");
  }
  if (doc.processingVersion !== processingVersion) {
    throw new ProcessingError("Processing version mismatch.", "permanent");
  }
  return doc.title;
}

export function createDocumentIndexingHandler(
  deps: IndexDocumentHandlerDeps = {},
): ProcessingHandler {
  return async (context) => {
    const { job, s3, signal, workerId } = context;
    const { claimGeneration } = job;

    const owns = await verifyJobOwnership({
      jobId: job.jobId,
      workerId,
      claimGeneration,
    });
    if (!owns) {
      throw new ProcessingError("Lost job lease.", "transient");
    }

    let doc = await loadDocumentForJob(job.documentId);
    const title = assertDocumentProcessable(doc, job.processingVersion);
    const spec = getPipelineSpec(job.processingVersion);

    const head = await s3.headObject(job.storageKey);
    if (!head) {
      throw new ProcessingError("Source file missing in storage.", "permanent");
    }
    if (head.sizeBytes <= 0) {
      throw new ProcessingError("Invalid stored document size.", "permanent");
    }
    if (doc && head.sizeBytes !== doc.sizeBytes) {
      throw new ProcessingError("Stored file size does not match metadata.", "permanent");
    }

    await updateDocumentProcessingProgress({
      documentId: job.documentId,
      jobId: job.jobId,
      workerId,
      claimGeneration,
      stage: PROCESSING_STAGES.EXTRACTING,
      totalChunks: null,
      completedChunks: null,
    });

    const bytes = await s3.readObjectBytes(job.storageKey, spec.extraction.maxBytes);
    if (signal.aborted) {
      throw new ProcessingError("Processing aborted.", "transient");
    }

    const extracted = await extractPdfText(bytes, spec.extraction);
    const normalized = normalizeExtractedPages(extracted.pages);

    await updateDocumentProcessingProgress({
      documentId: job.documentId,
      jobId: job.jobId,
      workerId,
      claimGeneration,
      stage: PROCESSING_STAGES.CHUNKING,
    });

    const drafts = chunkNormalizedPages(normalized, spec.chunking);
    if (drafts.length === 0) {
      throw new ProcessingError("PDF contains no extractable text.", "permanent");
    }

    await upsertChunkContents(job.documentId, job.processingVersion, drafts);

    const reportEmbeddingProgress = async () => {
      const embedded = await countEmbeddedChunksForVersion(job.documentId, job.processingVersion);
      await updateDocumentProcessingProgress({
        documentId: job.documentId,
        jobId: job.jobId,
        workerId,
        claimGeneration,
        stage: PROCESSING_STAGES.EMBEDDING,
        totalChunks: drafts.length,
        completedChunks: embedded,
      });
    };

    await reportEmbeddingProgress();

    let missing = await listChunkIndexesMissingEmbedding(job.documentId, job.processingVersion);
    if (missing.length > 0) {
      await embedDocumentChunks({
        documentTitle: title,
        chunkIndexes: missing,
        readChunkContent: (chunkIndex) =>
          getChunkContentByIndex(job.documentId, job.processingVersion, chunkIndex),
        writeEmbedding: (params) =>
          upsertChunkEmbedding({
            documentId: job.documentId,
            processingVersion: job.processingVersion,
            ...params,
          }),
        concurrency: deps.embedConcurrency ?? 3,
        embed: deps.embed,
        signal,
        onChunkEmbedded: async () => {
          await reportEmbeddingProgress();
        },
      });
    }

    missing = await listChunkIndexesMissingEmbedding(job.documentId, job.processingVersion);
    if (missing.length > 0) {
      throw new ProcessingError("Embeddings incomplete after processing.", "transient");
    }

    await updateDocumentProcessingProgress({
      documentId: job.documentId,
      jobId: job.jobId,
      workerId,
      claimGeneration,
      stage: PROCESSING_STAGES.FINALIZING,
      totalChunks: drafts.length,
      completedChunks: drafts.length,
    });

    doc = await loadDocumentForJob(job.documentId);
    assertDocumentProcessable(doc, job.processingVersion);

    const finalized = await finalizeDocumentIndexing({
      jobId: job.jobId,
      documentId: job.documentId,
      processingVersion: job.processingVersion,
      workerId,
      claimGeneration,
      expectedChunkCount: drafts.length,
    });

    if (!finalized) {
      throw new ProcessingError(
        "Could not finalize indexing (ownership or validation).",
        "transient",
      );
    }
  };
}

export const runDocumentIndexingHandler = createDocumentIndexingHandler();
