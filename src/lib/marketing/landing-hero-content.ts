import { marketingRoutes } from "./landing-content";

export const landingHeroCopy = {
  primaryCta: { label: "Get Started", href: marketingRoutes.getStarted },
  secondaryCta: { label: "See how it works", href: marketingRoutes.features },
} as const;

/** Hero mascot — keyed from `public/animations/preview.webp`. */
export const landingHeroMascot = {
  src: "/marketing/hero-robot.webp",
  width: 512,
  height: 512,
  /** Opaque pixel bounds (px) — used to size visible character vs. frame. */
  contentHeight: 438,
} as const;

export const heroRobotThoughtBubble =
  "Got a thought? Let's save it before it disappears.";
