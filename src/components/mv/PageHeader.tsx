import type { ReactNode } from "react";

import {
  mvPageStackClassName,
  vaultEyebrowClassName,
  vaultPageLeadClassName,
  vaultPageTitleClassName,
} from "@/lib/mv/layout-tokens";
import { cn } from "@/lib/utils";

type PageHeaderProps = {
  title: string;
  lead?: string;
  eyebrow?: string;
  actions?: ReactNode;
  className?: string;
  /** Compact titles for nested settings sections. */
  size?: "default" | "compact";
};

const compactTitleClassName =
  "text-[1.375rem] font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-[1.5rem]";

export function PageHeader({
  title,
  lead,
  eyebrow,
  actions,
  className,
  size = "default",
}: PageHeaderProps) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4",
        className,
      )}
    >
      <div className={cn(mvPageStackClassName, "min-w-0 flex-1 gap-1.5")}>
        {eyebrow ? (
          <p className={cn(vaultEyebrowClassName, "uppercase tracking-[0.06em]")}>
            {eyebrow}
          </p>
        ) : null}
        <h1 className={size === "default" ? vaultPageTitleClassName : compactTitleClassName}>
          {title}
        </h1>
        {lead ? <p className={vaultPageLeadClassName}>{lead}</p> : null}
      </div>
      {actions ? (
        <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>
      ) : null}
    </header>
  );
}
