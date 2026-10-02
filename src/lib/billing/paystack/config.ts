import "server-only";

/** MindVault Pro marketing price — Paystack TEST plan must match this in your dashboard (TEST ONLY). */
export const PAYSTACK_PRO_LIST_PRICE_USD = 9.99;

export function getPaystackSecretKey(): string | null {
  const key = process.env.PAYSTACK_SECRET_KEY?.trim();
  return key || null;
}

export function getPaystackProPlanCode(): string | null {
  const code = process.env.PAYSTACK_PRO_PLAN_CODE?.trim();
  return code || null;
}

export function getAppOrigin(): string {
  const origin =
    process.env.APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    "http://localhost:3003";
  return origin.replace(/\/$/, "");
}

export function isPaystackConfigured(): boolean {
  return Boolean(getPaystackSecretKey() && getPaystackProPlanCode());
}

export function isPaystackCheckoutEnabled(): boolean {
  return isPaystackConfigured();
}

/** Phase 2: reject live secret keys until an explicit go-live gate exists. */
export function assertPaystackTestSecretKey(secret: string) {
  if (!secret.startsWith("sk_test_")) {
    throw new Error("Only Paystack test secret keys are allowed in this environment.");
  }
}
