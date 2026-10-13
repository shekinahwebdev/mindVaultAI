"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchSubscription } from "./subscription-client";
import type { SerializedSubscriptionResponse } from "./serialize-subscription";

function applySubscriptionPayload(
  data: Awaited<ReturnType<typeof fetchSubscription>>["data"],
): {
  subscription: SerializedSubscriptionResponse | null;
  error: string;
} {
  if (data?.ok) {
    return { subscription: data.subscription, error: "" };
  }
  return {
    subscription: null,
    error: data?.message || "Could not load subscription.",
  };
}

export function useSubscription() {
  const [subscription, setSubscription] =
    useState<SerializedSubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    void fetchSubscription().then(({ data }) => {
      if (cancelled) {
        return;
      }
      const next = applySubscriptionPayload(data);
      setSubscription(next.subscription);
      setError(next.error);
      setLoading(false);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchSubscription();
    const next = applySubscriptionPayload(data);
    setSubscription(next.subscription);
    setError(next.error);
    setLoading(false);
  }, []);

  return { subscription, loading, error, refresh };
}
