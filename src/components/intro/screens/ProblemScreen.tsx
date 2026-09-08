"use client";

import { motion } from "framer-motion";
import { useEffect, useState } from "react";

import { useIntroInstant } from "../IntroPlayback";
import { IntroNextButton } from "../IntroNextButton";
import { ProblemCard } from "../ProblemCard";
import { introEase, introTransition } from "../intro-motion";
import { problemCards } from "../problem-cards";

type ProblemScreenProps = {
  onNext: () => void;
  disabled?: boolean;
};

type ProblemLayout = "both" | "stack" | "float";

const copy = {
  heading: "You consume more than you remember.",
  supporting:
    "Useful things get scattered across apps, tabs, chats, bookmarks and notes.",
  scattered: "Your knowledge is everywhere.",
  home: "MindVault gives it one home.",
} as const;

function useProblemLayout() {
  const [layout, setLayout] = useState<ProblemLayout>("both");

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setLayout(media.matches ? "float" : "stack");
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return layout;
}

export function ProblemScreen({ onNext, disabled }: ProblemScreenProps) {
  const instant = useIntroInstant();
  const layout = useProblemLayout();
  const showStack = layout === "both" || layout === "stack";
  const showFloat = layout === "both" || layout === "float";

  return (
    <section className="relative flex w-full max-w-5xl flex-col items-center text-center">
      <h1 className="sr-only">The Problem</h1>

      {showStack ? (
        <div
          className={
            layout === "both"
              ? "flex w-full max-w-md flex-col items-center lg:hidden"
              : "flex w-full max-w-md flex-col items-center"
          }
        >
          <ProblemCopy instant={instant} />
          <div className="mt-5 grid w-full grid-cols-2 gap-2.5 sm:mt-6 sm:gap-3">
            {problemCards.slice(0, 4).map((card, index) => (
              <ProblemCard
                key={card.title}
                card={card}
                delay={0.55 + index * 0.1}
                instant={instant}
                layout="stack"
              />
            ))}
            <div className="col-span-2 flex justify-center">
              <ProblemCard
                card={problemCards[4]}
                delay={0.95}
                instant={instant}
                layout="stack"
                stackAlign="center"
              />
            </div>
          </div>
          <ProblemClose instant={instant} compact />
          <IntroNextButton
            onNext={onNext}
            immediate
            appearDelay={instant ? 0 : 3.55}
            disabled={disabled}
            compact
          />
        </div>
      ) : null}

      {showFloat ? (
        <div
          className={
            layout === "both" ? "hidden w-full lg:block" : "w-full"
          }
        >
          <div className="relative mx-auto min-h-[20rem] w-full max-w-5xl lg:min-h-[22rem]">
            {problemCards.map((card, index) => (
              <ProblemCard
                key={card.title}
                card={card}
                delay={0.55 + index * 0.12}
                instant={instant}
                layout="float"
              />
            ))}
            <div className="absolute inset-x-[16%] top-[10%] flex flex-col items-center xl:inset-x-[20%]">
              <ProblemCopy instant={instant} />
            </div>
          </div>
          <ProblemClose instant={instant} compact />
          <div className="flex justify-center">
            <IntroNextButton
              onNext={onNext}
              immediate
              appearDelay={instant ? 0 : 3.55}
              disabled={disabled}
              compact
            />
          </div>
        </div>
      ) : null}
    </section>
  );
}

function ProblemCopy({ instant }: { instant: boolean }) {
  return (
    <div className="flex max-w-[28rem] flex-col items-center px-1">
      <motion.p
        className="font-editorial text-[1.35rem] leading-[1.4] text-pretty text-brand-ink italic sm:text-[1.6rem] lg:text-[1.75rem]"
        initial={instant ? false : { opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={introTransition({ duration: 0.7, delay: 0.12 }, instant, {
          ease: introEase,
        })}
      >
        {copy.heading}
      </motion.p>
      <motion.p
        className="mt-3 max-w-[24rem] text-[0.86rem] leading-[1.65] text-pretty text-white/46 sm:text-[0.92rem]"
        initial={instant ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={introTransition({ duration: 0.7, delay: 0.38 }, instant)}
      >
        {copy.supporting}
      </motion.p>
    </div>
  );
}

function ProblemClose({
  instant,
  compact = false,
}: {
  instant: boolean;
  compact?: boolean;
}) {
  return (
    <div
      className={`mx-auto flex w-full max-w-md flex-col items-center ${
        compact ? "mt-4 sm:mt-5" : "mt-10 sm:mt-12"
      }`}
    >
      <motion.p
        className="font-editorial text-[1.02rem] text-white/78 italic sm:text-[1.08rem]"
        initial={instant ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={introTransition({ duration: 0.7, delay: 2.05 }, instant)}
      >
        {copy.scattered}
      </motion.p>
      <motion.p
        className="font-editorial mt-2 text-[1.02rem] text-brand-ink italic sm:text-[1.08rem]"
        initial={instant ? false : { opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={introTransition({ duration: 0.75, delay: 3.05 }, instant)}
      >
        {copy.home}
      </motion.p>
    </div>
  );
}
