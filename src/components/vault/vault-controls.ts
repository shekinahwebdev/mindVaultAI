/**
 * Authenticated vault controls — compact product proportions (Geist UI).
 */
import {
  vaultCardTitleClassName,
  vaultEyebrowClassName,
  vaultLabelClassName,
  vaultMetaClassName,
  vaultMetaFaintClassName,
  vaultPageLeadClassName,
  vaultPageTitleClassName,
  vaultSectionTitleClassName,
} from "@/lib/vault/vault-typography";

export {
  vaultCardTitleClassName,
  vaultEyebrowClassName,
  vaultLabelClassName,
  vaultMetaClassName,
  vaultMetaFaintClassName,
  vaultPageLeadClassName,
  vaultPageTitleClassName,
  vaultSectionTitleClassName,
};

export const vaultActionRadius = "rounded-[8px]";
export const vaultIconRadius = "rounded-[8px]";

export const vaultActionFocus =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export const vaultActionShape = `${vaultActionRadius} ${vaultActionFocus}`;
export const vaultIconShape = `${vaultIconRadius} ${vaultActionFocus}`;

const vaultButtonBase =
  "inline-flex h-9 items-center justify-center gap-1.5 px-3.5 text-[0.875rem] font-medium transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-50";

export const vaultPrimaryButton = `${vaultButtonBase} bg-primary text-primary-foreground hover:opacity-90 ${vaultActionShape}`;

export const vaultSecondaryButton = `${vaultButtonBase} border border-border bg-surface text-foreground hover:bg-mv-panel ${vaultActionShape}`;

export const vaultGhostButton = `${vaultButtonBase} text-muted-foreground hover:bg-mv-panel hover:text-foreground ${vaultActionShape}`;

export const vaultDestructiveButton = `${vaultButtonBase} border border-red-400/30 bg-red-500/10 text-red-600 dark:text-red-300 hover:bg-red-500/15 ${vaultActionShape}`;

export const vaultIconButton = `inline-flex size-9 items-center justify-center border border-border bg-surface text-muted-foreground transition-colors duration-200 hover:bg-mv-panel hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50 ${vaultIconShape}`;

export const vaultInputClassName = `h-10 w-full rounded-[8px] border border-border bg-surface px-3 text-[0.875rem] text-foreground outline-none transition-colors placeholder:text-mv-faint focus:border-foreground/25 disabled:cursor-not-allowed disabled:opacity-60`;

export const vaultPanelClassName =
  "rounded-[12px] border border-border bg-surface";

export const vaultSegmentedTrack =
  "inline-flex rounded-[8px] border border-border bg-mv-panel p-0.5";

export const vaultSegmentedItemActive =
  "rounded-[6px] bg-surface text-foreground shadow-[0_1px_2px_rgb(0_0_0/0.04)] ring-1 ring-border";

export const vaultSegmentedItemIdle =
  "rounded-[6px] text-muted-foreground transition-colors hover:text-foreground";

export const vaultRailTooltipClassName =
  "pointer-events-none absolute top-1/2 left-[calc(100%+0.55rem)] z-50 -translate-y-1/2 whitespace-nowrap rounded-[8px] border border-border bg-surface px-2 py-1 text-[0.8125rem] font-medium text-foreground opacity-0 shadow-[0_8px_24px_rgba(0,0,0,0.12)] transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100";

/** Subtle active rail item — not a heavy filled pill. */
export const vaultRailActive =
  "bg-mv-panel text-foreground ring-1 ring-inset ring-[var(--mv-user-accent-border)]";

export const vaultRailIdle =
  "text-muted-foreground transition-colors duration-200 hover:bg-mv-panel/80 hover:text-foreground";

export const vaultHeaderIconClassName = `flex size-8 items-center justify-center rounded-[8px] text-muted-foreground transition-colors duration-200 hover:bg-mv-panel hover:text-foreground ${vaultActionFocus}`;
