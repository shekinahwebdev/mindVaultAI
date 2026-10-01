import "server-only";

import { paystackRequest } from "./client";

export async function fetchPaystackManageLink(subscriptionCode: string) {
  const encoded = encodeURIComponent(subscriptionCode);
  const response = await paystackRequest<{ link: string }>(
    `/subscription/${encoded}/manage/link`,
    { method: "GET" },
  );

  if (!response.status) {
    throw new Error(response.message || "Could not create manage link.");
  }

  return response.data.link;
}

export async function disablePaystackSubscription(params: {
  code: string;
  emailToken: string;
}) {
  const response = await paystackRequest<unknown>("/subscription/disable", {
    method: "POST",
    body: JSON.stringify({
      code: params.code,
      token: params.emailToken,
    }),
  });

  if (!response.status) {
    throw new Error(response.message || "Could not cancel subscription.");
  }

  return response.data;
}
