"use client";

import { motion } from "framer-motion";
import { ArrowUpDown, Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { ContentCard } from "@/components/mv/ContentCard";
import { EmptyState } from "@/components/mv/EmptyState";
import { PageHeader } from "@/components/mv/PageHeader";
import { PageStack } from "@/components/mv/PageStack";
import { NOTE_DELETE_FLASH_KEY } from "@/lib/notes/capture-client";
import { captureNoteTypeOptions } from "@/lib/notes/capture-config";
import {
  NOTE_SORT_LABELS,
  NOTE_SORT_OPTIONS,
  type NoteSortOption,
  UNCategorized_CATEGORY_FILTER,
} from "@/lib/notes/notes-list-config";
import { useNotesList } from "@/lib/notes/use-notes-list";
import { useCategories } from "@/lib/categories/use-categories";
import { vaultRoutes } from "@/lib/routes";
import { toastSuccess } from "@/lib/vault-toast";
import { cn } from "@/lib/utils";

import { vaultPrimaryButton, vaultSecondaryButton } from "../vault-controls";
import { vaultEase } from "../vault-motion";

import { NotesTableRow } from "./NotesTableRow";
import { NotesToolbarSelect } from "./NotesToolbarSelect";

type NotesViewProps = {
  presetType?: string;
  pageTitle?: string;
  pageLead?: string;
};

export function NotesView({
  presetType,
  pageTitle = "All Notes",
  pageLead = "Everything you've saved, in one place.",
}: NotesViewProps = {}) {
  const searchDebounceRef = useRef<number | null>(null);
  const typeLocked = Boolean(presetType);

  const [typeFilter, setTypeFilter] = useState(presetType ?? "");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sort, setSort] = useState<NoteSortOption>("updated_desc");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const message = sessionStorage.getItem(NOTE_DELETE_FLASH_KEY);
    if (message) {
      sessionStorage.removeItem(NOTE_DELETE_FLASH_KEY);
      toastSuccess(message);
    }
  }, []);

  const { categories, loading: categoriesLoading } = useCategories();
  const { notes, total, totalPages, loading, loadingMore, error } = useNotesList(
    {
      typeFilter,
      categoryFilter,
      sort,
      searchQuery,
      page,
    },
  );

  const hasActiveFilters = useMemo(
    () => Boolean(typeFilter || categoryFilter || searchQuery.trim()),
    [categoryFilter, searchQuery, typeFilter],
  );

  function resetToFirstPage() {
    if (page !== 1) setPage(1);
  }

  function handleTypeChange(value: string) {
    setTypeFilter(value);
    resetToFirstPage();
  }

  function handleCategoryChange(value: string) {
    setCategoryFilter(value);
    resetToFirstPage();
  }

  function handleSortChange(value: string) {
    if (NOTE_SORT_OPTIONS.includes(value as NoteSortOption)) {
      setSort(value as NoteSortOption);
      resetToFirstPage();
    }
  }

  function handleSearchInputChange(value: string) {
    setSearchInput(value);
    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = window.setTimeout(() => {
      setSearchQuery(value);
      resetToFirstPage();
    }, 300);
  }

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);
    };
  }, []);

  const typeOptions = [
    { value: "", label: "Type" },
    ...captureNoteTypeOptions.map((option) => ({
      value: option.value,
      label: option.label,
    })),
  ];

  const categoryOptions = [
    { value: "", label: "Category" },
    { value: UNCategorized_CATEGORY_FILTER, label: "Uncategorized" },
    ...categories.map((category) => ({
      value: category.id,
      label: category.name,
    })),
  ];

  const sortOptions = NOTE_SORT_OPTIONS.map((option) => ({
    value: option,
    label: NOTE_SORT_LABELS[option],
  }));

  const showEmptyVault = !loading && !error && total === 0 && !hasActiveFilters;
  const showNoResults = !loading && !error && total === 0 && hasActiveFilters;
  const canLoadMore = page < totalPages;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: vaultEase }}
    >
      <PageStack className="gap-5">
        <PageHeader
          title={pageTitle}
          lead={pageLead}
          actions={
            <Link href={vaultRoutes.capture} className={vaultPrimaryButton}>
              <Plus aria-hidden className="size-4" />
              Add Note
            </Link>
          }
        />

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search notes</span>
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-mv-faint"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => handleSearchInputChange(event.target.value)}
              placeholder="Search notes..."
              className="h-10 w-full rounded-[var(--mv-radius-control)] border border-border bg-mv-panel py-2 pr-3 pl-9 text-[0.8125rem] text-foreground outline-none placeholder:text-mv-faint focus-visible:border-foreground/25 focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </label>
          <div className="flex flex-wrap gap-2 sm:flex-nowrap">
            <NotesToolbarSelect
              id="notes-type-filter"
              label="Type"
              value={typeFilter}
              onChange={handleTypeChange}
              disabled={typeLocked}
              options={typeOptions}
            />
            <NotesToolbarSelect
              id="notes-category-filter"
              label="Category"
              value={categoryFilter}
              onChange={handleCategoryChange}
              disabled={categoriesLoading}
              options={categoryOptions}
            />
            <NotesToolbarSelect
              id="notes-sort"
              label="Sort"
              value={sort}
              onChange={handleSortChange}
              options={sortOptions}
            />
          </div>
        </div>

        {error ? (
          <div className="rounded-[var(--mv-radius-card)] border border-border bg-mv-panel px-4 py-3 text-[0.8125rem] text-muted-foreground">
            {error}
          </div>
        ) : null}

        <ContentCard padding="none" className="overflow-hidden">
          {loading ? (
            <p className="py-16 text-center text-[0.8125rem] text-muted-foreground">
              Loading notes...
            </p>
          ) : showEmptyVault ? (
            <EmptyState
              variant="dashed"
              className="py-14"
              title="Nothing in your vault yet."
              description="Capture something worth remembering."
              action={
                <Link href={vaultRoutes.capture} className={vaultSecondaryButton}>
                  <Plus aria-hidden className="size-3.5" />
                  Add your first note
                </Link>
              }
            />
          ) : showNoResults ? (
            <EmptyState
              variant="solid"
              className="py-14"
              title="Nothing matches this view."
              description="Try changing your filters or search."
            />
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse text-left">
                  <thead>
                    <tr className="border-b border-border bg-mv-panel/40 text-[0.6875rem] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                      <th scope="col" className="w-10 px-3 py-3">
                        <span className="inline-block size-4 rounded-[4px] border border-border/80" aria-hidden />
                      </th>
                      <th scope="col" className="px-2 py-3 font-semibold normal-case tracking-normal">
                        Title
                      </th>
                      <th
                        scope="col"
                        className="hidden w-[8.5rem] px-2 py-3 font-semibold normal-case tracking-normal sm:table-cell"
                      >
                        <span className="inline-flex items-center gap-1">
                          Category
                          <ArrowUpDown aria-hidden className="size-3 opacity-50" />
                        </span>
                      </th>
                      <th
                        scope="col"
                        className="hidden w-[5.5rem] px-2 py-3 font-semibold normal-case tracking-normal md:table-cell"
                      >
                        <span className="inline-flex items-center gap-1">
                          Type
                          <ArrowUpDown aria-hidden className="size-3 opacity-50" />
                        </span>
                      </th>
                      <th scope="col" className="w-[5.5rem] px-2 py-3 font-semibold normal-case tracking-normal">
                        Updated
                      </th>
                      <th scope="col" className="w-10 px-2 py-3">
                        <span className="sr-only">Actions</span>
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {notes.map((note) => (
                      <NotesTableRow key={note.id} note={note} />
                    ))}
                  </tbody>
                </table>
              </div>

              {canLoadMore ? (
                <div className="flex justify-center border-t border-border px-4 py-4">
                  <button
                    type="button"
                    onClick={() => setPage((current) => current + 1)}
                    disabled={loadingMore}
                    className={vaultSecondaryButton}
                  >
                    {loadingMore ? "Loading..." : "Load more"}
                  </button>
                </div>
              ) : null}
            </>
          )}
        </ContentCard>
      </PageStack>
    </motion.div>
  );
}
