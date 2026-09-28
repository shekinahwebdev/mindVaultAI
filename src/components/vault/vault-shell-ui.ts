import { cn } from "@/lib/utils";

import { mvPageContainerClassName } from "@/lib/mv/layout-tokens";

/** Default authenticated page content wrapper (Phase A tokens). */
export const vaultMainContentClassName = cn(
  mvPageContainerClassName,
  "py-4 sm:py-5 lg:py-6",
);

export const vaultShellFrameClassName =
  "mv-frame flex h-full min-h-0 overflow-hidden bg-mv-page md:rounded-[var(--mv-radius-shell,1rem)]";

export const vaultSidebarRailClassName = cn(
  "mv-rail-capsule sticky top-0 flex h-[calc(100dvh-1.5rem)] max-h-[calc(100dvh-1.5rem)] flex-col rounded-[var(--mv-radius-card)] border border-border bg-surface py-2.5 md:top-3 md:h-[calc(100dvh-1.5rem-0.75rem)] md:max-h-[calc(100dvh-1.5rem-0.75rem)]",
);

export const vaultCaptureNavClassName = cn(
  "border border-border/80 bg-mv-panel/60 font-medium text-foreground",
  "hover:border-foreground/15 hover:bg-mv-panel",
);
