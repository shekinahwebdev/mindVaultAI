import { cn } from "@/lib/utils";

import { mvPageContainerClassName } from "@/lib/mv/layout-tokens";

/** Default authenticated page content wrapper (Phase A tokens). */
export const vaultMainContentClassName = cn(
  mvPageContainerClassName,
  "mv-vault-main py-[var(--mv-space-page-y)] sm:py-[calc(var(--mv-space-page-y)+0.25rem)] lg:py-[calc(var(--mv-space-page-y)+0.5rem)]",
);

export const vaultShellFrameClassName =
  "mv-frame flex h-full min-h-0 overflow-hidden bg-mv-page md:rounded-[var(--mv-radius-shell,1rem)]";

export const vaultSidebarRailClassName = cn(
  "mv-rail-capsule sticky top-0 flex h-[calc(100dvh-1.5rem)] max-h-[calc(100dvh-1.5rem)] flex-col rounded-[var(--mv-radius-card)] border border-sidebar-border bg-sidebar py-2.5 text-sidebar-foreground md:top-3 md:h-[calc(100dvh-1.5rem-0.75rem)] md:max-h-[calc(100dvh-1.5rem-0.75rem)]",
);

export const vaultCaptureNavClassName = cn(
  "border border-sidebar-border bg-[var(--mv-sidebar-nav-hover-bg)] font-medium text-sidebar-foreground",
  "hover:border-foreground/12 hover:bg-[var(--mv-sidebar-nav-active-bg)]",
);
