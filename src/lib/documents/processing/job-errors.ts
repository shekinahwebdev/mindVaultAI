export class ProcessingError extends Error {
  readonly kind: "transient" | "permanent";

  constructor(message: string, kind: "transient" | "permanent") {
    super(message);
    this.name = "ProcessingError";
    this.kind = kind;
  }
}

export function isTransientProcessingError(error: unknown): boolean {
  if (error instanceof ProcessingError) {
    return error.kind === "transient";
  }
  const name = (error as { name?: string }).name;
  if (name === "AbortError") {
    return true;
  }
  const code = (error as { code?: string }).code;
  if (code && ["ECONNRESET", "ETIMEDOUT", "ECONNREFUSED", "57P01", "40001"].includes(code)) {
    return true;
  }
  return false;
}

export function userFacingFailureMessage(error: unknown): string {
  if (error instanceof ProcessingError && error.kind === "permanent") {
    if (error.message.includes("missing")) {
      return "The document file could not be found in storage.";
    }
    if (error.message.includes("invalid")) {
      return "This document could not be processed.";
    }
    return "This document could not be processed.";
  }
  return "Processing failed. You can retry later or contact support.";
}
