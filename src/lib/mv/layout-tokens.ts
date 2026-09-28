/**
 * MindVault layout primitives — class tokens for Phase A design system.
 * Use with components in `@/components/mv/*` or compose directly in views.
 */
import { cn } from "@/lib/utils";

import {
  vaultPageLeadClassName,
  vaultPageTitleClassName,
  vaultEyebrowClassName,
} from "@/lib/vault/vault-typography";

export {
  vaultPageLeadClassName,
  vaultPageTitleClassName,
  vaultEyebrowClassName,
};

/** Page content max width + horizontal padding (authenticated app). */
export const mvPageContainerClassName =
  "mx-auto w-full max-w-[var(--mv-page-max-width)] px-[var(--mv-page-padding-x)]";

/** Vertical rhythm between major page blocks. */
export const mvPageStackClassName = "flex flex-col gap-[var(--mv-page-stack-gap)]";

export const mvRadiusCardClassName = "rounded-[var(--mv-radius-card)]";
export const mvRadiusControlClassName = "rounded-[var(--mv-radius-control)]";

/** Standard elevated panel (reference: rounded cards, minimal border). */
export const mvContentCardClassName = cn(
  mvRadiusCardClassName,
  "border border-border bg-surface",
  "shadow-[var(--mv-shadow-card)]",
);

export const mvContentCardMutedClassName = cn(
  mvRadiusCardClassName,
  "border border-border bg-mv-panel",
);

export const mvContentCardElevatedClassName = cn(
  mvRadiusCardClassName,
  "border border-border bg-mv-elevated",
  "shadow-[var(--mv-shadow-elevated)]",
);

export const mvContentCardPadding = {
  none: "",
  sm: "p-4 sm:p-5",
  md: "p-5 sm:p-6",
  lg: "p-6 sm:p-8",
} as const;

export type MvContentCardPadding = keyof typeof mvContentCardPadding;

export const mvEmptyStateDashedClassName = cn(
  mvRadiusCardClassName,
  "border border-dashed border-border bg-mv-panel",
);

export const mvEmptyStateSolidClassName = cn(
  mvRadiusCardClassName,
  "border border-border bg-surface",
  "shadow-[var(--mv-shadow-card)]",
);

/** Subtle cosmic background layer (marketing, auth, onboarding shells). */
export const mvCosmicSurfaceClassName = "mv-cosmic-surface relative isolate overflow-hidden";
