"use client";

import Link from "next/link";
import { Check } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { marketingRoutes } from "@/lib/marketing/landing-content";
import type { BillingInterval, PricingPlan } from "@/lib/marketing/pricing-content";
import {
  billingPeriodLabel,
  formatPlanPrice,
  planPriceForInterval,
} from "@/lib/marketing/pricing-content";
import { featuresGridItem } from "@/lib/marketing/marketing-motion";
import { cn } from "@/lib/utils";

type PricingPlanCardProps = {
  plan: PricingPlan;
  interval: BillingInterval;
};

function planCtaHref(planId: PricingPlan["id"]): string {
  if (planId === "team") return `mailto:${encodeURIComponent("hello@mindvault.app")}?subject=MindVault%20Team`;
  if (planId === "pro") return marketingRoutes.createAccount;
  return marketingRoutes.getStarted;
}

export function PricingPlanCard({ plan, interval }: PricingPlanCardProps) {
  const reduceMotion = useReducedMotion();
  const price = planPriceForInterval(plan.monthlyPrice, interval);
  const highlighted = plan.highlighted;

  return (
    <motion.li
      variants={featuresGridItem}
      custom={reduceMotion}
      className={cn("min-w-0 list-none", highlighted && "lg:-mt-1 lg:mb-1")}
    >
      <article
        className={cn(
          "relative flex h-full flex-col rounded-[0.875rem] border p-6 sm:p-7",
          highlighted
            ? "border-white/20 bg-white/[0.06] shadow-[0_0_0_1px_rgba(255,255,255,0.06)_inset,0_24px_80px_rgba(0,0,0,0.45)]"
            : "border-white/[0.08] bg-white/[0.03]",
        )}
      >
        {plan.badge ? (
          <span className="absolute top-5 right-5 rounded-md border border-white/10 bg-black/40 px-2 py-0.5 text-[0.625rem] font-medium tracking-wide text-white/50 uppercase">
            {plan.badge}
          </span>
        ) : null}

        <div className="pr-16">
          <h2 className="text-[1.0625rem] font-semibold tracking-[-0.01em] text-white sm:text-[1.125rem]">
            {plan.name}
          </h2>
          <p className="mt-1.5 text-[0.8125rem] leading-relaxed text-white/45 sm:text-[0.875rem]">
            {plan.description}
          </p>
        </div>

        <p className="mt-6 flex items-baseline gap-1.5">
          <span className="text-[2rem] font-semibold tracking-[-0.03em] text-white sm:text-[2.25rem]">
            {formatPlanPrice(price)}
          </span>
          <span className="text-[0.8125rem] text-white/40">{billingPeriodLabel(interval)}</span>
        </p>

        <ul className="mt-6 flex flex-1 flex-col gap-3 border-t border-white/[0.06] pt-6">
          {plan.features.map((feature) => (
            <li key={feature} className="flex items-start gap-2.5 text-[0.8125rem] text-white/70 sm:text-[0.875rem]">
              <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-white/55" strokeWidth={2} />
              <span>{feature}</span>
            </li>
          ))}
        </ul>

        <Link
          href={planCtaHref(plan.id)}
          className={cn(
            "mt-8 flex min-h-11 w-full items-center justify-center rounded-[var(--landing-button-radius,0.5rem)] text-[0.875rem] font-medium transition-colors",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
            plan.ctaVariant === "primary"
              ? "bg-white text-black hover:bg-white/92"
              : "border border-white/20 bg-transparent text-white hover:border-white/35 hover:bg-white/[0.04]",
          )}
        >
          {plan.ctaLabel}
        </Link>
      </article>
    </motion.li>
  );
}
