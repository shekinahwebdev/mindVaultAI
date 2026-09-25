import { cn } from "@/lib/utils";

export const dashboardRadius = "rounded-[12px]";

export const dashboardPanelClassName = cn(
  dashboardRadius,
  "border border-border bg-surface",
);

export const dashboardPanelStaticClassName = dashboardPanelClassName;

export const dashboardPanelPaddingClassName = "px-4 py-4 sm:px-5 sm:py-4";

export const dashboardInsightPanelClassName = cn(
  dashboardRadius,
  "relative overflow-hidden border border-border bg-surface",
  "before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(135deg,var(--mv-insight-glow)_0%,transparent_55%)]",
);

export const dashboardStatCardClassName = cn(
  dashboardRadius,
  "flex flex-col border border-border bg-surface px-3.5 py-3",
  "transition-[border-color,background-color] duration-200",
  "hover:border-foreground/10",
);
