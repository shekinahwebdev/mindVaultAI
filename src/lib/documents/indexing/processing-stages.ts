export const PROCESSING_STAGES = {
  EXTRACTING: "extracting",
  CHUNKING: "chunking",
  EMBEDDING: "embedding",
  FINALIZING: "finalizing",
} as const;

export type ProcessingStage = (typeof PROCESSING_STAGES)[keyof typeof PROCESSING_STAGES];

export function processingStageLabel(stage: ProcessingStage | null | undefined): string {
  switch (stage) {
    case PROCESSING_STAGES.EXTRACTING:
      return "Extracting text";
    case PROCESSING_STAGES.CHUNKING:
      return "Preparing chunks";
    case PROCESSING_STAGES.EMBEDDING:
      return "Generating embeddings";
    case PROCESSING_STAGES.FINALIZING:
      return "Finalizing document";
    default:
      return "Processing";
  }
}
