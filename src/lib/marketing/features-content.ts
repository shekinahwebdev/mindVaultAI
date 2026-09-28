import {
  Brain,
  FolderKanban,
  Inbox,
  Layers,
  MessageCircle,
  Network,
  Rocket,
  Search,
  ShieldCheck,
  SquareStack,
  type LucideIcon,
} from "lucide-react";

export type MarketingFeature = {
  title: string;
  description: string;
  icon: LucideIcon;
  badge?: string;
};

export const featuresOverviewCopy = {
  headline: "Everything you need in one intelligent space.",
  subhead:
    "MindVault helps you capture, organise, and make sense of your notes, documents, links, ideas and more — all powered by AI.",
} as const;

/** Six-up grid on the product overview page. */
export const featuresOverviewHighlights: MarketingFeature[] = [
  {
    title: "Smart Capture",
    description: "Save notes, links, files, images, voice and code snippets.",
    icon: SquareStack,
  },
  {
    title: "AI Organisation",
    description: "Automatically categorise, tag and group your content.",
    icon: Network,
  },
  {
    title: "Powerful Search",
    description: "Find anything using natural language or keywords.",
    icon: Search,
  },
  {
    title: "AI Chat",
    description: "Ask questions about your saved content.",
    icon: MessageCircle,
    badge: "Beta",
  },
  {
    title: "Multiple Content Types",
    description: "Notes, documents, photos, links, code, voice and more.",
    icon: Layers,
  },
  {
    title: "Secure & Private",
    description: "Your data is encrypted and stays under your control.",
    icon: ShieldCheck,
  },
];

export type HowItWorksStep = {
  step: number;
  title: string;
  description: string;
  icon: LucideIcon;
};

export const howItWorksCopy = {
  headline: "How MindVault works",
  subhead: "From capture to clarity — in just a few steps.",
} as const;

export const howItWorksSteps: HowItWorksStep[] = [
  {
    step: 1,
    title: "Capture",
    description: "Save anything — notes, files, links, images or voice.",
    icon: Inbox,
  },
  {
    step: 2,
    title: "Organise",
    description: "AI automatically categorises and tags.",
    icon: FolderKanban,
  },
  {
    step: 3,
    title: "Understand",
    description: "Ask questions and get insights with AI.",
    icon: Brain,
  },
  {
    step: 4,
    title: "Use",
    description: "Find and apply your knowledge anytime.",
    icon: Rocket,
  },
];

/** @deprecated Use featuresOverviewCopy — kept for metadata fallbacks */
export const featuresPageCopy = {
  eyebrow: "Overview",
  headline: featuresOverviewCopy.headline,
  subhead: featuresOverviewCopy.subhead,
} as const;
