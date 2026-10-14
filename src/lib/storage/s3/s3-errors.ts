import { DOCUMENT_SERVER_ERROR } from "@/lib/documents/config";

export type S3ClientErrorKind =
  | "credentials_missing"
  | "credentials_invalid"
  | "config_missing"
  | "access_denied"
  | "region"
  | "connection"
  | "unknown";

export function classifyS3ClientError(error: unknown): S3ClientErrorKind {
  const name = (error as { name?: string }).name ?? "";
  const message = error instanceof Error ? error.message : String(error);

  if (
    name === "CredentialsProviderError" ||
    message.includes("Could not load credentials")
  ) {
    return "credentials_missing";
  }
  if (
    name === "InvalidAccessKeyId" ||
    name === "SignatureDoesNotMatch" ||
    name === "UnrecognizedClientException" ||
    message.includes("InvalidClientTokenId")
  ) {
    return "credentials_invalid";
  }
  if (message.includes("AWS_S3_DOCUMENT_BUCKET is not configured")) {
    return "config_missing";
  }
  if (name === "AccessDenied" || name === "AccessDeniedException") {
    return "access_denied";
  }
  if (
    name === "PermanentRedirect" ||
    name === "AuthorizationHeaderMalformed" ||
    message.includes("region")
  ) {
    return "region";
  }
  const code = (error as { code?: string }).code;
  if (
    code === "ECONNRESET" ||
    code === "ETIMEDOUT" ||
    code === "ENOTFOUND" ||
    code === "NetworkingError" ||
    name === "TimeoutError"
  ) {
    return "connection";
  }
  return "unknown";
}

/** Safe for API responses — no ARNs, keys, or bucket internals. */
export function userMessageForS3ClientError(kind: S3ClientErrorKind): string {
  switch (kind) {
    case "credentials_missing":
      return "Document storage is not configured on the server. Contact support.";
    case "credentials_invalid":
      return "Document storage authentication failed. Contact support.";
    case "config_missing":
      return "Document storage is not configured.";
    case "access_denied":
      return "Document storage permissions are insufficient. Contact support.";
    case "region":
      return "Document storage region is misconfigured. Contact support.";
    case "connection":
      return "Could not reach document storage. Try again later.";
    case "unknown":
    default:
      return DOCUMENT_SERVER_ERROR;
  }
}

export function logS3ClientError(context: string, error: unknown): void {
  const kind = classifyS3ClientError(error);
  const name = (error as { name?: string }).name;
  console.error(`[s3:${context}]`, { kind, name });
}
