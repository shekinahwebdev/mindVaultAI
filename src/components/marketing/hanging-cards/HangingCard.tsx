import type { CSSProperties, ReactNode, Ref } from "react";
import type { KeyboardEvent as ReactKeyboardEvent, PointerEvent as ReactPointerEvent } from "react";

import { cn } from "@/lib/utils";

import type { HangingCardDefinition } from "./cards";

type HangingCardProps = {
  card: HangingCardDefinition;
  columnRef: Ref<HTMLDivElement>;
  cardRef: Ref<HTMLDivElement>;
  ringRef: Ref<HTMLSpanElement>;
  children: ReactNode;
  onPointerDown: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLElement>) => void;
  onPointerUp: () => void;
  onPointerCancel: () => void;
  onLostPointerCapture: () => void;
  onKeyDown: (event: ReactKeyboardEvent<HTMLElement>) => void;
};

const layoutTilt = {
  left: "-0.06rad",
  center: "0rad",
  right: "0.06rad",
} as const;

export function HangingCard({
  card,
  columnRef,
  cardRef,
  ringRef,
  children,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onLostPointerCapture,
  onKeyDown,
}: HangingCardProps) {
  return (
    <div
      ref={columnRef}
      data-hanging-card
      className={cn(
        "hanging-column relative flex w-[min(100%,13rem)] shrink-0 snap-center flex-col items-center",
        "max-[767px]:max-w-[86%] md:w-auto lg:w-auto",
        card.layout === "left" && "hanging-column-left",
        card.layout === "center" && "hanging-column-center z-[1]",
        card.layout === "right" && "hanging-column-right",
      )}
      style={
        {
          "--layout-tilt": layoutTilt[card.layout],
        } as CSSProperties
      }
    >
      <div ref={cardRef} className="hanging-card-motion w-full">
        <span ref={ringRef} aria-hidden className="hanging-ring mx-auto block" />
        <article
          tabIndex={0}
          aria-label={`${card.title}. ${card.description}`}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerCancel}
          onLostPointerCapture={onLostPointerCapture}
          onKeyDown={onKeyDown}
          className={cn(
            "hanging-card-face -mt-1 flex aspect-square w-full cursor-grab flex-col overflow-hidden rounded-2xl border border-white/25 bg-black p-4 md:p-[1.125rem]",
            "select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
            "md:touch-none",
          )}
        >
          {children}
          <p className="sr-only max-md:hidden">Press the left or right arrow keys to swing this card.</p>
        </article>
      </div>
    </div>
  );
}
