export const introSteps = [
  { id: "identity", title: "Identity" },
  { id: "problem", title: "The Problem" },
  { id: "magic", title: "The Magic" },
  { id: "remember", title: "Remember" },
] as const;

export type IntroStepId = (typeof introSteps)[number]["id"];
export type IntroStepIndex = number;

export const INTRO_STEP_COUNT = introSteps.length;

export function isIntroStepIndex(index: number) {
  return index >= 0 && index < INTRO_STEP_COUNT;
}
