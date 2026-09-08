"use client";

import { animate, motion, useMotionValue, useTransform } from "framer-motion";
import { useEffect, useId } from "react";

import { brand } from "@/lib/brand";

import { useIdentityIntroInstant } from "./IntroPlayback";
import { introTimings, signatureEase } from "./intro-motion";

const VIEWBOX_WIDTH = 980;
const VIEWBOX_HEIGHT = 268;

function useFontsReady() {
  // Avoids starting the reveal against fallback-font glyph metrics, which
  // would make the mask edge land in the wrong place and then jump once
  // the real signature font swaps in mid-animation.
  const ready = useMotionValue(0);

  useEffect(() => {
    let cancelled = false;
    const fontsReady =
      typeof document !== "undefined" && "fonts" in document
        ? document.fonts.ready
        : Promise.resolve();

    fontsReady.then(() => {
      if (!cancelled) ready.set(1);
    });

    return () => {
      cancelled = true;
    };
  }, [ready]);

  return ready;
}

export function IntroSignature() {
  const instant = useIdentityIntroInstant();
  const fontsReady = useFontsReady();
  const rawId = useId();
  const maskId = `signature-mask-${rawId.replace(/:/g, "")}`;
  const gradientId = `signature-gradient-${rawId.replace(/:/g, "")}`;
  const glowId = `signature-glow-${rawId.replace(/:/g, "")}`;

  // Full-height, left-to-right reveal: every letter is either fully
  // visible or fully hidden, so the word never appears fragmented.
  const revealWidth = useMotionValue(instant ? VIEWBOX_WIDTH : 0);
  const nibOpacity = useTransform(
    revealWidth,
    [0, VIEWBOX_WIDTH * 0.04, VIEWBOX_WIDTH * 0.96, VIEWBOX_WIDTH],
    [0, 1, 1, 0],
  );

  useEffect(() => {
    if (instant) {
      revealWidth.set(VIEWBOX_WIDTH);
      return;
    }

    revealWidth.set(0);
    let cancelled = false;
    let stopAnimation: (() => void) | undefined;
    let unsubscribe: (() => void) | undefined;

    function beginReveal(value: number) {
      if (cancelled || value < 1) return;
      unsubscribe?.();
      const controls = animate(revealWidth, VIEWBOX_WIDTH, {
        duration: introTimings.signature.duration,
        ease: signatureEase,
      });
      stopAnimation = controls.stop;
    }

    const timeout = window.setTimeout(() => {
      unsubscribe = fontsReady.on("change", beginReveal);
      beginReveal(fontsReady.get());
    }, introTimings.signature.delay * 1000);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      unsubscribe?.();
      stopAnimation?.();
    };
  }, [instant, revealWidth, fontsReady]);

  return (
    <div className="relative -mt-1 w-full max-w-[min(100%,22.5rem)] sm:mt-0 sm:max-w-[36rem] lg:mt-0.5 lg:max-w-[48rem]">
      <svg
        viewBox={`0 12 ${VIEWBOX_WIDTH} 168`}
        className="h-auto w-full overflow-visible"
        role="presentation"
        aria-hidden
      >
        <defs>
          <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="92%" stopColor="white" stopOpacity="1" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </linearGradient>
          <mask id={maskId} maskUnits="userSpaceOnUse">
            <rect width={VIEWBOX_WIDTH} height={VIEWBOX_HEIGHT} fill="black" />
            <motion.rect
              x={0}
              y={0}
              width={revealWidth}
              height={VIEWBOX_HEIGHT}
              fill={`url(#${gradientId})`}
            />
          </mask>
          <filter id={glowId} x="-180%" y="-180%" width="460%" height="460%">
            <feGaussianBlur stdDeviation="1.4" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <text
          x={VIEWBOX_WIDTH / 2}
          y={136}
          textAnchor="middle"
          fill="white"
          mask={`url(#${maskId})`}
          style={{
            fontFamily: "var(--font-signature), cursive",
            fontSize: 118,
          }}
        >
          {brand.name}
        </text>

        <motion.circle
          r={2.2}
          fill="white"
          filter={`url(#${glowId})`}
          cy={128}
          cx={revealWidth}
          style={{ opacity: nibOpacity }}
        />
      </svg>
    </div>
  );
}
