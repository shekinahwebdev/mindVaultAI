"use client";

import { ChevronDown, CircleHelp } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useState } from "react";

import type { PricingFaqItem } from "@/lib/marketing/pricing-content";
import { pricingFaqs, pricingPageCopy } from "@/lib/marketing/pricing-content";
import { featuresPageReveal } from "@/lib/marketing/marketing-motion";
import { cn } from "@/lib/utils";

export function PricingFaq() {
  const reduceMotion = useReducedMotion();
  const [openId, setOpenId] = useState<string | null>(pricingFaqs[0]?.id ?? null);

  return (
    <section
      aria-labelledby="pricing-faq-heading"
      className="mx-auto max-w-3xl px-[var(--mv-page-padding-x)] pt-16 sm:pt-20 lg:pt-24"
    >
      <motion.header
        className="text-center"
        variants={featuresPageReveal}
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-40px" }}
        custom={reduceMotion}
      >
        <h2
          id="pricing-faq-heading"
          className="font-editorial text-[1.5rem] leading-[1.15] font-normal tracking-[-0.02em] text-white sm:text-[1.75rem]"
        >
          {pricingPageCopy.faqHeadline}
        </h2>
        <p className="mx-auto mt-3 max-w-md text-[0.875rem] leading-relaxed text-white/45">
          {pricingPageCopy.faqSubhead}
        </p>
      </motion.header>

      <ul className="mt-8 list-none space-y-3 sm:mt-10">
        {pricingFaqs.map((item) => (
          <FaqRow
            key={item.id}
            item={item}
            open={openId === item.id}
            onToggle={() => setOpenId((current) => (current === item.id ? null : item.id))}
          />
        ))}
      </ul>
    </section>
  );
}

type FaqRowProps = {
  item: PricingFaqItem;
  open: boolean;
  onToggle: () => void;
};

function FaqRow({ item, open, onToggle }: FaqRowProps) {
  return (
    <li>
      <div
        className={cn(
          "overflow-hidden rounded-[0.875rem] border border-white/[0.08] bg-white/[0.03]",
          open && "border-white/[0.12] bg-white/[0.045]",
        )}
      >
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          className={cn(
            "flex w-full items-center gap-3 px-4 py-4 text-left sm:gap-4 sm:px-5 sm:py-5",
            "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white/30",
          )}
        >
          <span
            aria-hidden
            className="flex size-9 shrink-0 items-center justify-center rounded-[0.5rem] border border-white/10 bg-black/30 text-white/70"
          >
            <CircleHelp className="size-4" strokeWidth={1.75} />
          </span>
          <span className="flex-1 text-[0.9375rem] font-medium text-white sm:text-[1rem]">
            {item.question}
          </span>
          <ChevronDown
            aria-hidden
            className={cn(
              "size-4 shrink-0 text-white/40 transition-transform duration-300",
              open && "rotate-180",
            )}
          />
        </button>
        {open ? (
          <div className="border-t border-white/[0.06] px-4 pb-4 sm:px-5 sm:pb-5">
            <p className="pt-3 text-[0.8125rem] leading-relaxed text-white/45 sm:text-[0.875rem]">
              {item.answer}
            </p>
          </div>
        ) : null}
      </div>
    </li>
  );
}
