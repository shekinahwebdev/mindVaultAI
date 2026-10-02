"use client";

import { useCallback, useEffect, useState } from "react";

import { fetchSubscription } from "./subscription-client";
import type { SerializedSubscriptionResponse } from "./serialize-subscription";

export function useSubscription() {
  const [subscription, setSubscription] =
    useState<SerializedSubscriptionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    setLoading(true);
    const { data } = await fetchSubscription();
    if (data?.ok) {
      setSubscription(data.subscription);
      setError("");
    } else {
      setSubscription(null);
      setError(data?.message || "Could not load subscription.");
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return { subscription, loading, error, refresh };
}
