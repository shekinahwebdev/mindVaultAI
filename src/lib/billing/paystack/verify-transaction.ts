import "server-only";

import { paystackRequest } from "./client";
import type { PaystackVerifyTransactionData } from "./types";

export async function verifyPaystackTransaction(reference: string) {
  const encoded = encodeURIComponent(reference);
  const response = await paystackRequest<PaystackVerifyTransactionData>(
    `/transaction/verify/${encoded}`,
    { method: "GET" },
  );

  if (!response.status) {
    return { ok: false as const, message: response.message };
  }

  return { ok: true as const, data: response.data };
}

export function parsePaystackMetadata(
  metadata: PaystackVerifyTransactionData["metadata"],
): Record<string, unknown> {
  if (!metadata) {
    return {};
  }
  if (typeof metadata === "string") {
    try {
      const parsed = JSON.parse(metadata) as unknown;
      return typeof parsed === "object" && parsed !== null && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : {};
    } catch {
      return {};
    }
  }
  return metadata;
}
