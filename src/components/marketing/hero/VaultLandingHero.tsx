"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";

import { brand } from "@/lib/brand";
import { landingHeroCopy } from "@/lib/marketing/landing-hero-content";
import { marketingTransition } from "@/lib/marketing/marketing-motion";
import { cn } from "@/lib/utils";

import { HeroHumanScene } from "./HeroHumanScene";

const headlineSplit = brand.tagline.indexOf(" shouldn’t");
const headlineLead = headlineSplit > 0 ? brand.tagline.slice(0, headlineSplit) : brand.tagline;
const headlineRest = headlineSplit > 0 ? brand.tagline.slice(headlineSplit).trim() : "";

export function VaultLandingHero() {
  const reduceMotion = useReducedMotion();

  return (
    <section
      aria-labelledby="marketing-hero-heading"
      className="landing-hero-fit relative flex min-h-0 w-full flex-1 flex-col justify-center px-[var(--mv-page-padding-x)] py-6 sm:py-8 lg:px-8 lg:py-5"
    >
      <div className="mx-auto grid w-full max-w-[1280px] items-center gap-8 sm:gap-10 lg:grid-cols-2 lg:gap-10 xl:gap-12">
        <div className="min-w-0 text-center lg:text-left">
          <motion.h1
            id="marketing-hero-heading"
            className={cn(
              "font-editorial text-[2.35rem] leading-[1.06] font-normal tracking-[-0.035em] text-white",
              "sm:text-[3rem] lg:text-[3.15rem] lg:leading-[1.04] xl:text-[3.65rem] 2xl:text-[4rem]",
            )}
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={marketingTransition(reduceMotion, { duration: 0.65 })}
          >
            {headlineLead}
            {headlineRest ? (
              <>
                <br />
                {headlineRest}
              </>
            ) : null}
          </motion.h1>

          <motion.p
            className="mx-auto mt-4 max-w-md text-pretty text-[0.9375rem] leading-[1.6] text-white/58 sm:mt-5 sm:text-[1rem] sm:leading-[1.65] lg:mx-0 lg:max-w-[28rem]"
            initial={reduceMotion ? false : { opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={marketingTransition(reduceMotion, { delay: 0.08, duration: 0.55 })}
          >
            {brand.supporting}
          </motion.p>

          <motion.div
            className="mt-6 flex flex-col items-center justify-center gap-3 sm:mt-7 sm:flex-row lg:justify-start"
            initial={reduceMotion ? false : { opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={marketingTransition(reduceMotion, { delay: 0.14, duration: 0.5 })}
          >
            <Link
              href={landingHeroCopy.primaryCta.href}
              className="group landing-pill-primary landing-pill-primary--polished min-h-11 w-full max-w-xs px-7 sm:w-auto"
            >
              {landingHeroCopy.primaryCta.label}
              <ArrowRight aria-hidden className="size-4 transition-transform group-hover:translate-x-0.5" />
            </Link>
            <Link
              href={landingHeroCopy.secondaryCta.href}
              className="landing-pill-ghost min-h-11 w-full max-w-xs border border-white/20 px-7 sm:w-auto"
            >
              {landingHeroCopy.secondaryCta.label}
            </Link>
          </motion.div>
        </div>

        <div className="flex w-full min-h-0 min-w-0 items-center justify-center lg:justify-self-end">
          <HeroHumanScene />
        </div>
      </div>
    </section>
  );
}
