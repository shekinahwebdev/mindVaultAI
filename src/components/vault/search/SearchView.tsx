"use client";

import { motion } from "framer-motion";
import { Search, Sparkles, X } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { fetchCollections } from "@/lib/collections/collections-client";
import { fetchSearch, SEARCH_LOAD_ERROR } from "@/lib/search/search-client";
import type { SearchContentType, SearchMode, SerializedSearchResult } from "@/lib/search/search-types";
import { usePreferences } from "@/lib/settings/preferences-context";
import { fetchTags } from "@/lib/tags/tags-client";
import { toastError } from "@/lib/vault-toast";
import { cn } from "@/lib/utils";

import { NotesToolbarSelect } from "../notes/NotesToolbarSelect";
import {
  vaultPageLeadClassName,
  vaultPageTitleClassName,
  vaultPrimaryButton,
  vaultSecondaryButton,
} from "../vault-controls";
import { VaultSegmentedControl } from "../VaultSegmentedControl";

import { vaultEase } from "../vault-motion";

import { SearchResultCard } from "./SearchResultCard";

const KEYWORD_DEBOUNCE_MS = 300;
const SEARCH_PAGE_SIZE = 20;

const TYPE_OPTIONS: { value: SearchContentType; label: string }[] = [
  { value: "all", label: "All content" },
  { value: "note", label: "Notes" },
  { value: "document", label: "Documents" },
];

export function SearchView() {
  const searchParams = useSearchParams();
  const { preferences, loading: preferencesLoading } = usePreferences();
  const [modeOverride, setModeOverride] = useState<SearchMode | null>(null);
  const preferredMode: SearchMode =
    preferences.defaultSearchMode === "SEMANTIC" ? "semantic" : "keyword";
  const mode = modeOverride ?? (preferencesLoading ? "keyword" : preferredMode);

  const initialUrlQuery = searchParams.get("q")?.trim() ?? "";
  const [input, setInput] = useState(initialUrlQuery);
  const [typeFilter, setTypeFilter] = useState<SearchContentType>("all");
  const [tagId, setTagId] = useState<string | null>(null);
  const [collectionId, setCollectionId] = useState<string | null>(null);
  const [tagLabel, setTagLabel] = useState<string | null>(null);
  const [collectionLabel, setCollectionLabel] = useState<string | null>(null);
  const [collectionOptions, setCollectionOptions] = useState<{ value: string; label: string }[]>([]);
  const [tagOptions, setTagOptions] = useState<{ value: string; label: string }[]>([]);

  const [items, setItems] = useState<SerializedSearchResult[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [searched, setSearched] = useState(false);
  const [semanticBounded, setSemanticBounded] = useState(false);

  const keywordDebounceRef = useRef<number | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const urlQueryBootstrappedRef = useRef(false);

  useEffect(() => {
    void (async () => {
      const [{ data: collections }, { data: tags }] = await Promise.all([
        fetchCollections(),
        fetchTags({ sort: "name_asc" }),
      ]);
      if (collections?.ok) {
        setCollectionOptions(
          collections.collections.map((c) => ({ value: c.id, label: c.name })),
        );
      }
      if (tags?.ok) {
        setTagOptions(tags.tags.map((t) => ({ value: t.id, label: t.name })));
      }
    })();
  }, []);

  const runSearch = useCallback(
    async (
      query: string,
      pageToLoad: number,
      append: boolean,
      filters?: {
        mode?: SearchMode;
        type?: SearchContentType;
        tagId?: string | null;
        collectionId?: string | null;
      },
    ) => {
      const effectiveMode = filters?.mode ?? mode;
      const effectiveType = filters?.type ?? typeFilter;
      const effectiveTagId = filters?.tagId !== undefined ? filters.tagId : tagId;
      const effectiveCollectionId =
        filters?.collectionId !== undefined ? filters.collectionId : collectionId;
      if (!query.trim()) {
        setItems([]);
        setSearched(false);
        setError("");
        setHasMore(false);
        setSemanticBounded(false);
        return;
      }

      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError("");

      try {
        const { data } = await fetchSearch(
          {
            q: query.trim(),
            mode: effectiveMode,
            type: effectiveType,
            tagId: effectiveTagId,
            collectionId: effectiveCollectionId,
            page: pageToLoad,
            limit: SEARCH_PAGE_SIZE,
          },
          controller.signal,
        );

        if (controller.signal.aborted) return;

        if (!data?.ok) {
          setError(data?.message ?? SEARCH_LOAD_ERROR);
          if (!append) setItems([]);
          setSearched(true);
          return;
        }

        setItems((current) =>
          append ? [...current, ...data.search.items] : data.search.items,
        );
        setHasMore(data.search.pagination.hasMore);
        setSemanticBounded(Boolean(data.search.meta.semanticDiscoveryBounded));
        setSearched(true);
      } catch (err) {
        if ((err as { name?: string }).name === "AbortError") return;
        setError(SEARCH_LOAD_ERROR);
        toastError(SEARCH_LOAD_ERROR);
        if (!append) setItems([]);
        setSearched(true);
      } finally {
        if (abortRef.current === controller) {
          setLoading(false);
          setLoadingMore(false);
          abortRef.current = null;
        }
      }
    },
    [collectionId, mode, tagId, typeFilter],
  );

  function resetAndSearch(query: string) {
    setPage(1);
    void runSearch(query, 1, false);
  }

  function handleInputChange(value: string) {
    setInput(value);
    if (mode !== "keyword") return;

    if (keywordDebounceRef.current) {
      window.clearTimeout(keywordDebounceRef.current);
    }
    keywordDebounceRef.current = window.setTimeout(() => {
      resetAndSearch(value);
    }, KEYWORD_DEBOUNCE_MS);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    resetAndSearch(input);
  }

  function handleModeChange(nextMode: SearchMode) {
    setModeOverride(nextMode);
  }

  useEffect(() => {
    if (!initialUrlQuery || urlQueryBootstrappedRef.current) return;
    urlQueryBootstrappedRef.current = true;
    void runSearch(initialUrlQuery, 1, false);
  }, [initialUrlQuery, runSearch]);

  function refetchWithFilters(
    nextInput: string = input,
    filters?: {
      mode?: SearchMode;
      type?: SearchContentType;
      tagId?: string | null;
      collectionId?: string | null;
    },
  ) {
    if (!nextInput.trim()) return;
    setPage(1);
    void runSearch(nextInput, 1, false, filters);
  }

  useEffect(() => {
    return () => {
      if (keywordDebounceRef.current) {
        window.clearTimeout(keywordDebounceRef.current);
      }
      abortRef.current?.abort();
    };
  }, []);

  function onCollectionChange(value: string) {
    const nextId = value || null;
    setCollectionId(nextId);
    setCollectionLabel(
      nextId ? (collectionOptions.find((o) => o.value === value)?.label ?? null) : null,
    );
    refetchWithFilters(input, { collectionId: nextId });
  }

  function onTagChange(value: string) {
    const nextId = value || null;
    setTagId(nextId);
    setTagLabel(nextId ? (tagOptions.find((o) => o.value === value)?.label ?? null) : null);
    refetchWithFilters(input, { tagId: nextId });
  }

  const hasResults = items.length > 0;
  const hasActiveFilters = typeFilter !== "all" || tagId || collectionId;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: vaultEase }}
      className="space-y-5"
    >
      <div>
        <h1 className={vaultPageTitleClassName}>Search</h1>
        <p className={cn(vaultPageLeadClassName, "max-w-xl")}>
          Find what you saved — by the exact words, or by what it means.
        </p>
      </div>

      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-4 sm:p-5 shadow-[0_1px_2px_rgb(0_0_0/0.03)]">
        <div className="mb-3">
          <VaultSegmentedControl
            ariaLabel="Search mode"
            value={mode}
            onChange={handleModeChange}
            options={[
              { value: "keyword", label: "Keyword" },
              { value: "semantic", label: "Semantic" },
            ]}
          />
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-mv-faint"
          />
          <input
            type="search"
            value={input}
            onChange={(event) => handleInputChange(event.target.value)}
            placeholder={
              mode === "keyword"
                ? "Search title or content..."
                : "Describe what you're looking for..."
            }
            className="min-h-11 w-full rounded-[var(--radius-input)] border border-border bg-mv-panel py-2 pr-24 pl-9 text-[0.88rem] text-foreground outline-none placeholder:text-mv-faint focus:border-foreground/25"
          />
          {mode === "semantic" ? (
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className={cn(
                vaultPrimaryButton,
                "absolute top-1/2 right-1.5 h-8 min-h-8 -translate-y-1/2 px-3 text-[0.78rem]",
              )}
            >
              {loading ? "Searching..." : "Search"}
            </button>
          ) : null}
        </form>

        {mode === "semantic" ? (
          <p className="mt-2.5 flex items-start gap-1.5 text-[0.76rem] leading-relaxed text-mv-faint">
            <Sparkles aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            Search by meaning across notes and PDFs — related content even when the words differ.
          </p>
        ) : null}

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <NotesToolbarSelect
            id="search-type-filter"
            label="Content"
            value={typeFilter}
            onChange={(value) => {
              const nextType = value as SearchContentType;
              setTypeFilter(nextType);
              refetchWithFilters(input, { type: nextType });
            }}
            options={TYPE_OPTIONS}
          />
          <NotesToolbarSelect
            id="search-collection-filter"
            label="Collection"
            value={collectionId ?? ""}
            onChange={onCollectionChange}
            options={[{ value: "", label: "Any collection" }, ...collectionOptions]}
          />
          <NotesToolbarSelect
            id="search-tag-filter"
            label="Tag"
            value={tagId ?? ""}
            onChange={onTagChange}
            options={[{ value: "", label: "Any tag" }, ...tagOptions]}
          />
        </div>

        {hasActiveFilters ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {typeFilter !== "all" ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-mv-panel px-2.5 py-1 text-[0.75rem]">
                {TYPE_OPTIONS.find((o) => o.value === typeFilter)?.label}
              </span>
            ) : null}
            {collectionLabel ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-mv-panel px-2.5 py-1 text-[0.75rem]">
                {collectionLabel}
                <button type="button" aria-label="Clear collection" onClick={() => onCollectionChange("")}>
                  <X className="size-3" />
                </button>
              </span>
            ) : null}
            {tagLabel ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-border bg-mv-panel px-2.5 py-1 text-[0.75rem]">
                {tagLabel}
                <button type="button" aria-label="Clear tag" onClick={() => onTagChange("")}>
                  <X className="size-3" />
                </button>
              </span>
            ) : null}
          </div>
        ) : null}
      </section>

      {error ? (
        <div className="rounded-xl border border-border bg-mv-panel px-3.5 py-3 text-[0.84rem] text-muted-foreground">
          {error}
        </div>
      ) : null}

      {semanticBounded && searched && mode === "semantic" ? (
        <p className="text-[0.78rem] text-mv-faint">
          Showing the strongest semantic matches from a bounded scan — use Load more for the next
          batch, or refine with filters.
        </p>
      ) : null}

      {loading && page === 1 ? (
        <p className="py-16 text-center text-[0.84rem] text-muted-foreground">
          {mode === "semantic" ? "Searching by meaning..." : "Searching..."}
        </p>
      ) : null}

      {!loading && searched && !hasResults ? (
        <section className="rounded-2xl border border-border bg-mv-panel px-6 py-14 text-center">
          <p className="text-[1.1rem] font-medium text-foreground">Nothing matches this search.</p>
          <p className="mt-2 text-[0.86rem] text-muted-foreground">
            {mode === "semantic"
              ? "Try describing it a different way, or switch to Keyword search."
              : "Try different words, filters, or Semantic search."}
          </p>
        </section>
      ) : null}

      {hasResults ? (
        <ul className="grid gap-2.5">
          {items.map((item) => (
            <li key={`${item.kind}-${item.id}`}>
              <SearchResultCard item={item} />
            </li>
          ))}
        </ul>
      ) : null}

      {hasMore && hasResults ? (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            disabled={loadingMore}
            className={vaultSecondaryButton}
            onClick={() => {
              const next = page + 1;
              setPage(next);
              void runSearch(input, next, true);
            }}
          >
            {loadingMore ? "Loading…" : "Load more"}
          </button>
        </div>
      ) : null}
    </motion.div>
  );
}
