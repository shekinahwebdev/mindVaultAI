"use client";

import { motion } from "framer-motion";
import { Archive, LayoutGrid, List, Search, Trash2 } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

import { ContentCard } from "@/components/mv/ContentCard";
import { EmptyState } from "@/components/mv/EmptyState";
import { PageHeader } from "@/components/mv/PageHeader";
import { PageStack } from "@/components/mv/PageStack";
import { NotesToolbarSelect } from "@/components/vault/notes/NotesToolbarSelect";
import { VaultDialog } from "@/components/vault/VaultDialog";
import { useCategories } from "@/lib/categories/use-categories";
import {
  emptyArchiveRequest,
  restoreNoteRequest,
} from "@/lib/notes/archive-client";
import type { ArchiveSortOption } from "@/lib/notes/archive-validation";
import type { SerializedArchivedNoteItem } from "@/lib/notes/archive-types";
import { deleteNoteRequest } from "@/lib/notes/capture-client";
import { captureNoteTypeOptions } from "@/lib/notes/capture-config";
import { useArchiveList } from "@/lib/notes/use-archive-list";
import { vaultRoutes } from "@/lib/routes";
import { toastError, toastSuccess } from "@/lib/vault-toast";
import { cn } from "@/lib/utils";

import {
  vaultDestructiveButton,
  vaultPrimaryButton,
  vaultSecondaryButton,
  vaultSegmentedItemActive,
  vaultSegmentedItemIdle,
  vaultSegmentedTrack,
} from "../vault-controls";
import { vaultEase } from "../vault-motion";

import { ArchiveGridCard } from "./ArchiveGridCard";
import { ArchiveOverview } from "./ArchiveOverview";
import { ArchiveTableRow } from "./ArchiveTableRow";
import { ArchiveTips } from "./ArchiveTips";

type ViewMode = "list" | "grid";

const SORT_OPTIONS: Array<{ value: ArchiveSortOption; label: string }> = [
  { value: "recently_archived", label: "Recently archived" },
  { value: "oldest_archived", label: "Oldest archived" },
  { value: "title_asc", label: "Title (A–Z)" },
];

function ArchiveListSkeleton() {
  return (
    <ContentCard padding="none" className="overflow-hidden">
      <div className="space-y-0 p-4">
        {Array.from({ length: 5 }).map((_, index) => (
          <div
            key={index}
            className="mb-3 h-14 animate-pulse rounded-[var(--mv-radius-control)] bg-mv-panel/60"
          />
        ))}
      </div>
    </ContentCard>
  );
}

export function ArchiveView() {
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sort, setSort] = useState<ArchiveSortOption>("recently_archived");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [emptyOpen, setEmptyOpen] = useState(false);
  const [emptying, setEmptying] = useState(false);

  const { categories } = useCategories();

  const { notes, stats, loading, error, removeNote, clearAll, refresh } =
    useArchiveList({
      typeFilter,
      categoryFilter,
      sort,
      searchQuery: search,
    });

  const categoryOptions = useMemo(
    () => [
      { value: "", label: "All categories" },
      ...categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    ],
    [categories],
  );

  const typeOptions = useMemo(
    () => [
      { value: "", label: "All types" },
      ...captureNoteTypeOptions.map((option) => ({
        value: option.value,
        label: option.label,
      })),
    ],
    [],
  );

  async function handleRestore(item: SerializedArchivedNoteItem) {
    const { data } = await restoreNoteRequest(item.id);
    if (!data?.ok) {
      toastError(data?.message ?? "Could not restore this note.");
      return;
    }
    removeNote(item.id);
    await refresh();
    toastSuccess("Note restored.");
  }

  async function handleDeletePermanent(item: SerializedArchivedNoteItem) {
    const { data } = await deleteNoteRequest(item.id);
    if (!data?.ok) {
      toastError(data?.message ?? "Could not delete this note.");
      return;
    }
    removeNote(item.id);
    await refresh();
    toastSuccess("Note permanently deleted.");
  }

  async function handleEmptyArchive() {
    setEmptying(true);
    const { data } = await emptyArchiveRequest();
    setEmptying(false);
    if (!data?.ok) {
      toastError(data?.message ?? "Could not empty archive.");
      return;
    }
    clearAll();
    await refresh();
    setEmptyOpen(false);
    toastSuccess(
      data.deletedCount === 1
        ? "1 archived note permanently deleted."
        : `${data.deletedCount} archived notes permanently deleted.`,
    );
  }

  const showEmpty = !loading && notes.length === 0 && !search && !typeFilter && !categoryFilter;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: vaultEase }}
    >
      <PageStack className="gap-5">
        <PageHeader
          title={
            <span className="inline-flex items-center gap-2.5">
              <Archive aria-hidden className="size-7 stroke-[1.75] sm:size-8" />
              Archive
            </span>
          }
          lead="View and manage archived notes. Restore them anytime."
          actions={
            <button
              type="button"
              disabled={loading || stats.total === 0}
              onClick={() => setEmptyOpen(true)}
              className={cn(
                vaultPrimaryButton,
                (loading || stats.total === 0) && "opacity-50",
              )}
            >
              <Trash2 aria-hidden className="size-4" />
              Empty Archive
            </button>
          }
        />

        {error ? (
          <p className="text-[0.8125rem] text-red-600 dark:text-red-300" role="alert">
            {error}
          </p>
        ) : null}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,18.5rem)] xl:gap-6">
          <div className="min-w-0 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:flex-wrap lg:items-center">
              <label className="relative min-w-0 flex-1 lg:min-w-[14rem]">
                <span className="sr-only">Search archived notes</span>
                <Search
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-mv-faint"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search archived notes..."
                  className="h-10 w-full rounded-[var(--mv-radius-control)] border border-border bg-mv-panel py-2 pr-3 pl-9 text-[0.8125rem] text-foreground outline-none placeholder:text-mv-faint focus-visible:border-foreground/25 focus-visible:ring-2 focus-visible:ring-ring/30"
                />
              </label>

              <div className="flex flex-wrap items-center gap-2">
                <NotesToolbarSelect
                  id="archive-type"
                  label="Type"
                  value={typeFilter}
                  onChange={setTypeFilter}
                  options={typeOptions}
                />
                <NotesToolbarSelect
                  id="archive-category"
                  label="Category"
                  value={categoryFilter}
                  onChange={setCategoryFilter}
                  options={categoryOptions}
                />
                <NotesToolbarSelect
                  id="archive-sort"
                  label="Sort by"
                  value={sort}
                  onChange={(value) => setSort(value as ArchiveSortOption)}
                  options={SORT_OPTIONS}
                />
                <div className={vaultSegmentedTrack}>
                  <button
                    type="button"
                    aria-pressed={viewMode === "list"}
                    onClick={() => setViewMode("list")}
                    className={cn(
                      "inline-flex min-h-9 items-center gap-1.5 px-2.5 text-[0.75rem] font-medium",
                      viewMode === "list"
                        ? vaultSegmentedItemActive
                        : vaultSegmentedItemIdle,
                    )}
                  >
                    <List aria-hidden className="size-3.5" />
                    List
                  </button>
                  <button
                    type="button"
                    aria-pressed={viewMode === "grid"}
                    onClick={() => setViewMode("grid")}
                    className={cn(
                      "inline-flex min-h-9 items-center gap-1.5 px-2.5 text-[0.75rem] font-medium",
                      viewMode === "grid"
                        ? vaultSegmentedItemActive
                        : vaultSegmentedItemIdle,
                    )}
                  >
                    <LayoutGrid aria-hidden className="size-3.5" />
                    Grid
                  </button>
                </div>
              </div>
            </div>

            {loading ? (
              <ArchiveListSkeleton />
            ) : showEmpty ? (
              <EmptyState
                variant="dashed"
                title="Archive is empty"
                description="Notes you archive will appear here and can be restored anytime."
                action={
                  <Link href={vaultRoutes.notes} className={vaultSecondaryButton}>
                    View all notes
                  </Link>
                }
              />
            ) : notes.length === 0 ? (
              <EmptyState
                variant="solid"
                title="Nothing matches this view."
                description="Try changing your search or filters."
              />
            ) : viewMode === "list" ? (
              <ContentCard padding="none" className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[880px] border-collapse text-left">
                    <thead>
                      <tr className="border-b border-border bg-mv-panel/40 text-[0.6875rem] font-semibold tracking-[0.04em] text-muted-foreground uppercase">
                        <th scope="col" className="w-10 px-3 py-3">
                          <span
                            className="inline-block size-4 rounded-[4px] border border-border/80"
                            aria-hidden
                          />
                        </th>
                        <th
                          scope="col"
                          className="px-2 py-3 font-semibold normal-case tracking-normal"
                        >
                          Title
                        </th>
                        <th
                          scope="col"
                          className="hidden w-[6.5rem] px-2 py-3 font-semibold normal-case tracking-normal md:table-cell"
                        >
                          Type
                        </th>
                        <th
                          scope="col"
                          className="hidden w-[7rem] px-2 py-3 font-semibold normal-case tracking-normal lg:table-cell"
                        >
                          Category
                        </th>
                        <th
                          scope="col"
                          className="hidden min-w-[8rem] px-2 py-3 font-semibold normal-case tracking-normal xl:table-cell"
                        >
                          Tags
                        </th>
                        <th
                          scope="col"
                          className="w-[6.5rem] px-2 py-3 font-semibold normal-case tracking-normal"
                        >
                          Archived on
                        </th>
                        <th
                          scope="col"
                          className="w-[9.5rem] px-2 py-3 text-right font-semibold normal-case tracking-normal"
                        >
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {notes.map((item) => (
                        <ArchiveTableRow
                          key={item.id}
                          item={item}
                          onRestore={handleRestore}
                          onDeletePermanent={handleDeletePermanent}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </ContentCard>
            ) : (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                {notes.map((item) => (
                  <ArchiveGridCard
                    key={item.id}
                    item={item}
                    onRestore={handleRestore}
                    onDeletePermanent={handleDeletePermanent}
                  />
                ))}
              </ul>
            )}
          </div>

          <aside className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-4 xl:self-start">
            <ArchiveOverview stats={stats} loading={loading} />
            <ArchiveTips />
          </aside>
        </div>
      </PageStack>

      <VaultDialog
        open={emptyOpen}
        title="Empty archive permanently?"
        description="This permanently deletes all archived notes. This action cannot be undone."
        onClose={() => setEmptyOpen(false)}
      >
        <p className="text-[0.8125rem] text-muted-foreground">
          {stats.total === 1
            ? "1 archived note will be permanently deleted. Active notes are not affected."
            : `${stats.total} archived notes will be permanently deleted. Active notes are not affected.`}
        </p>
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => setEmptyOpen(false)}
            className={vaultSecondaryButton}
            disabled={emptying}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleEmptyArchive()}
            className={vaultDestructiveButton}
            disabled={emptying}
          >
            {emptying ? "Deleting…" : "Empty archive"}
          </button>
        </div>
      </VaultDialog>
    </motion.div>
  );
}
