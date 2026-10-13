import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { brand } from "@/lib/brand";
import { marketingRoutes } from "@/lib/marketing/landing-content";
import { cn } from "@/lib/utils";

import { HangingCards } from "./hanging-cards/HangingCards";

const headlineSplit = brand.tagline.indexOf(" shouldn’t");
const headlineLead = headlineSplit > 0 ? brand.tagline.slice(0, headlineSplit) : brand.tagline;
const headlineRest = headlineSplit > 0 ? brand.tagline.slice(headlineSplit).trim() : "";

const supportingLines = brand.supporting.split(/(?<=\.)\s+/);
const supportingLead = supportingLines.length >= 3 ? `${supportingLines[0]} ${supportingLines[1]}` : brand.supporting;
const supportingRest = supportingLines.length >= 3 ? supportingLines.slice(2).join(" ") : "";

export function HeroSection() {
  return (
    <section aria-labelledby="marketing-hero-heading" className="flex w-full max-w-6xl flex-col items-center">
      <div className="marketing-hero-in mx-auto max-w-3xl text-center">
        <h1
          id="marketing-hero-heading"
          className={cn(
            "font-editorial text-[2.15rem] leading-[1.05] font-normal tracking-[-0.02em] text-white",
            "sm:text-[2.75rem] lg:text-[3.05rem] xl:text-[3.35rem]",
            "[text-shadow:0_10px_40px_rgba(0,0,0,0.45)]",
          )}
        >
          {headlineLead}
          {headlineRest ? (
            <>
              <br />
              {headlineRest}
            </>
          ) : null}
        </h1>

        <p className="mx-auto mt-3 max-w-md text-pretty text-[0.9375rem] leading-relaxed text-white/58 sm:mt-4 sm:text-[0.975rem]">
          {supportingLead}
          {supportingRest ? (
            <>
              {" "}
              <br className="hidden sm:block" />
              {supportingRest}
            </>
          ) : null}
        </p>
      </div>

      <HangingCards />

      <div className="relative z-20 mt-4 flex w-full justify-center sm:mt-5">
        <Link href={marketingRoutes.getStarted} className="landing-pill-primary min-h-11 px-6 text-[0.9375rem]">
          Get Started
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </div>
    </section>
  );
}
