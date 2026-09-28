"use client";

import { motion, useReducedMotion } from "framer-motion";

import {
  featuresOverviewCopy,
  featuresOverviewHighlights,
} from "@/lib/marketing/features-content";
import {
  featuresGridContainer,
  featuresPageReveal,
} from "@/lib/marketing/marketing-motion";
import { cn } from "@/lib/utils";

import { FeatureCard } from "./FeatureCard";
import { HowItWorksSection } from "./HowItWorksSection";
import { MarketingHeader } from "./MarketingHeader";

const sectionShellClassName =
  "rounded-[1.125rem] border border-white/[0.08] bg-[#0a0a0a] px-6 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14";

export function FeaturesOverviewPage() {
  const reduceMotion = useReducedMotion();

  return (
    <div className="landing-page relative min-h-svh overflow-x-hidden bg-black text-white">
      <MarketingHeader primaryCtaLabel="Get Started" />

      <main
        id="main-content"
        className="relative z-10 mx-auto max-w-6xl space-y-6 px-[var(--mv-page-padding-x)] py-10 sm:space-y-8 sm:py-12 lg:px-[max(2.5rem,6vw)] lg:py-14"
      >
        <motion.section
          aria-labelledby="features-overview-heading"
          className={sectionShellClassName}
          variants={featuresPageReveal}
          initial="hidden"
          animate="show"
          custom={reduceMotion}
        >
          <header className="mx-auto max-w-3xl text-center">
            <h1
              id="features-overview-heading"
              className={cn(
                "font-editorial text-balance text-[1.65rem] leading-[1.12] font-normal tracking-[-0.02em] text-white",
                "sm:text-[2rem] lg:text-[2.35rem]",
              )}
            >
              {featuresOverviewCopy.headline}
            </h1>
            <p className="mx-auto mt-4 max-w-2xl text-pretty text-[0.875rem] leading-relaxed text-white/45 sm:mt-5 sm:text-[0.9375rem]">
              {featuresOverviewCopy.subhead}
            </p>
          </header>

          <motion.ul
            className="mt-10 grid list-none grid-cols-1 gap-4 sm:mt-12 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3"
            variants={featuresGridContainer}
            initial="hidden"
            animate="show"
            custom={reduceMotion}
          >
            {featuresOverviewHighlights.map((feature) => (
              <FeatureCard key={feature.title} {...feature} variant="inset" />
            ))}
          </motion.ul>
        </motion.section>

        <HowItWorksSection />
      </main>
    </div>
  );
}
