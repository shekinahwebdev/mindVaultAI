import "server-only";

import {
  assertPaystackTestSecretKey,
  getPaystackSecretKey,
} from "./config";
import type { PaystackApiResponse } from "./types";

const PAYSTACK_API_BASE = "https://api.paystack.co";

export class PaystackApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PaystackApiError";
  }
}

export async function paystackRequest<T>(
  path: string,
  init?: RequestInit & { secretKey?: string },
): Promise<PaystackApiResponse<T>> {
  const secret = init?.secretKey ?? getPaystackSecretKey();
  if (!secret) {
    throw new PaystackApiError("Paystack is not configured.");
  }
  assertPaystackTestSecretKey(secret);

  const response = await fetch(`${PAYSTACK_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });

  const body = (await response.json()) as PaystackApiResponse<T>;
  return body;
}
