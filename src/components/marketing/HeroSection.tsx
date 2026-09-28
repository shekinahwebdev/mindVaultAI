import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { brand } from "@/lib/brand";
import { marketingRoutes } from "@/lib/marketing/landing-content";
import { cn } from "@/lib/utils";

export function HeroSection() {
  return (
    <section aria-labelledby="marketing-hero-heading" className="marketing-hero-in w-full max-w-xl">
      <h1
        id="marketing-hero-heading"
        className={cn(
          "font-editorial text-[2.35rem] leading-[1.06] font-normal tracking-[-0.02em] text-white",
          "sm:text-[2.85rem] lg:text-[3.35rem] xl:text-[3.65rem]",
        )}
      >
        {brand.tagline}
      </h1>

      <p className="mt-5 max-w-md text-pretty text-[0.9375rem] leading-relaxed text-white/50 sm:text-[1rem] lg:mt-6 lg:text-[1.0625rem]">
        {brand.supporting}
      </p>

      <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center lg:mt-10">
        <Link href={marketingRoutes.getStarted} className="landing-pill-primary min-h-11 px-6 text-[0.9375rem]">
          Get Started
          <ArrowRight aria-hidden className="size-4" />
        </Link>
        <Link href={marketingRoutes.features} className="landing-pill-muted min-h-11 px-6 text-[0.9375rem]">
          Learn More
        </Link>
      </div>
    </section>
  );
}
