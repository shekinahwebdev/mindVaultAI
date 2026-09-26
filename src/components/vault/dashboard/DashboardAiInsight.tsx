import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { dashboardInsightPanelClassName } from "./dashboard-ui";

type DashboardAiInsightProps = {
  hasNotes: boolean;
  className?: string;
};

export function DashboardAiInsight({ hasNotes, className }: DashboardAiInsightProps) {
  return (
    <section
      className={cn(
        dashboardInsightPanelClassName,
        "px-3 py-3 sm:px-4",
        className,
      )}
    >
      <div className="relative flex flex-col gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className="flex size-9 shrink-0 items-center justify-center rounded-[8px] border border-border bg-mv-panel text-foreground">
            <Sparkles aria-hidden className="size-4 stroke-[1.6]" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <h2 className="text-[0.875rem] font-semibold tracking-[-0.01em] text-foreground">
                Vault Intelligence
              </h2>
              <Link
                href={vaultRoutes.chat}
                className="inline-flex shrink-0 items-center gap-1.5 text-[0.8125rem] font-medium text-foreground transition-colors hover:text-foreground/80"
              >
                Explore chat
                <ArrowRight aria-hidden className="size-3.5" />
              </Link>
            </div>
            <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted-foreground">
              {hasNotes
                ? "Patterns and recommendations will surface here as your vault grows."
                : "Useful summaries and recommendations will appear once your vault grows."}
            </p>
          </div>
        </div>
      </div>
      <p className="relative mt-1 text-[0.75rem] text-mv-faint pl-12">
        AI insights are not live yet — this area is ready for when they ship.
      </p>
    </section>
  );
}
