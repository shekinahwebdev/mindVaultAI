"use client";

import { motion } from "framer-motion";
import { Search } from "lucide-react";

import { introEase } from "./intro-motion";
import {
  rememberAnswer,
  rememberQuery,
  rememberSources,
  rememberTimings,
} from "./remember-demo";

type RememberDemoProps = {
  instant: boolean;
};

export function RememberDemo({ instant }: RememberDemoProps) {
  return (
    <div
      className={`remember-demo mt-5 flex w-full max-w-[28rem] flex-col items-center sm:mt-6 ${
        instant ? "remember-demo-instant" : ""
      }`}
    >
      <motion.div
        className="relative w-full overflow-hidden rounded-2xl border border-white/12 bg-white/[0.035] text-left shadow-[0_16px_40px_rgba(0,0,0,0.38)] backdrop-blur-[2px]"
        initial={instant ? false : { opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{
          duration: instant ? 0 : 0.7,
          delay: instant ? 0 : rememberTimings.box,
          ease: introEase,
        }}
      >
        <div className="flex items-center gap-3 px-4 py-3 sm:px-5 sm:py-3.5">
          <Search
            aria-hidden
            className="remember-search-icon size-4 shrink-0 text-white/45"
          />
          <p className="min-h-[1.5rem] text-[0.92rem] leading-snug text-white/82 sm:text-[0.98rem]">
            <span className="remember-query-text">{rememberQuery}</span>
            {instant ? null : (
              <span
                aria-hidden
                className="remember-caret ml-0.5 inline-block h-[1.05em] w-px translate-y-0.5 bg-white/80 align-middle"
              />
            )}
          </p>
        </div>
      </motion.div>

      <p className="remember-answer font-editorial mt-4 max-w-[22rem] text-[1.02rem] leading-snug text-brand-ink italic sm:mt-5 sm:text-[1.08rem]">
        {rememberAnswer}
      </p>

      <ul className="mt-4 grid w-full grid-cols-1 gap-2 sm:grid-cols-3 sm:gap-2">
        {rememberSources.map((card, index) => (
          <li
            key={card.title}
            className={`remember-source remember-source-${index + 1} rounded-xl border border-white/12 bg-white/[0.03] px-3 py-2 text-left`}
          >
            <p className="text-[0.58rem] tracking-[0.16em] text-white/40 uppercase">
              {card.source}
            </p>
            <p className="mt-1 text-[0.8rem] leading-snug text-white/84">
              {card.title}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
