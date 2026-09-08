"use client";

import { AnimatePresence, useReducedMotion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import { IntroAtmosphere } from "./IntroAtmosphere";
import { IntroBackButton } from "./IntroBackButton";
import { IntroPlaybackProvider } from "./IntroPlayback";
import { IntroProgress } from "./IntroProgress";
import { INTRO_STEP_COUNT, introSteps, isIntroStepIndex } from "./intro-flow";
import { IdentityScreen } from "./screens/IdentityScreen";
import { MagicScreen } from "./screens/MagicScreen";
import { ProblemScreen } from "./screens/ProblemScreen";
import { RememberScreen } from "./screens/RememberScreen";

export function IntroFlow() {
  const reduceMotion = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState(1);
  const [identitySeen, setIdentitySeen] = useState(false);
  const [locked, setLocked] = useState(false);
  const [hasStepped, setHasStepped] = useState(false);
  const lockedRef = useRef(false);

  const goTo = useCallback((next: number) => {
    if (lockedRef.current || next === index || !isIntroStepIndex(next)) {
      return;
    }

    if (index === 0) {
      setIdentitySeen(true);
    }

    lockedRef.current = true;
    setHasStepped(true);
    setDirection(next > index ? 1 : -1);
    setLocked(true);
    setIndex(next);
  }, [index]);

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

      if (event.key === "ArrowLeft") {
        goBack();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goBack, goNext]);

  const step = introSteps[index];

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
