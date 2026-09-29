"use client";

import { useCallback, useEffect, useState } from "react";

import { SETTINGS_LOAD_ERROR } from "@/lib/settings/settings-config";
import { fetchSettings } from "@/lib/settings/settings-client";
import type {
  SerializedAccount,
  SerializedPreferences,
  VaultStorageStats,
} from "@/lib/settings/settings-queries";

export type SettingsData = {
  account: SerializedAccount;
  preferences: SerializedPreferences;
  storage: VaultStorageStats;
};

export function useSettingsData() {
  const [data, setData] = useState<SettingsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const applyResponse = useCallback(
    (response: Awaited<ReturnType<typeof fetchSettings>>["data"]) => {
      if (response?.ok) {
        setData({
          account: response.account,
          preferences: response.preferences,
          storage: response.storage,
        });
        setError("");
      } else {
        setError(response?.message || SETTINGS_LOAD_ERROR);
        setData(null);
      }
      setLoading(false);
    },
    [],
  );

  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    const { data: response } = await fetchSettings();
    applyResponse(response);
  }, [applyResponse]);

  useEffect(() => {
    let cancelled = false;
    fetchSettings().then(({ data: response }) => {
      if (cancelled) return;
      applyResponse(response);
    });
    return () => {
      cancelled = true;
    };
  }, [applyResponse]);

  return { data, loading, error, reload };
}
