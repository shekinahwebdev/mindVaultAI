import type { LucideIcon } from "lucide-react";
import {
  GitBranch,
  MessageCircle,
  Newspaper,
  Play,
  StickyNote,
} from "lucide-react";

export type ProblemCardData = {
  source: string;
  title: string;
  icon: LucideIcon;
  depth: number;
  desktop: {
    className: string;
  };
  drift: {
    duration: number;
    x: number;
    y: number;
  };
};

export const problemCards: ProblemCardData[] = [
  {
    source: "GitHub",
    title: "Agent repository",
    icon: GitBranch,
    depth: 0.94,
    desktop: {
      className: "top-[2%] left-0",
    },
    drift: { duration: 11, x: 6, y: -10 },
  },
  {
    source: "ChatGPT",
    title: "AWS explanation",
    icon: MessageCircle,
    depth: 1,
    desktop: {
      className: "top-[4%] right-0",
    },
    drift: { duration: 13.5, x: -5, y: 8 },
  },
  {
    source: "YouTube",
    title: "RAG tutorial",
    icon: Play,
    depth: 0.86,
    desktop: {
      className: "top-[50%] left-[2%]",
    },
    drift: { duration: 15, x: 4, y: 9 },
  },
  {
    source: "Notes",
    title: "Startup idea",
    icon: StickyNote,
    depth: 0.9,
    desktop: {
      className: "top-[52%] right-[2%]",
    },
    drift: { duration: 12.2, x: -7, y: -7 },
  },
  {
    source: "Article",
    title: "Vector database guide",
    icon: Newspaper,
    depth: 0.8,
    desktop: {
      className: "bottom-[8%] left-1/2 -translate-x-1/2",
    },
    drift: { duration: 14.4, x: 5, y: 6 },
  },
];
