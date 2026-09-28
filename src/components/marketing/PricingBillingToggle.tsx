"use client";

import type { BillingInterval } from "@/lib/marketing/pricing-content";
import { pricingPageCopy } from "@/lib/marketing/pricing-content";
import { cn } from "@/lib/utils";

type PricingBillingToggleProps = {
  value: BillingInterval;
  onChange: (value: BillingInterval) => void;
};

export function PricingBillingToggle({ value, onChange }: PricingBillingToggleProps) {
  return (
    <div
      role="group"
      aria-label="Billing interval"
      className="inline-flex items-center gap-1 rounded-full border border-white/10 bg-white/[0.04] p-1"
    >
      <button
        type="button"
        onClick={() => onChange("monthly")}
        className={cn(
          "min-h-9 rounded-full px-5 text-[0.8125rem] font-medium transition-colors sm:px-6 sm:text-[0.875rem]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          value === "monthly" ? "bg-white text-black" : "text-white/55 hover:text-white/80",
        )}
        aria-pressed={value === "monthly"}
      >
        Monthly
      </button>
      <button
        type="button"
        onClick={() => onChange("yearly")}
        className={cn(
          "inline-flex min-h-9 items-center gap-2 rounded-full px-4 text-[0.8125rem] font-medium transition-colors sm:px-5 sm:text-[0.875rem]",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
          value === "yearly" ? "bg-white text-black" : "text-white/55 hover:text-white/80",
        )}
        aria-pressed={value === "yearly"}
      >
        Yearly
        <span
          className={cn(
            "rounded-md border px-1.5 py-0.5 text-[0.625rem] font-medium tracking-wide uppercase",
            value === "yearly"
              ? "border-black/15 bg-black/10 text-black/70"
              : "border-white/10 bg-white/[0.06] text-white/45",
          )}
        >
          {pricingPageCopy.yearlySaveLabel}
        </span>
      </button>
    </div>
  );
}
