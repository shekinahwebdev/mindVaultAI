import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

import { vaultCardTitleClassName, vaultMetaClassName } from "@/lib/vault/vault-typography";
import { cn } from "@/lib/utils";

type DashboardSectionHeaderProps = {
  title: string;
  action?: { label: string; href: string };
  className?: string;
  children?: ReactNode;
};

export function DashboardSectionHeader({
  title,
  action,
  className,
  children,
}: DashboardSectionHeaderProps) {
  return (
    <div
      className={cn(
        "flex flex-wrap items-center justify-between gap-x-3 gap-y-1",
        className,
      )}
    >
      <h2 className={vaultCardTitleClassName}>{title}</h2>
      {action ? (
        <Link
          href={action.href}
          className={cn(
            vaultMetaClassName,
            "inline-flex items-center gap-1 font-medium transition-colors hover:text-foreground",
          )}
        >
          {action.label}
          <ArrowRight aria-hidden className="size-3.5" />
        </Link>
      ) : null}
      {children}
    </div>
  );
}
