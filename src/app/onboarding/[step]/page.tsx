import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { IntroFlow } from "@/components/intro/IntroFlow";
import {
  introIndexFromStepNumber,
  introStepNumberFromParam,
  introSteps,
} from "@/components/intro/intro-flow";
import { brand } from "@/lib/brand";
import { routes } from "@/lib/routes";

type OnboardingStepPageProps = {
  params: Promise<{ step: string }>;
};

export async function generateMetadata({ params }: OnboardingStepPageProps): Promise<Metadata> {
  const { step: stepParam } = await params;
  const stepNumber = introStepNumberFromParam(stepParam);
  const stepMeta = stepNumber ? introSteps[stepNumber - 1] : introSteps[0];

  return {
    title: `${stepMeta.title} — ${brand.name}`,
    description: brand.supporting,
  };
}

export default async function OnboardingStepPage({ params }: OnboardingStepPageProps) {
  const { step: stepParam } = await params;
  const stepNumber = introStepNumberFromParam(stepParam);

  if (!stepNumber) {
    redirect(routes.onboarding.start);
  }

  return <IntroFlow stepIndex={introIndexFromStepNumber(stepNumber)} />;
}
