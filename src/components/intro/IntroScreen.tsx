"use client";

import { IntroFlow } from "./IntroFlow";

/** @deprecated Prefer `/onboarding/1` — kept for compatibility. */
export function IntroScreen() {
  return <IntroFlow stepIndex={0} />;
}
