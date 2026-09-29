import type { LucideIcon, LucideProps } from "lucide-react";
import { createElement } from "react";
import {
  BarChart3,
  Code2,
  FolderOpen,
  GraduationCap,
  Heart,
  Lightbulb,
  Plane,
  Quote,
  User,
} from "lucide-react";

const CATEGORY_ICON_RULES: Array<{ pattern: RegExp; icon: LucideIcon }> = [
  { pattern: /program|code|dev|software|engineer/i, icon: Code2 },
  { pattern: /school|study|class|learn|course|uni/i, icon: GraduationCap },
  { pattern: /quote|inspir/i, icon: Quote },
  { pattern: /idea|thought|brain/i, icon: Lightbulb },
  { pattern: /personal|life|journal/i, icon: User },
  { pattern: /health|fitness|wellness/i, icon: Heart },
  { pattern: /financ|money|budget|invest/i, icon: BarChart3 },
  { pattern: /travel|trip|flight/i, icon: Plane },
];

export function getCategoryIcon(name: string): LucideIcon {
  for (const rule of CATEGORY_ICON_RULES) {
    if (rule.pattern.test(name)) {
      return rule.icon;
    }
  }
  return FolderOpen;
}

export function CategoryIcon({
  name,
  ...props
}: { name: string } & LucideProps) {
  return createElement(getCategoryIcon(name), props);
}
