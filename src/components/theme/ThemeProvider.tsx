"use client";

import {
  createContext,
  useCallback,
  useContext,
  useLayoutEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

import {
  applyDocumentTheme,
  persistThemeCookie,
  resolveTheme,
  type ResolvedTheme,
  type ThemePreference,
} from "@/lib/theme";

type ThemeContextValue = {
  preference: ThemePreference;
  resolved: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function subscribeSystemTheme(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-color-scheme: light)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getSystemIsLight() {
  return window.matchMedia("(prefers-color-scheme: light)").matches;
}

function getServerSystemIsLight() {
  return true;
}

export function ThemeProvider({
  initialPreference,
  children,
}: {
  initialPreference: ThemePreference;
  children: ReactNode;
}) {
  const [preference, setPreferenceState] =
    useState<ThemePreference>(initialPreference);
  const systemIsLight = useSyncExternalStore(
    subscribeSystemTheme,
    getSystemIsLight,
    getServerSystemIsLight,
  );
  const resolved = resolveTheme(preference, systemIsLight);

  useLayoutEffect(() => {
    persistThemeCookie(preference);
    applyDocumentTheme(resolved);
  }, [preference, resolved]);

  useLayoutEffect(() => {
    return () => {
      const root = document.documentElement;
      root.classList.remove("light");
      root.classList.add("dark");
      root.style.colorScheme = "dark";
    };
  }, []);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    persistThemeCookie(next);
    applyDocumentTheme(resolveTheme(next, getSystemIsLight()));
  }, []);

  const value = useMemo(
    () => ({
      preference,
      resolved,
      setPreference,
    }),
    [preference, resolved, setPreference],
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within ThemeProvider");
  }
  return context;
}
