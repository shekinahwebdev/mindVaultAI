"use client";

import type { SerializedNoteTag } from "@/lib/notes/serialize";
import { getTagColor } from "@/lib/vault/tag-colors";
import { cn } from "@/lib/utils";

type NoteTagBadgesProps = {
  tags: SerializedNoteTag[];
  className?: string;
};

export function NoteTagBadges({ tags, className }: NoteTagBadgesProps) {
  if (tags.length === 0) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap gap-1.5", className)}>
      {tags.map((tag) => {
        const color = getTagColor(tag.name);
        return (
          <span
            key={tag.id}
            className="inline-flex items-center rounded-full border bg-mv-panel/60 px-2.5 py-0.5 text-[0.6875rem] font-medium text-foreground"
            style={{ borderColor: `${color}55` }}
          >
            <span
              aria-hidden
              className="mr-1.5 size-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
            {tag.name}
          </span>
        );
      })}
    </div>
  );
}
