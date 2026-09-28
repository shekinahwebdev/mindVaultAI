import type { ElementType, ReactNode } from "react";

import {
  mvContentCardClassName,
  mvContentCardElevatedClassName,
  mvContentCardMutedClassName,
  mvContentCardPadding,
  type MvContentCardPadding,
} from "@/lib/mv/layout-tokens";
import { cn } from "@/lib/utils";

type ContentCardVariant = "default" | "muted" | "elevated";

const variantClassName: Record<ContentCardVariant, string> = {
  default: mvContentCardClassName,
  muted: mvContentCardMutedClassName,
  elevated: mvContentCardElevatedClassName,
};

type ContentCardProps = {
  children: ReactNode;
  className?: string;
  padding?: MvContentCardPadding;
  variant?: ContentCardVariant;
  as?: ElementType;
};

export function ContentCard({
  children,
  className,
  padding = "md",
  variant = "default",
  as: Component = "section",
}: ContentCardProps) {
  return (
    <Component
      className={cn(
        variantClassName[variant],
        mvContentCardPadding[padding],
        className,
      )}
    >
      {children}
    </Component>
  );
}
