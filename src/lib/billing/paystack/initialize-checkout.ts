import "server-only";

import { getAppOrigin, getPaystackProPlanCode } from "./config";
import { paystackRequest } from "./client";
import type { PaystackInitializeData } from "./types";

export type InitializePaystackCheckoutInput = {
  email: string;
  userId: string;
  reference: string;
};

export async function initializePaystackProCheckout(
  input: InitializePaystackCheckoutInput,
) {
  const planCode = getPaystackProPlanCode();
  if (!planCode) {
    throw new Error("Paystack Pro plan is not configured.");
  }

  const callbackUrl = `${getAppOrigin()}/vault/settings/subscription/callback`;

  const response = await paystackRequest<PaystackInitializeData>(
    "/transaction/initialize",
    {
      method: "POST",
      body: JSON.stringify({
        email: input.email,
        plan: planCode,
        reference: input.reference,
        callback_url: callbackUrl,
        metadata: {
          mindvault_user_id: input.userId,
          mindvault_plan: "PRO",
          paystack_plan_code: planCode,
        },
      }),
    },
  );

  if (!response.status) {
    throw new Error(response.message || "Could not start Paystack checkout.");
  }

  return response.data;
}
