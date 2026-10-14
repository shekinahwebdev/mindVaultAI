import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "@/lib/ai/embed-text";

import type { ChunkingConfig } from "./chunk-config";
import { DEFAULT_CHUNKING_CONFIG } from "./chunk-config";
import type { PdfExtractionLimits } from "./pdf-extraction";
import { DEFAULT_PDF_EXTRACTION_LIMITS } from "./pdf-extraction";

export type PipelineSpec = {
  extraction: PdfExtractionLimits;
  chunking: ChunkingConfig;
  embeddingModel: string;
  embeddingDimensions: number;
};

/**
 * Maps `Document.processingVersion` to the indexing pipeline configuration.
 * Bump `processingVersion` on a document (and create a new job) when any of
 * these settings change — never mix chunks from different specs under one version.
 */
export const PIPELINE_SPECS: Record<number, PipelineSpec> = {
  1: {
    extraction: DEFAULT_PDF_EXTRACTION_LIMITS,
    chunking: DEFAULT_CHUNKING_CONFIG,
    embeddingModel: EMBEDDING_MODEL,
    embeddingDimensions: EMBEDDING_DIMENSIONS,
  },
};

export function getPipelineSpec(processingVersion: number): PipelineSpec {
  const spec = PIPELINE_SPECS[processingVersion];
  if (!spec) {
    throw new Error(`Unsupported document processing version: ${processingVersion}`);
  }
  return spec;
}
