"use client";

import { motion } from "framer-motion";
import { Plus, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { NoteCard } from "@/components/vault/notes/NoteCard";
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

import {
  vaultMetaClassName,
  vaultPageLeadClassName,
  vaultPageTitleClassName,
  vaultPrimaryButton,
  vaultSecondaryButton,
} from "../vault-controls";

import { vaultEase } from "../vault-motion";

const filterSelectClassName =
  "min-h-10 w-full appearance-none rounded-[var(--radius-input)] border border-border bg-mv-panel px-3 py-2 pr-8 text-[0.82rem] text-foreground outline-none focus:border-foreground/25";

const filterLabelClassName =
  "text-[0.72rem] font-medium text-mv-faint";

function FilterSelect({
  id,
  label,
  value,
  onChange,
  options,
  disabled,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
}) {
  return (
    <label className="flex min-w-0 flex-1 flex-col gap-1.5">
      <span className={filterLabelClassName}>{label}</span>
      <div className="relative">
        <select
          id={id}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          className={cn(
            filterSelectClassName,
            disabled && "cursor-not-allowed opacity-60",
          )}
        >
          {options.map((option) => (
            <option
              key={option.value}
              value={option.value}
              className="bg-surface text-foreground"
            >
              {option.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[0.65rem] text-mv-faint"
        >
          ▼
        </span>
      </div>
    </label>
  );
}

export function NotesView() {
  const searchDebounceRef = useRef<number | null>(null);

  const [typeFilter, setTypeFilter] = useState("");
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
    () =>
      Boolean(typeFilter || categoryFilter || searchQuery.trim()),
    [categoryFilter, searchQuery, typeFilter],
  );

  function resetToFirstPage() {
    if (page !== 1) {
      setPage(1);
    }
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

    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = window.setTimeout(() => {
      setSearchQuery(value);
      resetToFirstPage();
    }, 300);
  }

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  const noteCountLabel =
    total === 1 ? "1 note" : `${total.toLocaleString()} notes`;

  const typeOptions = [
    { value: "", label: "All types" },
    ...captureNoteTypeOptions.map((option) => ({
      value: option.value,
      label: option.label,
    })),
  ];

  const categoryOptions = [
    { value: "", label: "All categories" },
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
      className="space-y-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className={vaultPageTitleClassName}>All notes</h1>
          <p className={cn(vaultPageLeadClassName, "max-w-xl")}>
            Everything you&apos;ve saved, in one place.
          </p>
          {!loading && !error ? (
            <p className={cn("mt-2", vaultMetaClassName)}>{noteCountLabel}</p>
          ) : null}
        </div>
        <Link
          href={vaultRoutes.capture}
          className={vaultPrimaryButton}
        >
          <Plus aria-hidden className="size-4" />
          Add Note
        </Link>
      </div>

      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-4 sm:p-5 shadow-[0_1px_2px_rgb(0_0_0/0.03)]">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <label className="flex min-w-0 flex-col gap-1.5 lg:col-span-1">
            <span className={filterLabelClassName}>Search</span>
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-mv-faint"
              />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => handleSearchInputChange(event.target.value)}
                placeholder="Search title or content..."
                className="min-h-10 w-full rounded-[var(--radius-input)] border border-border bg-mv-panel py-2 pr-3 pl-9 text-[0.82rem] text-foreground outline-none placeholder:text-mv-faint focus:border-foreground/25"
              />
            </div>
          </label>

          <FilterSelect
            id="notes-type-filter"
            label="Type"
            value={typeFilter}
            onChange={handleTypeChange}
            options={typeOptions}
          />

          <FilterSelect
            id="notes-category-filter"
            label="Category"
            value={categoryFilter}
            onChange={handleCategoryChange}
            options={categoryOptions}
            disabled={categoriesLoading}
          />

          <FilterSelect
            id="notes-sort"
            label="Sort"
            value={sort}
            onChange={handleSortChange}
            options={sortOptions}
          />
        </div>
      </section>

      {error ? (
        <div className="rounded-xl border border-border bg-mv-panel px-3.5 py-3 text-[0.84rem] text-muted-foreground">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="py-16 text-center text-[0.84rem] text-muted-foreground">
          Loading notes...
        </p>
      ) : showEmptyVault ? (
        <section className="rounded-2xl border border-dashed border-border bg-mv-panel px-6 py-14 text-center">
          <p className="text-[1.2rem] font-medium text-foreground sm:text-[1.35rem]">
            Nothing in your vault yet.
          </p>
          <p className="mt-2 text-[0.86rem] text-muted-foreground">
            Capture something worth remembering.
          </p>
          <Link
            href={vaultRoutes.capture}
            className={`mt-6 ${vaultSecondaryButton}`}
          >
            <Plus aria-hidden className="size-3.5" />
            Add your first note
          </Link>
        </section>
      ) : showNoResults ? (
        <section className="rounded-2xl border border-border bg-mv-panel px-6 py-14 text-center">
          <p className="text-[1.1rem] font-medium text-foreground">
            Nothing matches this view.
          </p>
          <p className="mt-2 text-[0.86rem] text-muted-foreground">
            Try changing your filters or search.
          </p>
        </section>
      ) : (
        <>
          <ul className="grid gap-2.5">
            {notes.map((note) => (
              <li key={note.id}>
                <NoteCard note={note} />
              </li>
            ))}
          </ul>

          {canLoadMore ? (
            <div className="flex justify-center pt-2">
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
    </motion.div>
  );
}
