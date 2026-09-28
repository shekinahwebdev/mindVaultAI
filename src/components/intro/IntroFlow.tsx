"use client";

import { AnimatePresence, useReducedMotion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";

import { IntroAtmosphere } from "./IntroAtmosphere";
import { IntroBackButton } from "./IntroBackButton";
import { IntroPlaybackProvider } from "./IntroPlayback";
import { IntroProgress } from "./IntroProgress";
import {
  INTRO_STEP_COUNT,
  introSteps,
  introStepNumberFromIndex,
  isIntroStepIndex,
  onboardingStepPath,
} from "./intro-flow";
import { IdentityScreen } from "./screens/IdentityScreen";
import { MagicScreen } from "./screens/MagicScreen";
import { ProblemScreen } from "./screens/ProblemScreen";
import { RememberScreen } from "./screens/RememberScreen";

type IntroFlowProps = {
  stepIndex: number;
};

export function IntroFlow({ stepIndex }: IntroFlowProps) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const prevIndexRef = useRef(stepIndex);
  const [direction, setDirection] = useState(1);
  const [locked, setLocked] = useState(false);
  const [hasStepped, setHasStepped] = useState(stepIndex > 0);
  const lockedRef = useRef(false);

  const index = stepIndex;

  useEffect(() => {
    const previous = prevIndexRef.current;
    if (previous !== index) {
      setDirection(index > previous ? 1 : -1);
      setHasStepped(true);
      prevIndexRef.current = index;
    }
  }, [index]);

  const goTo = useCallback(
    (next: number) => {
      if (lockedRef.current || next === index || !isIntroStepIndex(next)) {
        return;
      }

      lockedRef.current = true;
      setHasStepped(true);
      setDirection(next > index ? 1 : -1);
      setLocked(true);
      router.push(onboardingStepPath(introStepNumberFromIndex(next)), { scroll: false });
    },
    [index, router],
  );

  const goNext = useCallback(() => {
    goTo(index + 1);
  }, [goTo, index]);

  const goBack = useCallback(() => {
    goTo(index - 1);
  }, [goTo, index]);

  useEffect(() => {
    if (!locked) {
      return;
    }

    const timeout = window.setTimeout(() => {
      lockedRef.current = false;
      setLocked(false);
    }, 700);

    return () => window.clearTimeout(timeout);
  }, [index, locked]);

  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.repeat) {
        return;
      }

      if (event.key === "ArrowRight" && index < INTRO_STEP_COUNT - 1) {
        goNext();
      }

      if (event.key === "ArrowLeft" && index > 0) {
        goBack();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goBack, goNext, index]);

  const step = introSteps[index];
  const identitySeen = index > 0;

  return (
    <main className="relative flex min-h-svh flex-col items-center justify-center overflow-x-hidden overflow-y-auto bg-brand-void px-6 pt-16 pb-20 sm:px-8 sm:pt-16 sm:pb-24">
      <IntroAtmosphere />

      <div className="absolute top-5 left-5 z-20 sm:top-8 sm:left-8">
        <AnimatePresence>
          {index > 0 ? (
            <IntroBackButton key="intro-back" onBack={goBack} disabled={locked} />
          ) : null}
        </AnimatePresence>
      </div>

      <div className="relative flex w-full flex-1 items-center justify-center">
        <div
          key={step.id}
          className={`flex w-full items-center justify-center ${
            reduceMotion || !hasStepped
              ? ""
              : direction < 0
                ? "intro-step-enter-back"
                : "intro-step-enter-next"
          }`}
        >
          <IntroPlaybackProvider skipEntrance={identitySeen}>
            {index === 0 ? (
              <IdentityScreen onNext={goNext} disabled={locked} />
            ) : null}
            {index === 1 ? (
              <ProblemScreen onNext={goNext} disabled={locked} />
            ) : null}
            {index === 2 ? (
              <MagicScreen onNext={goNext} disabled={locked} />
            ) : null}
            {index === 3 ? <RememberScreen /> : null}
          </IntroPlaybackProvider>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-7 z-20 flex justify-center sm:bottom-9">
        <IntroProgress current={index} />
      </div>
    </main>
  );
}
