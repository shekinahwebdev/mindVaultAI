import {
  Code2,
  FileText,
  Layers,
  Link2,
  Quote,
  StickyNote,
  type LucideIcon,
  type LucideProps,
} from "lucide-react";
import { createElement } from "react";

import { noteTypeLabels } from "@/lib/notes/note-display";
import { cn } from "@/lib/utils";

const noteTypeIcons: Record<string, LucideIcon> = {
  NOTE: StickyNote,
  LINK: Link2,
  QUOTE: Quote,
  CODE: Code2,
  ARTICLE: FileText,
  OTHER: Layers,
};

export function getNoteTypeIcon(type: string): LucideIcon {
  return noteTypeIcons[type] ?? Layers;
}

export function NoteTypeIcon({
  type,
  ...props
}: { type: string } & LucideProps) {
  return createElement(getNoteTypeIcon(type), props);
}

export function getNoteTypeLabel(type: string) {
  return noteTypeLabels[type] ?? type;
}

export function noteTypePillClassName(type: string) {
  const base =
    "inline-flex shrink-0 items-center rounded-[6px] border px-1.5 py-0.5 text-[0.6875rem] font-medium";

  switch (type) {
    case "CODE":
      return cn(
        base,
        "border-foreground/15 bg-mv-panel text-foreground/85",
      );
    case "LINK":
      return cn(base, "border-border bg-surface text-muted-foreground");
    case "QUOTE":
      return cn(base, "border-border bg-mv-panel text-foreground/75 italic");
    case "OTHER":
      return cn(
        base,
        "border-foreground/12 bg-secondary text-muted-foreground",
      );
    default:
      return cn(base, "border-border bg-mv-panel text-muted-foreground");
  }
}
