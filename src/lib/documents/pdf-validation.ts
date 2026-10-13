/** PDF files begin with "%PDF-" (bytes 25 50 44 46 2D). */
export const PDF_MAGIC = Buffer.from("%PDF-", "ascii");

export function isPdfMagicBytes(header: Uint8Array | Buffer): boolean {
  if (header.length < PDF_MAGIC.length) {
    return false;
  }
  for (let i = 0; i < PDF_MAGIC.length; i += 1) {
    if (header[i] !== PDF_MAGIC[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Server-side PDF validation (Phase 1):
 * 1. Magic bytes at object start — rejects extension/MIME spoofing.
 * 2. Size must match declared sizeBytes (checked separately via HeadObject).
 * Malicious PDFs may still contain embedded scripts; we do not execute PDFs server-side.
 * Extraction/RAG (Phase 2+) should run in isolated workers with resource limits.
 */
export function validatePdfHeaderForUpload(header: Uint8Array | Buffer): boolean {
  return isPdfMagicBytes(header);
}
