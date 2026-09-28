"use client";

import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { Fragment } from "react";

import {
  howItWorksCopy,
  howItWorksSteps,
} from "@/lib/marketing/features-content";
import { featuresPageReveal } from "@/lib/marketing/marketing-motion";

const sectionShellClassName =
  "rounded-[1.125rem] border border-white/[0.08] bg-[#0a0a0a] px-6 py-10 sm:px-8 sm:py-12 lg:px-12 lg:py-14";

export function HowItWorksSection() {
  const reduceMotion = useReducedMotion();

  return (
    <motion.section
      aria-labelledby="how-it-works-heading"
      className={sectionShellClassName}
      variants={featuresPageReveal}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      custom={reduceMotion}
    >
      <header className="mx-auto max-w-2xl text-center">
        <h2
          id="how-it-works-heading"
          className="font-editorial text-[1.5rem] leading-[1.15] font-normal tracking-[-0.02em] text-white sm:text-[1.75rem] lg:text-[2rem]"
        >
          {howItWorksCopy.headline}
        </h2>
        <p className="mt-3 text-[0.875rem] leading-relaxed text-white/45 sm:text-[0.9375rem]">
          {howItWorksCopy.subhead}
        </p>
      </header>

      <div className="mt-10 flex flex-col items-stretch gap-10 lg:mt-12 lg:flex-row lg:items-start lg:justify-between lg:gap-3">
        {howItWorksSteps.map((step, index) => {
          const Icon = step.icon;
          const isLast = index === howItWorksSteps.length - 1;

          return (
            <Fragment key={step.step}>
              <div className="flex flex-1 flex-col items-center text-center lg:max-w-[13rem]">
                <div
                  aria-hidden
                  className="flex size-14 items-center justify-center rounded-full border border-white/10 bg-black/50 text-white/85 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                >
                  <Icon className="size-5" strokeWidth={1.65} />
                </div>
                <p className="mt-4 text-[0.9375rem] font-semibold text-white">
                  {step.step}. {step.title}
                </p>
                <p className="mt-2 text-[0.8125rem] leading-relaxed text-white/45 sm:text-[0.875rem]">
                  {step.description}
                </p>
              </div>
              {!isLast ? (
                <ArrowRight
                  aria-hidden
                  className="mx-auto size-4 shrink-0 rotate-90 text-white/25 lg:mx-0 lg:mt-5 lg:rotate-0"
                />
              ) : null}
            </Fragment>
          );
        })}
      </div>
    </motion.section>
  );
}
