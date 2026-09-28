export const introSteps = [
  { id: "identity", title: "MindVault", step: 1 },
  { id: "problem", title: "Save what matters", step: 2 },
  { id: "magic", title: "Organize", step: 3 },
  { id: "remember", title: "Find it again", step: 4 },
] as const;

export type IntroStepId = (typeof introSteps)[number]["id"];
export type IntroStepIndex = number;

export const INTRO_STEP_COUNT = introSteps.length;

export function isIntroStepIndex(index: number) {
  return index >= 0 && index < INTRO_STEP_COUNT;
}

export function isIntroStepNumber(step: number) {
  return step >= 1 && step <= INTRO_STEP_COUNT;
}

export function introStepNumberFromParam(param: string): number | null {
  const parsed = Number.parseInt(param, 10);
  if (!Number.isFinite(parsed) || !isIntroStepNumber(parsed)) {
    return null;
  }
  return parsed;
}

export function introIndexFromStepNumber(stepNumber: number) {
  return stepNumber - 1;
}

export function introStepNumberFromIndex(index: number) {
  return index + 1;
}

export function onboardingStepPath(stepNumber: number) {
  return `/onboarding/${stepNumber}`;
}
