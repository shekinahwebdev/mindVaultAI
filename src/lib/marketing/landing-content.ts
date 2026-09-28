import { Lock, Search, Sparkles, SquareStack } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { routes } from "@/lib/routes";

export const marketingRoutes = {
  getStarted: routes.onboarding.start,
  signIn: routes.signIn,
  createAccount: routes.signUp,
  features: routes.overview,
  blog: routes.blog,
  pricing: routes.pricing,
} as const;

export type LandingFeatureHighlight = {
  title: string;
  description: string;
  icon: LucideIcon;
};

/** Bottom row — matches reference landing layout. */
export const landingFeatureHighlights: LandingFeatureHighlight[] = [
  {
    title: "Save Anything",
    description: "Notes, links, images, code, voice and more",
    icon: SquareStack,
  },
  {
    title: "Organise Automatically",
    description: "AI-powered categories and tags",
    icon: Sparkles,
  },
  {
    title: "Find Instantly",
    description: "Powerful semantic search",
    icon: Search,
  },
  {
    title: "Private & Secure",
    description: "Your data, encrypted and controlled by you",
    icon: Lock,
  },
];
