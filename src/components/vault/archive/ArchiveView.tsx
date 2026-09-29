"use client";

import { motion } from "framer-motion";
import { Archive, LayoutGrid, List, Search, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";

import { ContentCard } from "@/components/mv/ContentCard";
import { EmptyState } from "@/components/mv/EmptyState";
import { PageHeader } from "@/components/mv/PageHeader";
import { PageStack } from "@/components/mv/PageStack";
import { NotesToolbarSelect } from "@/components/vault/notes/NotesToolbarSelect";
import { VaultDialog } from "@/components/vault/VaultDialog";
import { captureNoteTypeOptions } from "@/lib/notes/capture-config";
import {
  DEMO_ARCHIVED_ITEMS,
  type ArchivedVaultItem,
} from "@/lib/vault/archive-demo-data";
import { toastSuccess } from "@/lib/vault-toast";
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

type SortOption = "archived_desc" | "archived_asc" | "title_asc";
type ViewMode = "list" | "grid";

const SORT_OPTIONS: Array<{ value: SortOption; label: string }> = [
  { value: "archived_desc", label: "Recently archived" },
  { value: "archived_asc", label: "Oldest archived" },
  { value: "title_asc", label: "Title (A–Z)" },
];

function sortItems(items: ArchivedVaultItem[], sort: SortOption) {
  const next = [...items];
  if (sort === "archived_desc") {
    next.sort(
      (a, b) =>
        new Date(b.archivedAt).getTime() - new Date(a.archivedAt).getTime(),
    );
  } else if (sort === "archived_asc") {
    next.sort(
      (a, b) =>
        new Date(a.archivedAt).getTime() - new Date(b.archivedAt).getTime(),
    );
  } else {
    next.sort((a, b) => a.title.localeCompare(b.title));
  }
  return next;
}

export function ArchiveView() {
  const [items, setItems] = useState<ArchivedVaultItem[]>(() => [
    ...DEMO_ARCHIVED_ITEMS,
  ]);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sort, setSort] = useState<SortOption>("archived_desc");
  const [viewMode, setViewMode] = useState<ViewMode>("list");
  const [emptyOpen, setEmptyOpen] = useState(false);

  const categoryOptions = useMemo(() => {
    const names = [...new Set(items.map((item) => item.category))].sort();
    return [
      { value: "", label: "All categories" },
      ...names.map((name) => ({ value: name, label: name })),
    ];
  }, [items]);

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

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const next = items.filter((item) => {
      if (typeFilter && item.type !== typeFilter) return false;
      if (categoryFilter && item.category !== categoryFilter) return false;
      if (!query) return true;
      const haystack = [
        item.title,
        item.description,
        item.category,
        ...item.tags,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(query);
    });
    return sortItems(next, sort);
  }, [categoryFilter, items, search, sort, typeFilter]);

  function handleRestore(item: ArchivedVaultItem) {
    setItems((current) => current.filter((row) => row.id !== item.id));
    toastSuccess(`“${item.title}” restored to your vault (preview).`);
  }

  function handleEmptyArchive() {
    setItems([]);
    setEmptyOpen(false);
    toastSuccess("Archive cleared (preview).");
  }

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
          lead="View and manage your archived notes. Archived notes are hidden from your main view but can be restored anytime."
          actions={
            <button
              type="button"
              disabled={items.length === 0}
              onClick={() => setEmptyOpen(true)}
              className={cn(vaultPrimaryButton, items.length === 0 && "opacity-50")}
            >
              <Trash2 aria-hidden className="size-4" />
              Empty Archive
            </button>
          }
        />

        <p className="text-[0.75rem] leading-relaxed text-mv-faint">
          Preview UI with sample archived items. Restore and empty actions update this
          page only until archive syncs with your vault API.
        </p>

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
                  onChange={(value) => setSort(value as SortOption)}
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

            {items.length === 0 ? (
              <EmptyState
                variant="dashed"
                title="Your archive is empty."
                description="When you archive notes from your vault, they will appear here."
              />
            ) : visibleItems.length === 0 ? (
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
                      {visibleItems.map((item) => (
                        <ArchiveTableRow
                          key={item.id}
                          item={item}
                          onRestore={handleRestore}
                        />
                      ))}
                    </tbody>
                  </table>
                </div>
              </ContentCard>
            ) : (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-2">
                {visibleItems.map((item) => (
                  <ArchiveGridCard key={item.id} item={item} onRestore={handleRestore} />
                ))}
              </ul>
            )}
          </div>

          <aside className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-4 xl:self-start">
            <ArchiveOverview items={items} />
            <ArchiveTips />
          </aside>
        </div>
      </PageStack>

      <VaultDialog
        open={emptyOpen}
        title="Empty archive?"
        description="This removes every archived item from this preview list. Your live vault notes are not changed until archive ships."
        onClose={() => setEmptyOpen(false)}
      >
        <p className="text-[0.8125rem] text-muted-foreground">
          {items.length === 1
            ? "1 item will be removed from the archive view."
            : `${items.length} items will be removed from the archive view.`}
        </p>
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => setEmptyOpen(false)}
            className={vaultSecondaryButton}
          >
            Cancel
          </button>
          <button type="button" onClick={handleEmptyArchive} className={vaultDestructiveButton}>
            Empty archive
          </button>
        </div>
      </VaultDialog>
    </motion.div>
  );
}
