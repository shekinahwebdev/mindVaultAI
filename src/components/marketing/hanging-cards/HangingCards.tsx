"use client";

import { useState } from "react";

import { cn } from "@/lib/utils";

import { hangingCards } from "./cards";
import { FindInstantlyContent, OrganiseAutomaticallyContent, SaveAnythingContent } from "./CardContent";
import { HangingCard } from "./HangingCard";
import { useHangingPendulums } from "./use-hanging-pendulums";

const cardContent = {
  save: SaveAnythingContent,
  organise: OrganiseAutomaticallyContent,
  find: FindInstantlyContent,
} as const;

export function HangingCards() {
  const {
    installationRef,
    sharedAnchorRef,
    scrollerRef,
    bind,
    columnRefs,
    cardRefs,
    ringRefs,
    threadLineRefs,
  } = useHangingPendulums();
  const [activeIndex, setActiveIndex] = useState(0);

  const scrollToIndex = (index: number) => {
    const scroller = scrollerRef.current;
    const card = scroller?.querySelectorAll<HTMLElement>("[data-hanging-card]")[index];
    if (!scroller || !card) return;
    const left = card.offsetLeft - (scroller.clientWidth - card.offsetWidth) / 2;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    scroller.scrollTo({ left, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <div className="relative mt-0.5 w-full sm:mt-1">
      <div ref={installationRef} className="hanging-installation relative mx-auto w-full max-w-4xl">
        <div
          ref={sharedAnchorRef}
          aria-hidden
          className="hanging-shared-anchor pointer-events-none relative z-[2] mx-auto"
        />

        <svg
          aria-hidden
          className="pointer-events-none absolute inset-0 z-[1] h-full w-full overflow-visible"
        >
          {hangingCards.map((card, index) => (
            <line
              key={card.id}
              ref={threadLineRefs[index]}
              className="hanging-thread-line"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        <div
          ref={scrollerRef}
          className="hanging-scroller hanging-stage relative z-[3] -mx-[var(--mv-page-padding-x)] flex snap-x snap-mandatory items-start gap-3 overflow-x-auto overflow-y-visible pb-4 pt-0 md:mx-0 md:overflow-visible md:pb-5"
          onScroll={(event) => {
            const scroller = event.currentTarget;
            const cards = scroller.querySelectorAll<HTMLElement>("[data-hanging-card]");
            const center = scroller.scrollLeft + scroller.clientWidth / 2;
            let nearest = 0;
            let best = Number.POSITIVE_INFINITY;
            cards.forEach((card, index) => {
              const cardCenter = card.offsetLeft + card.offsetWidth / 2;
              const distance = Math.abs(cardCenter - center);
              if (distance < best) {
                best = distance;
                nearest = index;
              }
            });
            setActiveIndex((current) => (current === nearest ? current : nearest));
          }}
        >
          <div aria-hidden className="w-[7%] shrink-0 md:hidden" />
          {hangingCards.map((card, index) => {
            const Content = cardContent[card.id as keyof typeof cardContent];
            const handlers = bind(index);
            return (
              <HangingCard
                key={card.id}
                card={card}
                columnRef={columnRefs[index]}
                cardRef={cardRefs[index]}
                ringRef={ringRefs[index]}
                {...handlers}
              >
                <Content />
              </HangingCard>
            );
          })}
          <div aria-hidden className="w-[7%] shrink-0 md:hidden" />
        </div>
      </div>

      <p className="sr-only md:hidden">Swipe sideways to see each highlight.</p>
      <div className="mt-1 flex justify-center gap-1.5 md:hidden">
        {hangingCards.map((card, index) => (
          <button
            key={card.id}
            type="button"
            aria-label={`Show ${card.title}`}
            aria-current={activeIndex === index ? "true" : undefined}
            onClick={() => scrollToIndex(index)}
            className={cn(
              "h-1.5 rounded-full transition-[width,background-color] duration-200",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
              activeIndex === index ? "w-5 bg-white/85" : "w-1.5 bg-white/30",
            )}
          />
        ))}
      </div>
    </div>
  );
}
