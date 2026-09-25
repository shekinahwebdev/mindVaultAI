import Link from "next/link";
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
          className={cn(vaultMetaClassName, "font-medium transition-colors hover:text-foreground")}
        >
          {action.label}
        </Link>
      ) : null}
      {children}
    </div>
  );
}
