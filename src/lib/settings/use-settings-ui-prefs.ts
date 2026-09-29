"use client";

import { useCallback, useState } from "react";

import {
  readSettingsUiPrefs,
  writeSettingsUiPrefs,
  type SettingsUiPrefs,
} from "./settings-ui-prefs";

export function useSettingsUiPrefs() {
  const [prefs, setPrefsState] = useState(readSettingsUiPrefs);
  const ready = true;

  const setPrefs = useCallback((patch: Partial<SettingsUiPrefs>) => {
    setPrefsState((current) => {
      const next = { ...current, ...patch };
      writeSettingsUiPrefs(next);
      return next;
    });
  }, []);

  return { prefs, setPrefs, ready };
}
