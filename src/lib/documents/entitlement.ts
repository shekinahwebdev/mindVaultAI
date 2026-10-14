import { getUserEntitlements } from "@/lib/billing/entitlements";

/**
 * Document upload rollout: plan flag `documentUpload` stays false until product
 * enables it per tier. Set MINDVAULT_DOCUMENT_UPLOAD_ENABLED=true to allow uploads
 * for entitled users during staged rollout (without flipping all plans on).
 */
export function isDocumentUploadRolloutEnabled(): boolean {
  return process.env.MINDVAULT_DOCUMENT_UPLOAD_ENABLED === "true";
}

export async function assertDocumentUploadAllowed(
  userId: string,
): Promise<
  | { ok: true }
  | { ok: false; code: "feature_disabled"; message: string }
> {
  const entitlements = await getUserEntitlements(userId);
  const planAllows = entitlements.features.documentUpload;
  const rollout = isDocumentUploadRolloutEnabled();

  if (!planAllows && !rollout) {
    return {
      ok: false,
      code: "feature_disabled",
      message: "Document upload is not available on your plan yet.",
    };
  }

  return { ok: true };
}
