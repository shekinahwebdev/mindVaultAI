"use client";

import { Plus, Search, X } from "lucide-react";
import { useEffect, useId, useMemo, useRef, useState } from "react";

import { MAX_TAGS_PER_NOTE } from "@/lib/notes/note-tag-limits";
import {
  createTag,
  fetchTags,
  TAG_CLIENT_ERROR,
  TAG_LOAD_ERROR,
  type SerializedTag,
} from "@/lib/tags/tags-client";
import { getTagColor } from "@/lib/vault/tag-colors";
import { cn } from "@/lib/utils";

import { vaultSecondaryButton } from "../vault-controls";

type TagMultiSelectProps = {
  label?: string;
  value: string[];
  onChange: (tagIds: string[]) => void;
  disabled?: boolean;
  error?: string;
  allowCreate?: boolean;
};

export function TagMultiSelect({
  label = "Tags",
  value = [],
  onChange,
  disabled,
  error,
  allowCreate = true,
}: TagMultiSelectProps) {
  const listId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  const [open, setOpen] = useState(false);
  const [allTags, setAllTags] = useState<SerializedTag[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [creating, setCreating] = useState(false);

  const selectedTags = useMemo(() => {
    const byId = new Map(allTags.map((tag) => [tag.id, tag]));
    return value
      .map((id) => byId.get(id))
      .filter((tag): tag is SerializedTag => tag !== undefined);
  }, [allTags, value]);

  const missingSelectedCount = value.length - selectedTags.length;

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setLoadError("");

      try {
        const { response, data } = await fetchTags({
          sort: "name_asc",
          filter: "all",
        });

        if (cancelled) {
          return;
        }

        if (!data || !response.ok || !data.ok) {
          setLoadError(TAG_LOAD_ERROR);
          setAllTags([]);
          return;
        }

        setAllTags(data.tags);
      } catch {
        if (!cancelled) {
          setLoadError(TAG_LOAD_ERROR);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    searchRef.current?.focus();

    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    function onEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onEscape);
    };
  }, [open]);

  const query = search.trim().toLowerCase();

  const filteredTags = useMemo(() => {
    const next = query
      ? allTags.filter((tag) => tag.name.toLowerCase().includes(query))
      : allTags;
    return next.slice(0, 50);
  }, [allTags, query]);

  const canAddMore = value.length < MAX_TAGS_PER_NOTE;

  const exactMatch = useMemo(() => {
    if (!query) {
      return null;
    }
    return (
      allTags.find((tag) => tag.name.toLowerCase() === query) ?? null
    );
  }, [allTags, query]);

  function toggleTag(tagId: string) {
    if (disabled) {
      return;
    }

    if (value.includes(tagId)) {
      onChange(value.filter((id) => id !== tagId));
      return;
    }

    if (!canAddMore) {
      return;
    }

    onChange([...value, tagId]);
  }

  function removeTag(tagId: string) {
    if (disabled) {
      return;
    }
    onChange(value.filter((id) => id !== tagId));
  }

  async function handleCreateTag() {
    const name = search.trim();
    if (!allowCreate || !name || creating || disabled || exactMatch) {
      return;
    }

    if (!canAddMore) {
      return;
    }

    setCreating(true);
    try {
      const { response, data } = await createTag(name);

      if (!data || !response.ok || !data.ok) {
        setLoadError(
          data && !data.ok && data.message ? data.message : TAG_CLIENT_ERROR,
        );
        return;
      }

      setAllTags((current) =>
        [...current, data.tag].sort((a, b) => a.name.localeCompare(b.name)),
      );
      onChange([...value, data.tag.id]);
      setSearch("");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div ref={rootRef} className="relative flex w-full flex-col text-left">
      <span className="text-[0.8125rem] font-medium text-foreground">{label}</span>

      {!loading && !loadError && allTags.length === 0 && value.length === 0 ? (
        <p className="mt-1 text-[0.75rem] text-muted-foreground">No tags yet</p>
      ) : null}

      {selectedTags.length > 0 || missingSelectedCount > 0 ? (
        <ul className="mt-2 flex flex-wrap gap-1.5" aria-label="Selected tags">
          {selectedTags.map((tag) => {
            const color = getTagColor(tag.name);
            return (
              <li key={tag.id}>
                <span
                  className="inline-flex max-w-full items-center gap-1 rounded-full border bg-mv-panel/60 py-0.5 pr-1 pl-2.5 text-[0.75rem] text-foreground"
                  style={{ borderColor: `${color}55` }}
                >
                  <span
                    aria-hidden
                    className="size-1.5 shrink-0 rounded-full"
                    style={{ backgroundColor: color }}
                  />
                  <span className="truncate">{tag.name}</span>
                  <button
                    type="button"
                    onClick={() => removeTag(tag.id)}
                    disabled={disabled}
                    aria-label={`Remove ${tag.name}`}
                    className="ml-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-mv-panel hover:text-foreground disabled:opacity-50"
                  >
                    <X aria-hidden className="size-3.5" />
                  </button>
                </span>
              </li>
            );
          })}
        </ul>
      ) : null}

      <button
        type="button"
        disabled={disabled}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setOpen((current) => !current)}
        className={cn(
          vaultSecondaryButton,
          "mt-2 h-9 w-full justify-start gap-2 px-3 text-[0.8125rem] font-normal",
        )}
      >
        <Plus aria-hidden className="size-3.5 shrink-0" />
        Add tags…
      </button>

      {error ? (
        <p className="mt-1.5 text-[0.75rem] text-red-600 dark:text-red-400" role="alert">
          {error}
        </p>
      ) : null}

      {loadError && !open ? (
        <p className="mt-1.5 text-[0.75rem] text-muted-foreground" role="status">
          {loadError}
        </p>
      ) : null}

      {open ? (
        <div
          id={listId}
          role="listbox"
          aria-multiselectable="true"
          aria-label="Available tags"
          className="absolute top-full z-30 mt-1.5 w-full overflow-hidden rounded-[var(--mv-radius-control)] border border-border bg-surface shadow-[var(--mv-shadow-card)]"
        >
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-mv-faint"
              />
              <input
                ref={searchRef}
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search tags…"
                aria-label="Search tags"
                disabled={disabled || loading}
                className="h-9 w-full rounded-[var(--mv-radius-control)] border border-border bg-mv-panel pl-8 pr-2 text-[0.8125rem] outline-none placeholder:text-mv-faint"
              />
            </div>
          </div>

          <div className="max-h-52 overflow-y-auto p-1" aria-busy={loading}>
            {loading ? (
              <p className="px-2 py-3 text-[0.8125rem] text-muted-foreground">Loading tags…</p>
            ) : loadError ? (
              <p className="px-2 py-3 text-[0.8125rem] text-muted-foreground">{loadError}</p>
            ) : filteredTags.length === 0 && !allowCreate ? (
              <p className="px-2 py-3 text-[0.8125rem] text-muted-foreground">No tags found.</p>
            ) : filteredTags.length === 0 && allowCreate && !query ? (
              <p className="px-2 py-3 text-[0.8125rem] text-muted-foreground">
                No tags yet. Type a name below to create one.
              </p>
            ) : (
              <ul className="space-y-0.5">
                {filteredTags.map((tag) => {
                  const selected = value.includes(tag.id);
                  return (
                    <li key={tag.id}>
                      <button
                        type="button"
                        role="option"
                        aria-selected={selected}
                        disabled={disabled || (!selected && !canAddMore)}
                        onClick={() => toggleTag(tag.id)}
                        className={cn(
                          "flex w-full items-center justify-between gap-2 rounded-[var(--mv-radius-control)] px-2.5 py-2 text-left text-[0.8125rem]",
                          selected
                            ? "bg-mv-panel font-medium text-foreground"
                            : "text-foreground hover:bg-mv-panel/70",
                          !selected && !canAddMore && "opacity-50",
                        )}
                      >
                        <span className="truncate">{tag.name}</span>
                        {selected ? (
                          <span className="shrink-0 text-[0.6875rem] text-muted-foreground">
                            Selected
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}

            {allowCreate && query && !exactMatch && !loading ? (
              <button
                type="button"
                disabled={disabled || creating || !canAddMore}
                onClick={() => void handleCreateTag()}
                className="mt-1 flex w-full items-center gap-2 border-t border-border px-3 py-2.5 text-left text-[0.8125rem] font-medium text-foreground hover:bg-mv-panel/60 disabled:opacity-50"
              >
                <Plus aria-hidden className="size-3.5 shrink-0" />
                {creating ? "Creating…" : `Create "${search.trim()}"`}
              </button>
            ) : null}
          </div>

          {!canAddMore ? (
            <p className="border-t border-border px-3 py-2 text-[0.6875rem] text-muted-foreground">
              Maximum {MAX_TAGS_PER_NOTE} tags per note.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
