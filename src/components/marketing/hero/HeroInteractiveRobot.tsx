"use client";

import Image from "next/image";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  useCallback,
  useEffect,
  useId,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";

import { heroRobotThoughtBubble, landingHeroMascot } from "@/lib/marketing/landing-hero-content";
import { cn } from "@/lib/utils";

const BUBBLE_MOTION_MS = 0.25;

function subscribeHoverCapable(onStoreChange: () => void) {
  const mq = window.matchMedia("(hover: hover) and (pointer: fine)");
  mq.addEventListener("change", onStoreChange);
  return () => mq.removeEventListener("change", onStoreChange);
}

function getHoverCapableSnapshot() {
  return window.matchMedia("(hover: hover) and (pointer: fine)").matches;
}

type HeroInteractiveRobotProps = {
  className?: string;
};

export function HeroInteractiveRobot({ className }: HeroInteractiveRobotProps) {
  const reduceMotion = useReducedMotion();
  const bubbleId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const [hovering, setHovering] = useState(false);
  const [focusWithin, setFocusWithin] = useState(false);
  const [touchOpen, setTouchOpen] = useState(false);
  const canHover = useSyncExternalStore(subscribeHoverCapable, getHoverCapableSnapshot, () => true);

  const open = (canHover && hovering) || focusWithin || (!canHover && touchOpen);

  const dismiss = useCallback(() => {
    setTouchOpen(false);
    setHovering(false);
    rootRef.current?.blur();
  }, []);

  useEffect(() => {
    if (!open || canHover) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setTouchOpen(false);
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open, canHover]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") dismiss();
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, dismiss]);

  const onFocusCapture = () => setFocusWithin(true);
  const onBlurCapture = (event: React.FocusEvent) => {
    const next = event.relatedTarget;
    if (!rootRef.current?.contains(next)) setFocusWithin(false);
  };

  const onPointerEnter = () => {
    if (canHover) setHovering(true);
  };
  const onPointerLeave = () => {
    if (canHover) setHovering(false);
  };

  const onRootClick = () => {
    if (!canHover) setTouchOpen((value) => !value);
  };

  const onKeyDown = (event: React.KeyboardEvent) => {
    if (!canHover && (event.key === "Enter" || event.key === " ")) {
      event.preventDefault();
      setTouchOpen((value) => !value);
    }
  };

  return (
    <div
      ref={rootRef}
      className={cn(
        "landing-hero-robot-interactive flex h-full w-full flex-col justify-center rounded-2xl outline-none",
        "focus-visible:ring-2 focus-visible:ring-white/28 focus-visible:ring-offset-2 focus-visible:ring-offset-black",
        className,
      )}
      tabIndex={0}
      role="group"
      aria-label="MindVault robot companion"
      aria-describedby={open ? bubbleId : undefined}
      onFocusCapture={onFocusCapture}
      onBlurCapture={onBlurCapture}
      onPointerEnter={onPointerEnter}
      onPointerLeave={onPointerLeave}
      onKeyDown={onKeyDown}
      data-bubble-open={open ? "" : undefined}
    >
      {/* Reserved bubble slot — prevents layout shift when the bubble appears */}
      <div className="relative z-[4] flex min-h-[5.25rem] w-full shrink-0 items-end justify-center pb-0.5 sm:min-h-[5.75rem] lg:min-h-[6.25rem]">
        <AnimatePresence mode="wait">
          {open ? (
            <motion.div
              key="hero-thought-bubble"
              id={bubbleId}
              role="status"
              className={cn(
                "pointer-events-auto max-w-[min(17.5rem,calc(100%-1rem))] rounded-2xl",
                "border border-white/18 bg-black/62 px-3.5 py-2.5 text-center backdrop-blur-sm",
                "text-[0.8125rem] leading-snug text-white/92",
                "shadow-[0_16px_40px_-20px_rgba(0,0,0,0.9)]",
              )}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={reduceMotion ? undefined : { opacity: 0, y: 6 }}
              transition={{ duration: BUBBLE_MOTION_MS, ease: "easeOut" }}
            >
              {heroRobotThoughtBubble}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <div
          className={cn(
            "pointer-events-none absolute top-full left-1/2 z-[3] flex -translate-x-1/2 flex-col items-center gap-1.5 pt-1.5",
            "transition-opacity duration-200",
            open ? "opacity-100" : "opacity-0",
          )}
          aria-hidden
        >
          <span className="size-1.5 rounded-full bg-white/30 shadow-[0_0_6px_rgba(255,255,255,0.12)]" />
          <span className="size-1.5 rounded-full bg-white/45 shadow-[0_0_8px_rgba(255,255,255,0.16)]" />
        </div>
      </div>

      <motion.div
        className="landing-hero-robot-figure relative z-[2] flex min-h-0 flex-1 items-center justify-center"
        onClick={onRootClick}
        animate={
          reduceMotion
            ? undefined
            : {
                y: [0, -11, 0],
                rotate: [-1.5, 1.25, -1.5],
              }
        }
        transition={{
          y: { duration: 5.8, repeat: Infinity, ease: "easeInOut" },
          rotate: { duration: 7.5, repeat: Infinity, ease: "easeInOut" },
        }}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute bottom-[8%] left-1/2 h-[clamp(4.5rem,18%,8rem)] w-[min(78%,16rem)] -translate-x-1/2 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.12),transparent_72%)]"
        />
        <Image
          src={landingHeroMascot.src}
          alt=""
          width={landingHeroMascot.width}
          height={landingHeroMascot.height}
          priority
          unoptimized
          draggable={false}
          className={cn(
            "relative z-[1] h-full max-h-full w-auto max-w-full cursor-default object-contain object-center",
            "drop-shadow-[0_24px_56px_rgba(0,0,0,0.65)]",
            !canHover && "cursor-pointer",
            "focus-visible:outline-none",
          )}
          sizes="(max-width: 640px) 80vw, (max-width: 1024px) 40vw, 520px"
        />
      </motion.div>
    </div>
  );
}
