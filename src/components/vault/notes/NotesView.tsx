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
import { cn } from "@/lib/utils";

import { vaultEase } from "../vault-motion";

const filterSelectClassName =
  "min-h-10 w-full appearance-none rounded-xl border border-white/12 bg-white/[0.035] px-3 py-2 pr-8 text-[0.82rem] text-brand-ink outline-none focus:border-white/28";

const filterLabelClassName =
  "text-[0.62rem] tracking-[0.16em] text-white/42 uppercase";

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
              className="bg-[#111114] text-brand-ink"
            >
              {option.label}
            </option>
          ))}
        </select>
        <span
          aria-hidden
          className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-[0.65rem] text-white/35"
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
  const [flashMessage, setFlashMessage] = useState(() => {
    if (typeof window === "undefined") {
      return "";
    }

    const message = sessionStorage.getItem(NOTE_DELETE_FLASH_KEY);
    if (message) {
      sessionStorage.removeItem(NOTE_DELETE_FLASH_KEY);
    }
    return message ?? "";
  });

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
          <h1 className="font-editorial text-[1.55rem] text-brand-ink italic sm:text-[1.85rem]">
            All Notes
          </h1>
          <p className="mt-2 max-w-xl text-[0.88rem] leading-relaxed text-white/46">
            Everything you&apos;ve saved, in one place.
          </p>
          {!loading && !error ? (
            <p className="mt-2 text-[0.74rem] tracking-[0.1em] text-white/34 uppercase">
              {noteCountLabel}
            </p>
          ) : null}
        </div>
        <Link
          href={vaultRoutes.capture}
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-brand-ink px-4 text-[0.74rem] tracking-[0.14em] text-brand-void uppercase transition-opacity hover:opacity-90"
        >
          <Plus aria-hidden className="size-4" />
          Add Note
        </Link>
      </div>

      {flashMessage ? (
        <p
          role="status"
          className="rounded-xl border border-white/14 bg-white/[0.05] px-3.5 py-3 text-[0.84rem] text-brand-ink"
        >
          {flashMessage}
        </p>
      ) : null}

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.18)] sm:p-5">
        <div className="grid gap-3 lg:grid-cols-[minmax(0,1.4fr)_repeat(3,minmax(0,1fr))]">
          <label className="flex min-w-0 flex-col gap-1.5 lg:col-span-1">
            <span className={filterLabelClassName}>Search</span>
            <div className="relative">
              <Search
                aria-hidden
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/30"
              />
              <input
                type="search"
                value={searchInput}
                onChange={(event) => handleSearchInputChange(event.target.value)}
                placeholder="Search title or content..."
                className="min-h-10 w-full rounded-xl border border-white/12 bg-white/[0.035] py-2 pr-3 pl-9 text-[0.82rem] text-brand-ink outline-none placeholder:text-white/28 focus:border-white/28"
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
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-[0.84rem] text-white/58">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="py-16 text-center text-[0.84rem] text-white/42">
          Loading notes...
        </p>
      ) : showEmptyVault ? (
        <section className="rounded-2xl border border-dashed border-white/[0.1] bg-black/10 px-6 py-14 text-center">
          <p className="font-editorial text-[1.2rem] text-brand-ink italic sm:text-[1.35rem]">
            Nothing in your vault yet.
          </p>
          <p className="mt-2 text-[0.86rem] text-white/42">
            Capture something worth remembering.
          </p>
          <Link
            href={vaultRoutes.capture}
            className="mt-6 inline-flex items-center gap-2 rounded-full border border-white/16 px-4 py-2 text-[0.74rem] tracking-[0.14em] text-white/72 uppercase transition-colors hover:border-white/24 hover:text-white/88"
          >
            <Plus aria-hidden className="size-3.5" />
            Add your first note
          </Link>
        </section>
      ) : showNoResults ? (
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-14 text-center">
          <p className="font-editorial text-[1.1rem] text-brand-ink italic">
            Nothing matches this view.
          </p>
          <p className="mt-2 text-[0.86rem] text-white/42">
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
                className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/12 px-5 text-[0.74rem] tracking-[0.12em] text-white/62 uppercase transition-colors hover:border-white/20 hover:text-white/82 disabled:cursor-not-allowed disabled:opacity-60"
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
