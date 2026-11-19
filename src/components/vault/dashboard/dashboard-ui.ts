import {
  mvContentCardClassName,
  mvRadiusCardClassName,
} from "@/lib/mv/layout-tokens";
import { cn } from "@/lib/utils";

export const dashboardRadius = mvRadiusCardClassName;

export const dashboardPanelClassName = mvContentCardClassName;

export const dashboardPanelStaticClassName = dashboardPanelClassName;

export const dashboardPanelPaddingClassName = "px-4 py-4 sm:px-5 sm:py-4";

export const dashboardInsightPanelClassName = cn(
  mvContentCardClassName,
  "relative overflow-hidden",
  "before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(135deg,var(--mv-insight-glow)_0%,transparent_55%)]",
);

export const dashboardStatCardClassName = cn(
  mvRadiusCardClassName,
  "flex flex-col border border-border bg-surface px-3.5 py-3",
  "transition-[border-color,background-color] duration-200",
  "hover:border-foreground/10",
);

/** @deprecated Prefer ContentCard — alias for existing panels */
export const dashboardBentoCellClassName = mvContentCardClassName;

export const dashboardBentoMiniStatClassName = cn(
  dashboardBentoCellClassName,
  "flex flex-col px-3 py-3",
  "transition-colors hover:border-foreground/10",
);

export const dashboardBentoTotalClassName = cn(
  dashboardBentoCellClassName,
  "flex flex-col px-4 py-3.5",
);

/** Dashboard capture shortcut tiles (desktop home). */
export const dashboardCaptureShortcutClassName = cn(
  mvRadiusCardClassName,
  "border border-border bg-surface px-4 py-3",
  "text-[0.8125rem] font-medium text-foreground transition-colors",
  "hover:border-foreground/20 hover:bg-mv-panel",
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
);
