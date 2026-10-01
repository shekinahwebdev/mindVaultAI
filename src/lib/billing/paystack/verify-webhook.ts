import "server-only";

import { assertPaystackTestSecretKey, getPaystackSecretKey } from "./config";
import { verifyPaystackWebhookSignature as verifySignature } from "./paystack-signature";

export function verifyPaystackWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secretKey = getPaystackSecretKey(),
): boolean {
  if (!secretKey) {
    return false;
  }
  assertPaystackTestSecretKey(secretKey);
  return verifySignature(rawBody, signatureHeader, secretKey);
}
