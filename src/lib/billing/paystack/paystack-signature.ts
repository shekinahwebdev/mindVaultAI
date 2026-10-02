import { createHmac, timingSafeEqual } from "node:crypto";

export function computePaystackWebhookSignature(rawBody: string, secretKey: string): string {
  return createHmac("sha512", secretKey).update(rawBody).digest("hex");
}

export function verifyPaystackWebhookSignature(
  rawBody: string,
  signatureHeader: string | null,
  secretKey: string | null | undefined,
): boolean {
  if (!signatureHeader || !secretKey) {
    return false;
  }

  const expected = computePaystackWebhookSignature(rawBody, secretKey);

  try {
    const a = Buffer.from(signatureHeader, "utf8");
    const b = Buffer.from(expected, "utf8");
    if (a.length !== b.length) {
      return false;
    }
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}
