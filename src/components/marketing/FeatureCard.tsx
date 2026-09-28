"use client";

import { motion, useReducedMotion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

import { featuresGridItem } from "@/lib/marketing/marketing-motion";
import { cn } from "@/lib/utils";

type FeatureCardProps = {
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
  variant?: "default" | "inset";
};

export function FeatureCard({
  title,
  description,
  icon: Icon,
  badge,
  variant = "default",
}: FeatureCardProps) {
  const reduceMotion = useReducedMotion();

  return (
    <motion.li variants={featuresGridItem} custom={reduceMotion} className="min-w-0 list-none">
      <article
        className={cn(
          "h-full rounded-[0.875rem] border p-5 sm:p-6",
          "transition-colors duration-300",
          variant === "inset"
            ? "border-white/[0.06] bg-black/40 hover:border-white/10 hover:bg-black/55"
            : "border-white/[0.08] bg-white/[0.03] hover:border-white/[0.12] hover:bg-white/[0.045]",
        )}
      >
        <div
          aria-hidden
          className="mb-5 flex size-10 items-center justify-center rounded-[0.5rem] border border-white/[0.12] bg-black/40 text-white/90"
        >
          <Icon className="size-[1.125rem]" strokeWidth={1.65} />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="text-[0.9375rem] font-semibold tracking-[-0.01em] text-white sm:text-[1rem]">
            {title}
          </h3>
          {badge ? (
            <span className="rounded-md border border-white/10 bg-white/[0.06] px-1.5 py-0.5 text-[0.625rem] font-medium tracking-wide text-white/45 uppercase">
              {badge}
            </span>
          ) : null}
        </div>
        <p className="mt-2 text-[0.8125rem] leading-relaxed text-white/45 sm:text-[0.875rem]">
          {description}
        </p>
      </article>
    </motion.li>
  );
}
