import type { SerializedSubscriptionResponse } from "./serialize-subscription";

export type SubscriptionApiResponse =
  | { ok: true; subscription: SerializedSubscriptionResponse }
  | { ok: false; message?: string };

export async function fetchSubscription(): Promise<{
  data: SubscriptionApiResponse | null;
  status: number;
}> {
  const response = await fetch("/api/subscription", {
    method: "GET",
    credentials: "include",
    cache: "no-store",
  });

  let data: SubscriptionApiResponse | null = null;
  try {
    data = (await response.json()) as SubscriptionApiResponse;
  } catch {
    data = null;
  }

  return { data, status: response.status };
}
