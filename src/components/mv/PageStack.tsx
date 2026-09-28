import type { ReactNode } from "react";

import { mvPageContainerClassName, mvPageStackClassName } from "@/lib/mv/layout-tokens";
import { cn } from "@/lib/utils";

type PageStackProps = {
  children: ReactNode;
  className?: string;
  /** Constrain width for main app content columns. */
  contained?: boolean;
};

export function PageStack({ children, className, contained = false }: PageStackProps) {
  return (
    <div
      className={cn(
        mvPageStackClassName,
        contained && mvPageContainerClassName,
        className,
      )}
    >
      {children}
    </div>
  );
}
