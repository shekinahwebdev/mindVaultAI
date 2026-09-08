import { Sparkles } from "lucide-react";

type DashboardAiInsightProps = {
  hasNotes: boolean;
};

export function DashboardAiInsight({ hasNotes }: DashboardAiInsightProps) {
  return (
    <section className="rounded-2xl border border-white/[0.08] bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.2)]">
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/[0.03] text-white/55">
          <Sparkles aria-hidden className="size-4" />
        </div>
        <div>
          <h2 className="text-[0.92rem] text-white/88">AI Insight</h2>
          <p className="mt-2 text-[0.84rem] leading-relaxed text-white/45">
            {hasNotes
              ? "Once your vault grows, MindVault will surface useful patterns here. AI insights are coming later."
              : "Once your vault grows, MindVault will surface useful patterns here."}
          </p>
        </div>
      </div>
    </section>
  );
}
