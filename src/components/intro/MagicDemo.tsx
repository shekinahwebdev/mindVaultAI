"use client";

import { motion } from "framer-motion";

import { introEase } from "./intro-motion";
import {
  magicPasteText,
  magicResult,
  magicSteps,
  magicTimings,
} from "./magic-demo";

type MagicDemoProps = {
  instant: boolean;
};

const stepClass = [
  "magic-step-paste",
  "magic-step-analyze",
  "magic-step-understand",
  "magic-step-organize",
] as const;

export function MagicDemo({ instant }: MagicDemoProps) {
  return (
    <div
      className={`magic-demo mt-5 flex w-full max-w-[28rem] flex-col items-center sm:mt-6 ${
        instant ? "magic-demo-instant" : ""
      }`}
    >
      <motion.div
        className="relative w-full overflow-hidden rounded-2xl border border-white/12 bg-white/[0.035] text-left shadow-[0_16px_40px_rgba(0,0,0,0.38)] backdrop-blur-[2px]"
        initial={instant ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: instant ? 0 : 0.7,
          delay: instant ? 0 : magicTimings.box,
          ease: introEase,
        }}
      >
        <div className="relative min-h-[10.75rem] sm:min-h-[11rem]">
          <div className="magic-capture-layer px-4 py-3.5 sm:px-5 sm:py-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[0.62rem] tracking-[0.18em] text-white/38 uppercase">
                Paste
              </p>
              <div
                aria-hidden
                className="magic-analyze-chip inline-flex items-center gap-1.5 rounded-full border border-white/16 px-2.5 py-1 text-[0.62rem] tracking-[0.16em] text-white/42 uppercase"
              >
                Analyze
                <span>✦</span>
              </div>
            </div>
            <p className="relative mt-3 min-h-[5.25rem] text-[0.95rem] leading-[1.65] text-white/78 sm:min-h-[5rem] sm:text-[1rem]">
              <span className="magic-paste-text">{magicPasteText}</span>
              {instant ? null : (
                <span
                  aria-hidden
                  className="magic-caret ml-0.5 inline-block h-[1.05em] w-px translate-y-0.5 bg-white/80 align-middle"
                />
              )}
              <span
                aria-hidden
                className="magic-scan pointer-events-none absolute inset-x-0 top-0 h-10 bg-[linear-gradient(180deg,transparent,rgba(255,255,255,0.12),transparent)]"
              />
            </p>
          </div>

          <div
            className={`magic-result-layer px-4 py-3.5 sm:px-5 sm:py-4 ${
              instant ? "" : "pointer-events-none absolute inset-0 opacity-0"
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5">
              <p className="text-[0.62rem] tracking-[0.18em] text-white/42 uppercase">
                {magicResult.type}
              </p>
              <p className="text-[0.62rem] tracking-[0.16em] text-white/42 uppercase">
                {magicResult.category}
              </p>
            </div>
            <p className="font-editorial mt-3 text-[1.28rem] leading-snug text-brand-ink italic sm:text-[1.42rem]">
              {magicResult.title}
            </p>
            <ul className="mt-3 flex flex-wrap gap-1.5">
              {magicResult.tags.map((tag) => (
                <li
                  key={tag}
                  className="rounded-full border border-white/12 px-2.5 py-1 text-[0.68rem] tracking-[0.08em] text-white/70"
                >
                  {tag}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </motion.div>

      <ol className="mt-4 flex w-full flex-wrap items-center justify-center gap-x-2 gap-y-2 sm:mt-5 sm:gap-x-3">
        {magicSteps.map((step, index) => (
          <li key={step.id} className="flex items-center gap-2 sm:gap-3">
            {index > 0 ? (
              <span
                aria-hidden
                className={`magic-step-rule magic-step-rule-${index + 1} hidden h-px w-5 bg-white/10 sm:block`}
              />
            ) : null}
            <span
              className={`magic-step ${stepClass[index]} text-[0.62rem] tracking-[0.18em] text-white/28 uppercase sm:text-[0.68rem] ${
                index === 0 ? "text-white" : ""
              }`}
            >
              {step.label}
            </span>
          </li>
        ))}
      </ol>
    </div>
  );
}
