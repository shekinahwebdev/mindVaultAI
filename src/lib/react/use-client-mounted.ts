"use client";

import { useSyncExternalStore } from "react";

/** True after the client has mounted; false during SSR. */
export function useClientMounted(): boolean {
  return useSyncExternalStore(
    () => () => {},
    () => true,
    () => false,
  );
}
