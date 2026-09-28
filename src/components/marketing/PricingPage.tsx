"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import type { BillingInterval } from "@/lib/marketing/pricing-content";
import { pricingPageCopy, pricingPlans } from "@/lib/marketing/pricing-content";
import {
  featuresGridContainer,
  featuresPageReveal,
} from "@/lib/marketing/marketing-motion";
import { cn } from "@/lib/utils";

import { MarketingHeader } from "./MarketingHeader";
import { PricingBillingToggle } from "./PricingBillingToggle";
import { PricingFaq } from "./PricingFaq";
import { PricingPlanCard } from "./PricingPlanCard";

export function PricingPage() {
  const reduceMotion = useReducedMotion();
  const [interval, setInterval] = useState<BillingInterval>("monthly");

  return (
    <div className="landing-page relative min-h-svh overflow-x-hidden bg-black text-white">
      <MarketingHeader primaryCtaLabel="Get Started" />

      <main id="main-content" className="relative z-10 pb-16 pt-2 sm:pb-20">
        <motion.header
          className="mx-auto max-w-3xl px-[var(--mv-page-padding-x)] pt-12 text-center sm:pt-14 lg:pt-16"
          variants={featuresPageReveal}
          initial="hidden"
          animate="show"
          custom={reduceMotion}
        >
          <p className="inline-flex rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1 text-[0.65rem] font-medium tracking-[0.22em] text-white/55 uppercase">
            {pricingPageCopy.eyebrow}
          </p>
          <h1
            className={cn(
              "font-editorial mt-6 text-balance text-[1.85rem] leading-[1.12] font-normal tracking-[-0.02em] text-white",
              "sm:text-[2.25rem] lg:text-[2.65rem]",
            )}
          >
            {pricingPageCopy.headline}
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-[0.875rem] leading-relaxed text-white/45 sm:text-[0.9375rem] lg:mt-6">
            {pricingPageCopy.subhead}
          </p>

          <div className="mt-8 flex justify-center sm:mt-10">
            <PricingBillingToggle value={interval} onChange={setInterval} />
          </div>
        </motion.header>

        <motion.ul
          className="mx-auto mt-10 grid max-w-6xl list-none grid-cols-1 gap-5 px-[var(--mv-page-padding-x)] sm:mt-12 lg:grid-cols-3 lg:items-stretch lg:gap-5 lg:px-[max(2.5rem,6vw)]"
          variants={featuresGridContainer}
          initial="hidden"
          animate="show"
          custom={reduceMotion}
          key={interval}
        >
          {pricingPlans.map((plan) => (
            <PricingPlanCard key={plan.id} plan={plan} interval={interval} />
          ))}
        </motion.ul>

        <PricingFaq />
      </main>
    </div>
  );
}
