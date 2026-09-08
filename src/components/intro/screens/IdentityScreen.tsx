"use client";

import { brand } from "@/lib/brand";

import { IntroCopy } from "../IntroCopy";
import { IntroLogo } from "../IntroLogo";
import { IntroNextButton } from "../IntroNextButton";
import { IntroSignature } from "../IntroSignature";

type IdentityScreenProps = {
  onNext: () => void;
  disabled?: boolean;
};

export function IdentityScreen({ onNext, disabled }: IdentityScreenProps) {
  return (
    <section className="relative flex w-full max-w-5xl flex-col items-center text-center">
      <h1 className="sr-only">{brand.name}</h1>
      <IntroLogo />
      <IntroSignature />
      <IntroCopy />
      <IntroNextButton identity onNext={onNext} disabled={disabled} />
    </section>
  );
}
