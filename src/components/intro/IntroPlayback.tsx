"use client";

import { useReducedMotion } from "framer-motion";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

const IntroPlaybackContext = createContext({ skipEntrance: false });

export function IntroPlaybackProvider({
  skipEntrance,
  children,
}: {
  skipEntrance: boolean;
  children: ReactNode;
}) {
  return (
    <IntroPlaybackContext.Provider value={{ skipEntrance }}>
      {children}
    </IntroPlaybackContext.Provider>
  );
}

export function useSkipIntroEntrance() {
  return useContext(IntroPlaybackContext).skipEntrance;
}

function useInstant(skipEntrance: boolean) {
  const reduceMotion = useReducedMotion();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return skipEntrance || (mounted && reduceMotion === true);
}

export function useIntroInstant() {
  const skipEntrance = useSkipIntroEntrance();
  return useInstant(skipEntrance);
}

/**
 * Screen 1's own staged entrance ignores the shared "already seen" skip
 * flag: it should replay every time it is genuinely (re)mounted (fresh
 * load, or navigating Back into it), not just once per session.
 */
export function useIdentityIntroInstant() {
  return useInstant(false);
}
