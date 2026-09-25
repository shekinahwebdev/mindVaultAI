/**
 * Semantic vault text/surface classes — theme-aware via CSS variables on html/.mv-app.
 * Prefer these over text-white/* in authenticated vault UI.
 */
export const vaultTextPrimary = "text-foreground";
export const vaultTextSecondary = "text-muted-foreground";
export const vaultTextMuted = "text-mv-faint";
export const vaultTextOnPrimary = "text-primary-foreground";

export const vaultIconIdle =
  "text-muted-foreground transition-colors hover:bg-mv-panel hover:text-foreground";
export const vaultIconIdleSubtle =
  "text-mv-faint transition-colors hover:bg-mv-panel hover:text-foreground";

export const vaultNavIdle =
  "text-muted-foreground transition-colors hover:text-foreground";
export const vaultNavActive = "bg-primary text-primary-foreground";

export const vaultRailIdle =
  "text-muted-foreground transition-colors hover:bg-mv-panel hover:text-foreground";
export const vaultRailActive = "bg-primary text-primary-foreground";

export const vaultHoverRow = "transition-colors hover:bg-mv-panel";
