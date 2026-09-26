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

/** Bento layout — restrained cells, minimal shadow. */
export const dashboardBentoCellClassName = cn(
  dashboardRadius,
  "border border-border bg-surface shadow-[0_1px_2px_rgb(0_0_0/0.02)]",
);

export const dashboardBentoMiniStatClassName = cn(
  dashboardBentoCellClassName,
  "flex flex-col px-3 py-3",
  "transition-colors hover:border-foreground/10",
);

export const dashboardBentoTotalClassName = cn(
  dashboardBentoCellClassName,
  "flex flex-col px-4 py-3.5",
);
