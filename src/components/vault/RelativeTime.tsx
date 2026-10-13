"use client";

import { useSyncExternalStore } from "react";

import {
  formatRelativeTime,
  formatRelativeTimeAnchor,
} from "@/lib/vault/format-relative-time";
import { cn } from "@/lib/utils";

type RelativeTimeProps = {
  iso: string;
  className?: string;
};

function subscribeToHydration() {
  return () => {};
}

function getHydratedSnapshot() {
  return true;
}

function getServerHydrationSnapshot() {
  return false;
}

function useHydrated() {
  return useSyncExternalStore(
    subscribeToHydration,
    getHydratedSnapshot,
    getServerHydrationSnapshot,
  );
}

/** Relative time that matches on server and during hydration, then updates on the client. */
export function RelativeTime({ iso, className }: RelativeTimeProps) {
  const hydrated = useHydrated();
  const label = hydrated ? formatRelativeTime(iso) : formatRelativeTimeAnchor(iso);

  return <span className={cn(className)}>{label}</span>;
}
