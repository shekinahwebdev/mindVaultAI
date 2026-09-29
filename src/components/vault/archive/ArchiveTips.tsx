"use client";

import { Check, Lightbulb } from "lucide-react";

import { mvContentCardClassName } from "@/lib/mv/layout-tokens";
import { cn } from "@/lib/utils";

const TIPS = [
  "Archived notes are hidden from your main views.",
  "You can restore them anytime.",
  "Use archive to keep your workspace clean.",
  "Archived items still count towards your storage.",
] as const;

export function ArchiveTips() {
  return (
    <section className={cn(mvContentCardClassName, "p-4 sm:p-5")}>
      <header className="flex items-center gap-2">
        <Lightbulb aria-hidden className="size-4 text-amber-500/85" />
        <h2 className="text-[0.8125rem] font-semibold tracking-[-0.01em] text-foreground">
          Archive Tips
        </h2>
      </header>
      <ul className="mt-4 space-y-2.5">
        {TIPS.map((tip) => (
          <li key={tip} className="flex gap-2.5 text-[0.8125rem] leading-relaxed text-muted-foreground">
            <Check aria-hidden className="mt-0.5 size-3.5 shrink-0 text-foreground/70" />
            <span>{tip}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
