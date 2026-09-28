import type { ReactNode } from "react";

import {
  mvEmptyStateDashedClassName,
  mvEmptyStateSolidClassName,
} from "@/lib/mv/layout-tokens";
import { vaultBodyMutedClassName } from "@/lib/vault/vault-typography";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  description?: string;
  /** Optional icon or illustration above the title. */
  visual?: ReactNode;
  action?: ReactNode;
  variant?: "dashed" | "solid";
  className?: string;
};

export function EmptyState({
  title,
  description,
  visual,
  action,
  variant = "dashed",
  className,
}: EmptyStateProps) {
  return (
    <section
      className={cn(
        variant === "dashed" ? mvEmptyStateDashedClassName : mvEmptyStateSolidClassName,
        "flex flex-col items-center px-6 py-14 text-center sm:px-8 sm:py-16",
        className,
      )}
    >
      {visual ? (
        <div className="mb-5 flex items-center justify-center text-muted-foreground">
          {visual}
        </div>
      ) : null}
      <h2 className="text-[1.125rem] font-semibold tracking-[-0.01em] text-foreground sm:text-[1.25rem]">
        {title}
      </h2>
      {description ? (
        <p className={cn(vaultBodyMutedClassName, "mt-2 max-w-md")}>{description}</p>
      ) : null}
      {action ? <div className="mt-6 flex flex-wrap items-center justify-center gap-2">{action}</div> : null}
    </section>
  );
}
