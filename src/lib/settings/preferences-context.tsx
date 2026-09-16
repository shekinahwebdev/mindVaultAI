"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import type { SerializedPreferences } from "./settings-queries";
import { fetchSettings } from "./settings-client";

const defaultPreferences: SerializedPreferences = {
  defaultNoteType: "NOTE",
  defaultCategoryId: null,
  defaultSearchMode: "KEYWORD",
  aiAssistanceEnabled: true,
  ragEnabled: true,
  reducedMotion: false,
};

type PreferencesContextValue = {
  preferences: SerializedPreferences;
  loading: boolean;
  setPreferences: (next: SerializedPreferences) => void;
  refreshPreferences: () => Promise<void>;
};

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferencesState] =
    useState<SerializedPreferences>(defaultPreferences);
  const [loading, setLoading] = useState(true);

  const refreshPreferences = useCallback(async () => {
    const { data } = await fetchSettings();
    if (data?.ok) {
      setPreferencesState(data.preferences);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchSettings().then(({ data }) => {
      if (cancelled) {
        return;
      }
      if (data?.ok) {
        setPreferencesState(data.preferences);
      }
      setLoading(false);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (preferences.reducedMotion) {
      root.setAttribute("data-reduced-motion", "true");
    } else {
      root.removeAttribute("data-reduced-motion");
    }
  }, [preferences.reducedMotion]);

  const value = useMemo(
    () => ({
      preferences,
      loading,
      setPreferences: setPreferencesState,
      refreshPreferences,
    }),
    [preferences, loading, refreshPreferences],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error("usePreferences must be used within PreferencesProvider");
  }
  return context;
}
