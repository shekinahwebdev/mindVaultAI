/** Maximum PDF size accepted at upload initiation (50 MiB). */
export const DOCUMENT_MAX_SIZE_BYTES = 50 * 1024 * 1024;

/** Presigned PUT URL lifetime (seconds). */
export const DOCUMENT_PRESIGNED_UPLOAD_TTL_SECONDS = 15 * 60;

/** How long a PENDING_UPLOAD may be retried before EXPIRED (minutes). */
export const DOCUMENT_PENDING_UPLOAD_TTL_MINUTES = 60;

export const DOCUMENT_ALLOWED_MIME = "application/pdf";

export const DOCUMENT_SERVER_ERROR = "Something went wrong with your document. Please try again.";

/** Max upload initiations per user per rolling hour (abuse guard). */
export const DOCUMENT_MAX_INITIATES_PER_HOUR = 30;
