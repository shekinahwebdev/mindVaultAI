"use client";

import { useEffect } from "react";

import { useTheme } from "@/components/theme/ThemeProvider";
import { usePreferences } from "@/lib/settings/preferences-context";
import { prismaThemeToPreference } from "@/lib/theme";

/** Keeps ThemeProvider aligned with DB-backed preferences (sidebar + settings). */
export function VaultThemeSync() {
  const { preferences, loading } = usePreferences();
  const { preference, setPreference } = useTheme();

  useEffect(() => {
    if (loading) {
      return;
    }
    const fromDb = prismaThemeToPreference(preferences.theme);
    if (fromDb !== preference) {
      setPreference(fromDb);
    }
  }, [loading, preference, preferences.theme, setPreference]);

  return null;
}
