import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { ContentCard } from "@/components/mv/ContentCard";
import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { dashboardInsightPanelClassName } from "./dashboard-ui";

type DashboardAiInsightProps = {
  hasNotes: boolean;
  className?: string;
};

export function DashboardAiInsight({ hasNotes, className }: DashboardAiInsightProps) {
  return (
    <ContentCard
      as="section"
      padding="sm"
      className={cn(dashboardInsightPanelClassName, "min-w-0", className)}
    >
      <div className="relative flex min-w-0 items-start gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-[var(--mv-radius-control)] border border-border bg-mv-panel text-foreground">
          <Sparkles aria-hidden className="size-3.5 stroke-[1.6]" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <h2 className="text-[0.8125rem] font-semibold tracking-[-0.01em] text-foreground">
              Vault intelligence
            </h2>
            <Link
              href={vaultRoutes.chat}
              className="inline-flex shrink-0 items-center gap-1 text-[0.75rem] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              Ask MindVault
              <ArrowRight aria-hidden className="size-3" />
            </Link>
          </div>
          <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
            {hasNotes
              ? "Patterns and recommendations will surface here as your vault grows."
              : "Useful summaries and recommendations will appear once your vault grows."}
          </p>
          <p className="mt-2 text-[0.75rem] leading-relaxed text-mv-faint">
            AI insights are not live yet — this area is ready for when they ship.
          </p>
        </div>
      </div>
    </ContentCard>
  );
}
