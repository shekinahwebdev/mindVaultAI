"use client";

import { useEffect, useState } from "react";

import { ContentCard } from "@/components/mv/ContentCard";
import { EmptyState } from "@/components/mv/EmptyState";
import { fetchTags, type SerializedTag } from "@/lib/tags/tags-client";
import { getTagColor } from "@/lib/vault/tag-colors";
import { toastError } from "@/lib/vault-toast";

type LibraryTagsPanelProps = {
  onSelectTag: (tagId: string, name: string) => void;
};

export function LibraryTagsPanel({ onSelectTag }: LibraryTagsPanelProps) {
  const [tags, setTags] = useState<SerializedTag[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      setLoading(true);
      const { data } = await fetchTags({ sort: "name_asc" });
      setLoading(false);
      if (data?.ok) {
        setTags(data.tags);
      } else {
        toastError("Could not load tags.");
      }
    })();
  }, []);

  if (loading) {
    return <p className="text-[0.875rem] text-muted-foreground">Loading tags…</p>;
  }

  if (tags.length === 0) {
    return (
      <EmptyState
        title="No tags yet"
        description="Tags on notes and PDFs appear here for quick filtering."
      />
    );
  }

  return (
    <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
      {tags.map((tag) => {
        const color = getTagColor(tag.name);
        return (
          <li key={tag.id}>
            <button
              type="button"
              onClick={() => onSelectTag(tag.id, tag.name)}
              className="block w-full text-left"
            >
              <ContentCard padding="sm" className="transition-colors hover:border-mv-border/80">
                <span
                  className="inline-flex items-center gap-2 text-[0.875rem] font-medium text-foreground"
                  style={{ color }}
                >
                  <span
                    aria-hidden
                    className="size-2 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  {tag.name}
                </span>
                <span className="mt-1 block text-[0.75rem] text-mv-faint">
                  {tag.noteCount} note{tag.noteCount === 1 ? "" : "s"}
                </span>
              </ContentCard>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
