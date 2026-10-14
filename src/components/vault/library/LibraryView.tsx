"use client";

import { Search } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { EmptyState } from "@/components/mv/EmptyState";
import { PageHeader } from "@/components/mv/PageHeader";
import { PageStack } from "@/components/mv/PageStack";
import {
  LIBRARY_SORT_LABELS,
  LIBRARY_SORT_OPTIONS,
  type LibrarySortOption,
  type LibraryTypeFilter,
} from "@/lib/library/library-list-config";
import { useLibraryList } from "@/lib/library/use-library-list";

import { vaultSecondaryButton } from "../vault-controls";
import { NotesToolbarSelect } from "../notes/NotesToolbarSelect";

import { LibraryItemCard } from "./LibraryItemCard";

const TYPE_FILTER_OPTIONS: { value: LibraryTypeFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "note", label: "Notes" },
  { value: "document", label: "Documents" },
];

export function LibraryView() {
  const searchDebounceRef = useRef<number | null>(null);
  const [typeFilter, setTypeFilter] = useState<LibraryTypeFilter>("all");
  const [sort, setSort] = useState<LibrarySortOption>("updated_desc");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current !== null) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  const { items, total, totalPages, loading, loadingMore, error } = useLibraryList({
    typeFilter,
    sort,
    searchQuery,
    page,
  });

  const hasActiveFilters = useMemo(
    () => Boolean(typeFilter !== "all" || searchQuery.trim()),
    [searchQuery, typeFilter],
  );

  function resetToFirstPage() {
    if (page !== 1) {
      setPage(1);
    }
  }

  function handleSearchChange(value: string) {
    setSearchInput(value);
    if (searchDebounceRef.current !== null) {
      window.clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = window.setTimeout(() => {
      setSearchQuery(value);
      resetToFirstPage();
    }, 300);
  }

  return (
    <PageStack>
      <PageHeader
        title="Library"
        lead="Notes and PDFs from your vault in one place."
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
        <label className="relative min-w-[12rem] flex-1">
          <span className="sr-only">Search library</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-mv-faint"
          />
          <input
            type="search"
            value={searchInput}
            onChange={(event) => handleSearchChange(event.target.value)}
            placeholder="Search titles and text…"
            className="h-10 w-full rounded-[var(--mv-radius-control)] border border-border bg-surface pl-9 pr-3 text-[0.875rem] text-foreground outline-none placeholder:text-mv-faint"
          />
        </label>

        <NotesToolbarSelect
          id="library-type-filter"
          label="Content type"
          value={typeFilter}
          onChange={(value) => {
            setTypeFilter(value as LibraryTypeFilter);
            resetToFirstPage();
          }}
          options={TYPE_FILTER_OPTIONS}
        />

        <NotesToolbarSelect
          id="library-sort"
          label="Sort"
          value={sort}
          onChange={(value) => {
            setSort(value as LibrarySortOption);
            resetToFirstPage();
          }}
          options={LIBRARY_SORT_OPTIONS.map((option) => ({
            value: option,
            label: LIBRARY_SORT_LABELS[option],
          }))}
        />
      </div>

      {error ? (
        <p className="rounded-[var(--mv-radius-control)] border border-border bg-mv-panel px-4 py-3 text-[0.875rem] text-muted-foreground">
          {error}
        </p>
      ) : null}

      {loading && page === 1 ? (
        <p className="text-[0.875rem] text-muted-foreground">Loading your library…</p>
      ) : null}

      {!loading && items.length === 0 ? (
        <EmptyState
          title={hasActiveFilters ? "No matches" : "Your library is empty"}
          description={
            hasActiveFilters
              ? "Try a different search or filter."
              : "Save notes or upload PDFs to see them here."
          }
        />
      ) : null}

      {items.length > 0 ? (
        <ul className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {items.map((item) => (
            <li key={`${item.kind}-${item.id}`}>
              <LibraryItemCard item={item} />
            </li>
          ))}
        </ul>
      ) : null}

      {page < totalPages ? (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            disabled={loadingMore}
            onClick={() => setPage((current) => current + 1)}
            className={vaultSecondaryButton}
          >
            {loadingMore ? "Loading…" : `Load more (${items.length} of ${total})`}
          </button>
        </div>
      ) : null}
    </PageStack>
  );
}
