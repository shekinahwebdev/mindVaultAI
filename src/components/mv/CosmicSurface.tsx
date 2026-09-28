import type { ReactNode } from "react";

import { mvCosmicSurfaceClassName } from "@/lib/mv/layout-tokens";
import { cn } from "@/lib/utils";

type CosmicSurfaceProps = {
  children: ReactNode;
  className?: string;
  /** When false, only applies base background without starfield layer. */
  starfield?: boolean;
};

/**
 * Full-bleed background shell for landing, auth, and onboarding (Phase B+).
 * Uses CSS-only gradients; does not replace IntroAtmosphere on existing intro.
 */
export function CosmicSurface({
  children,
  className,
  starfield = true,
}: CosmicSurfaceProps) {
  return (
    <div
      className={cn(
        mvCosmicSurfaceClassName,
        "min-h-svh bg-background text-foreground",
        starfield && "mv-cosmic-starfield",
        className,
      )}
    >
      {children}
    </div>
  );
}
