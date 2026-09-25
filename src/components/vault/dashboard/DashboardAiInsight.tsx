import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";

import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import {
  dashboardInsightPanelClassName,
  dashboardPanelPaddingClassName,
} from "./dashboard-ui";

type DashboardAiInsightProps = {
  hasNotes: boolean;
};

export function DashboardAiInsight({ hasNotes }: DashboardAiInsightProps) {
  return (
    <section
      className={cn(dashboardInsightPanelClassName, dashboardPanelPaddingClassName)}
    >
      <div className="relative flex items-start gap-2.5">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-[8px] border border-border bg-mv-panel text-foreground">
          <Sparkles aria-hidden className="size-3.5 stroke-[1.6]" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-[0.875rem] font-semibold tracking-[-0.01em] text-foreground">
            Vault Intelligence
          </h2>
          <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
            {hasNotes
              ? "You've been building your knowledge vault. As it grows, MindVault will surface connections, patterns, summaries, and useful recommendations here."
              : "Once your vault grows, MindVault will surface useful patterns, summaries, and recommendations here."}
          </p>
          <p className="mt-1 text-[0.75rem] text-mv-faint">
            AI insights are not live yet — this area is ready for when they ship.
          </p>
          <Link
            href={vaultRoutes.chat}
            className="mt-2.5 inline-flex items-center gap-1.5 text-[0.8125rem] font-medium text-foreground transition-colors duration-200 hover:text-foreground/80"
          >
            Explore chat
            <ArrowRight aria-hidden className="size-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
