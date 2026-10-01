"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";

import { usePreferences } from "@/lib/settings/preferences-context";

function subscribeSystemReducedMotion(onStoreChange: () => void) {
  const media = window.matchMedia("(prefers-reduced-motion: reduce)");
  media.addEventListener("change", onStoreChange);
  return () => media.removeEventListener("change", onStoreChange);
}

function getSystemPrefersReducedMotion() {
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function getServerPrefersReducedMotion() {
  return false;
}

/** Applies vault appearance preferences to `#mv-app` (accent, density, font, motion). */
export function VaultAppearanceBindings() {
  const { preferences, loading } = usePreferences();
  const systemReducedMotion = useSyncExternalStore(
    subscribeSystemReducedMotion,
    getSystemPrefersReducedMotion,
    getServerPrefersReducedMotion,
  );

  useLayoutEffect(() => {
    const root = document.documentElement;
    const effectiveReducedMotion = preferences.reducedMotion || systemReducedMotion;
    if (effectiveReducedMotion) {
      root.setAttribute("data-reduced-motion", "true");
    } else {
      root.removeAttribute("data-reduced-motion");
    }
  }, [preferences.reducedMotion, systemReducedMotion]);

  useLayoutEffect(() => {
    if (loading) {
      return;
    }

    const app = document.getElementById("mv-app");
    if (!app) {
      return;
    }

    app.dataset.accent = preferences.accentColor;
    app.dataset.density = preferences.interfaceDensity;
    app.dataset.uiFont = preferences.fontFamily;
  }, [
    loading,
    preferences.accentColor,
    preferences.interfaceDensity,
    preferences.fontFamily,
  ]);

  return null;
}
