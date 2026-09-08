"use client";

import { IntroNextButton } from "../IntroNextButton";

type IntroPlaceholderScreenProps = {
  title: string;
  line: string;
  onNext?: () => void;
  showNext?: boolean;
  disabled?: boolean;
};

export function IntroPlaceholderScreen({
  title,
  line,
  onNext,
  showNext = true,
  disabled,
}: IntroPlaceholderScreenProps) {
  return (
    <section className="relative flex w-full max-w-xl flex-col items-center px-2 text-center">
      <h1 className="sr-only">{title}</h1>
      <p className="font-editorial max-w-md text-xl leading-relaxed text-pretty text-brand-ink italic sm:text-2xl">
        {line}
      </p>
      {showNext && onNext ? (
        <IntroNextButton onNext={onNext} immediate disabled={disabled} />
      ) : null}
    </section>
  );
}
