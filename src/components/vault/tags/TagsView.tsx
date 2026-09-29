"use client";

import { motion } from "framer-motion";
import {
  LayoutGrid,
  List,
  Search,
  Tag,
  Tags,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ContentCard } from "@/components/mv/ContentCard";
import { EmptyState } from "@/components/mv/EmptyState";
import { PageHeader } from "@/components/mv/PageHeader";
import { PageStack } from "@/components/mv/PageStack";
import { CategoryNameField } from "@/components/vault/categories/CategoryNameField";
import { VaultDialog } from "@/components/vault/VaultDialog";
import { NotesToolbarSelect } from "@/components/vault/notes/NotesToolbarSelect";
import { routes, vaultRoutes } from "@/lib/routes";
import { TAG_DUPLICATE_MESSAGE } from "@/lib/tags/tag-errors";
import { validateTagName } from "@/lib/tags/tag-validation";
import {
  createTag,
  deleteTag,
  fetchTags,
  getMutationFieldError,
  renameTag,
  TAG_CLIENT_ERROR,
  TAG_CREATED_MESSAGE,
  TAG_DELETED_MESSAGE,
  TAG_LOAD_ERROR,
  TAG_RENAMED_MESSAGE,
  type SerializedTag,
  type TagSortOption,
  type TagStats,
  type TagUsageFilter,
} from "@/lib/tags/tags-client";
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

import { TagCard } from "./TagCard";
import { TagListRow } from "./TagListRow";
import { TagsInsights } from "./TagsInsights";
import { TagsQuickActions } from "./TagsQuickActions";
import { TagStatCard } from "./TagStatCard";

type FilterOption = TagUsageFilter;
type ViewMode = "grid" | "list";

const SEARCH_DEBOUNCE_MS = 300;

const SORT_OPTIONS: Array<{ value: TagSortOption; label: string }> = [
  { value: "most_used", label: "Most used" },
  { value: "least_used", label: "Least used" },
  { value: "name_asc", label: "Name (A–Z)" },
];

const FILTER_OPTIONS: Array<{ value: FilterOption; label: string }> = [
  { value: "all", label: "All tags" },
  { value: "used", label: "Used" },
  { value: "unused", label: "Unused" },
];

const DELETE_DIALOG_DESCRIPTION =
  "Deleting this tag removes the tag from notes using it. The notes themselves will not be deleted.";

function TagsListSkeleton({ viewMode }: { viewMode: ViewMode }) {
  if (viewMode === "list") {
    return (
      <ContentCard className="overflow-hidden p-0" aria-busy="true" aria-label="Loading tags">
        <ul>
          {Array.from({ length: 6 }, (_, index) => (
            <li
              key={index}
              className="flex animate-pulse items-center gap-3 border-b border-border px-4 py-3.5 last:border-b-0"
            >
              <span className="size-8 rounded-full bg-mv-panel" />
              <span className="h-4 flex-1 rounded bg-mv-panel" />
            </li>
          ))}
        </ul>
      </ContentCard>
    );
  }

  return (
    <ul
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
      aria-busy="true"
      aria-label="Loading tags"
    >
      {Array.from({ length: 6 }, (_, index) => (
        <li
          key={index}
          className="animate-pulse rounded-[var(--mv-radius-card)] border border-border bg-mv-panel/40 p-4"
        >
          <span className="mb-3 block size-9 rounded-full bg-mv-panel" />
          <span className="mb-2 block h-4 w-2/3 rounded bg-mv-panel" />
          <span className="block h-3 w-1/3 rounded bg-mv-panel" />
        </li>
      ))}
    </ul>
  );
}

function TagsStatsSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3" aria-busy="true">
      {Array.from({ length: 3 }, (_, index) => (
        <div
          key={index}
          className="animate-pulse rounded-[var(--mv-radius-card)] border border-border px-4 py-3.5"
        >
          <span className="block h-3 w-24 rounded bg-mv-panel" />
          <span className="mt-2 block h-7 w-16 rounded bg-mv-panel" />
        </div>
      ))}
    </div>
  );
}

export function TagsView() {
  const router = useRouter();
  const submittingRef = useRef(false);
  const listAbortRef = useRef<AbortController | null>(null);
  const listRequestIdRef = useRef(0);
  const initialLoadRef = useRef(true);
  const searchDebounceRef = useRef<number | null>(null);

  const [tags, setTags] = useState<SerializedTag[]>([]);
  const [stats, setStats] = useState<TagStats | null>(null);
  const [mostInsights, setMostInsights] = useState<SerializedTag[]>([]);
  const [fullTagsSnapshot, setFullTagsSnapshot] = useState<SerializedTag[]>([]);

  const [initialLoading, setInitialLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [reloadNonce, setReloadNonce] = useState(0);

  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sort, setSort] = useState<TagSortOption>("most_used");
  const [filter, setFilter] = useState<FilterOption>("all");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [createOpen, setCreateOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<SerializedTag | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SerializedTag | null>(null);
  const [name, setName] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [formError, setFormError] = useState("");

  const [creating, setCreating] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const selectedTag = useMemo(
    () => tags.find((tag) => tag.id === selectedId) ?? null,
    [selectedId, tags],
  );

  const leastInsights = useMemo(() => {
    return [...fullTagsSnapshot]
      .sort((a, b) => a.noteCount - b.noteCount || a.name.localeCompare(b.name))
      .slice(0, 5);
  }, [fullTagsSnapshot]);

  const hasActiveFilters =
    filter !== "all" || debouncedSearch.trim().length > 0;

  const isVaultEmpty =
    !initialLoading &&
    !loadError &&
    stats !== null &&
    stats.totalTags === 0 &&
    !hasActiveFilters;

  useEffect(() => {
    if (searchDebounceRef.current !== null) {
      window.clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = window.setTimeout(() => {
      setDebouncedSearch(search);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      if (searchDebounceRef.current !== null) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
  }, [search]);

  const reloadTags = useCallback(() => {
    setReloadNonce((value) => value + 1);
  }, []);

  useEffect(() => {
    listAbortRef.current?.abort();
    const controller = new AbortController();
    listAbortRef.current = controller;

    const requestId = ++listRequestIdRef.current;
    let cancelled = false;

    void (async () => {
      try {
        const { response, data } = await fetchTags({
          q: debouncedSearch,
          sort,
          filter,
          signal: controller.signal,
        });

        if (
          cancelled ||
          controller.signal.aborted ||
          requestId !== listRequestIdRef.current
        ) {
          return;
        }

        if (response.status === 401) {
          router.push(routes.signIn);
          return;
        }

        if (!data || !response.ok || !data.ok) {
          setLoadError(
            data && !data.ok && data.message ? data.message : TAG_LOAD_ERROR,
          );
          return;
        }

        setLoadError("");
        setTags(data.tags);
        setStats(data.stats);
        setMostInsights(data.insights);

        if (filter === "all" && !debouncedSearch.trim()) {
          setFullTagsSnapshot(data.tags);
        }

        setSelectedId((current) => {
          if (current && !data.tags.some((tag) => tag.id === current)) {
            return null;
          }
          return current;
        });
      } catch (error) {
        if ((error as { name?: string }).name === "AbortError") {
          return;
        }
        if (cancelled || requestId !== listRequestIdRef.current) {
          return;
        }
        setLoadError(TAG_LOAD_ERROR);
      } finally {
        if (
          cancelled ||
          controller.signal.aborted ||
          requestId !== listRequestIdRef.current
        ) {
          return;
        }
        initialLoadRef.current = false;
        setInitialLoading(false);
        if (listAbortRef.current === controller) {
          listAbortRef.current = null;
        }
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [debouncedSearch, filter, reloadNonce, router, sort]);

  useEffect(() => {
    return () => {
      listAbortRef.current?.abort();
    };
  }, []);

  function resetNameForm() {
    setName("");
    setFieldError("");
    setFormError("");
  }

  function validateNameLocal(value: string, ignoreId?: string) {
    const validationError = validateTagName(value);
    if (validationError) {
      return validationError;
    }

    const trimmed = value.trim();
    const duplicate = tags.some(
      (tag) =>
        tag.id !== ignoreId &&
        tag.name.localeCompare(trimmed, undefined, { sensitivity: "accent" }) ===
          0,
    );
    if (duplicate) {
      return TAG_DUPLICATE_MESSAGE;
    }

    return "";
  }

  function openCreate() {
    resetNameForm();
    setCreateOpen(true);
  }

  function openTagDetail(tag: SerializedTag) {
    router.push(vaultRoutes.tagDetail(tag.id));
  }

  function openRename(tag: SerializedTag) {
    resetNameForm();
    setRenameTarget(tag);
    setName(tag.name);
  }

  function openDelete(tag: SerializedTag) {
    setFormError("");
    setDeleteTarget(tag);
  }

  async function handleCreate() {
    if (creating || submittingRef.current) {
      return;
    }

    const error = validateNameLocal(name);
    if (error) {
      setFieldError(error);
      return;
    }

    submittingRef.current = true;
    setCreating(true);
    setFieldError("");
    setFormError("");

    try {
      const { response, data } = await createTag(name.trim());

      if (response.status === 401) {
        router.push(routes.signIn);
        return;
      }

      if (!data || !response.ok || !data.ok) {
        const { fieldError: nextFieldError, formError: nextFormError } =
          getMutationFieldError(data);
        if (nextFieldError) {
          setFieldError(nextFieldError);
        } else {
          setFormError(nextFormError ?? TAG_CLIENT_ERROR);
        }
        return;
      }

      setCreateOpen(false);
      resetNameForm();
      toastSuccess(TAG_CREATED_MESSAGE);
      reloadTags();
    } finally {
      submittingRef.current = false;
      setCreating(false);
    }
  }

  async function handleRename() {
    if (!renameTarget || renaming || submittingRef.current) {
      return;
    }

    const error = validateNameLocal(name, renameTarget.id);
    if (error) {
      setFieldError(error);
      return;
    }

    submittingRef.current = true;
    setRenaming(true);
    setFieldError("");
    setFormError("");

    const targetId = renameTarget.id;

    try {
      const { response, data } = await renameTag(targetId, name.trim());

      if (response.status === 401) {
        router.push(routes.signIn);
        return;
      }

      if (!data || !response.ok || !data.ok) {
        const { fieldError: nextFieldError, formError: nextFormError } =
          getMutationFieldError(data);
        if (nextFieldError) {
          setFieldError(nextFieldError);
        } else {
          setFormError(nextFormError ?? TAG_CLIENT_ERROR);
        }
        return;
      }

      setRenameTarget(null);
      resetNameForm();
      toastSuccess(TAG_RENAMED_MESSAGE);
      reloadTags();
    } finally {
      submittingRef.current = false;
      setRenaming(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget || deleting || submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setDeleting(true);

    const targetId = deleteTarget.id;

    try {
      const { response, data } = await deleteTag(targetId);

      if (response.status === 401) {
        router.push(routes.signIn);
        return;
      }

      if (!data || !response.ok || !data.ok) {
        toastError(
          data && !data.ok && data.message ? data.message : TAG_CLIENT_ERROR,
        );
        return;
      }

      if (selectedId === targetId) {
        setSelectedId(null);
      }
      setDeleteTarget(null);
      toastSuccess(TAG_DELETED_MESSAGE);
      reloadTags();
    } finally {
      submittingRef.current = false;
      setDeleting(false);
    }
  }

  const mostUsedValue =
    stats?.mostUsedTag != null
      ? stats.mostUsedTag.noteCount.toLocaleString()
      : "—";
  const mostUsedHint =
    stats?.mostUsedTag != null ? stats.mostUsedTag.name : "No tags yet";

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
              <Tag aria-hidden className="size-7 stroke-[1.75] text-foreground sm:size-8" />
              Tags
            </span>
          }
          lead="Organise your notes with tags. Click a tag to view all related content."
          actions={
            <button type="button" onClick={openCreate} className={vaultPrimaryButton}>
              <Tag aria-hidden className="size-4" />
              Create Tag
            </button>
          }
        />

        {loadError ? (
          <div
            className="rounded-[var(--mv-radius-card)] border border-border bg-mv-panel px-4 py-3.5"
            role="alert"
          >
            <p className="text-[0.8125rem] text-foreground">{loadError}</p>
            <button
              type="button"
              onClick={reloadTags}
              className="mt-2 text-[0.8125rem] font-medium text-foreground underline-offset-2 hover:underline"
            >
              Retry
            </button>
          </div>
        ) : null}

        {initialLoading ? (
          <TagsStatsSkeleton />
        ) : stats ? (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <TagStatCard
              label="Total Tags"
              value={String(stats.totalTags)}
              icon={Tags}
            />
            <TagStatCard
              label="Most Used Tag"
              value={mostUsedValue}
              hint={mostUsedHint}
              icon={Tag}
            />
            <TagStatCard
              label="Unused Tags"
              value={String(stats.unusedTags)}
              icon={Tags}
            />
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,18.5rem)] xl:gap-6">
          <div className="min-w-0 space-y-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
              <div className="relative min-w-0 flex-1">
                <Search
                  aria-hidden
                  className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-mv-faint"
                />
                <input
                  type="search"
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search tags..."
                  disabled={initialLoading && !loadError}
                  className="h-10 w-full rounded-[var(--mv-radius-control)] border border-border bg-mv-panel pl-9 pr-3 text-[0.8125rem] text-foreground outline-none placeholder:text-mv-faint focus:border-foreground/25 disabled:opacity-60"
                />
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <NotesToolbarSelect
                  id="tags-sort"
                  label="Sort by"
                  value={sort}
                  onChange={(value) => setSort(value as TagSortOption)}
                  options={SORT_OPTIONS}
                />
                <NotesToolbarSelect
                  id="tags-filter"
                  label="Filter"
                  value={filter}
                  onChange={(value) => setFilter(value as FilterOption)}
                  options={FILTER_OPTIONS}
                />
                <div className={vaultSegmentedTrack}>
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
                </div>
              </div>
            </div>

            {initialLoading && !loadError ? (
              <TagsListSkeleton viewMode={viewMode} />
            ) : loadError ? null : isVaultEmpty ? (
              <EmptyState
                variant="dashed"
                title="No tags yet"
                description="Create tags to organize related notes across your vault."
                action={
                  <button
                    type="button"
                    onClick={openCreate}
                    className={cn(vaultSecondaryButton, "gap-2")}
                  >
                    <Tag aria-hidden className="size-3.5" />
                    Create Tag
                  </button>
                }
              />
            ) : tags.length === 0 ? (
              <EmptyState
                variant="dashed"
                title="No tags match your filters."
                description="Try a different search or create a new tag."
                action={
                  <button
                    type="button"
                    onClick={openCreate}
                    className={cn(vaultSecondaryButton, "gap-2")}
                  >
                    <Tag aria-hidden className="size-3.5" />
                    Create Tag
                  </button>
                }
              />
            ) : viewMode === "grid" ? (
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {tags.map((tag) => (
                  <TagCard
                    key={tag.id}
                    tag={tag}
                    selected={selectedId === tag.id}
                    onSelect={openTagDetail}
                    onRename={openRename}
                    onDelete={openDelete}
                  />
                ))}
              </ul>
            ) : (
              <ContentCard className="overflow-hidden p-0">
                <ul>
                  {tags.map((tag) => (
                    <TagListRow
                      key={tag.id}
                      tag={tag}
                      selected={selectedId === tag.id}
                      onSelect={openTagDetail}
                      onRename={openRename}
                      onDelete={openDelete}
                    />
                  ))}
                </ul>
              </ContentCard>
            )}
          </div>

          {!initialLoading && !loadError ? (
            <aside className="flex min-w-0 flex-col gap-4 xl:sticky xl:top-4 xl:self-start">
              <TagsInsights
                mostInsights={mostInsights}
                leastInsights={leastInsights}
                onTagSelect={(item) => setSelectedId(item.id)}
              />
              <TagsQuickActions
                selectedTag={selectedTag}
                onRename={() => {
                  if (selectedTag) openRename(selectedTag);
                }}
                onDelete={() => {
                  if (selectedTag) openDelete(selectedTag);
                }}
              />
            </aside>
          ) : null}
        </div>
      </PageStack>

      <VaultDialog
        open={createOpen}
        title="Create Tag"
        description="Add a label to group related notes in your vault."
        onClose={() => {
          if (!creating) {
            setCreateOpen(false);
            resetNameForm();
          }
        }}
      >
        <CategoryNameField
          id="create-tag-name"
          label="Name"
          value={name}
          onChange={(value) => {
            setName(value);
            setFieldError("");
            setFormError("");
          }}
          error={fieldError}
          disabled={creating}
          autoFocus
        />
        {formError ? (
          <p className="mt-3 text-[0.78rem] text-muted-foreground" role="alert">
            {formError}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (!creating) {
                setCreateOpen(false);
                resetNameForm();
              }
            }}
            className={vaultSecondaryButton}
            disabled={creating}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleCreate()}
            className={vaultPrimaryButton}
            disabled={creating}
            aria-busy={creating}
          >
            {creating ? "Creating…" : "Create Tag"}
          </button>
        </div>
      </VaultDialog>

      <VaultDialog
        open={renameTarget !== null}
        title="Rename Tag"
        onClose={() => {
          if (!renaming) {
            setRenameTarget(null);
            resetNameForm();
          }
        }}
      >
        <CategoryNameField
          id="rename-tag-name"
          label="Name"
          value={name}
          onChange={(value) => {
            setName(value);
            setFieldError("");
            setFormError("");
          }}
          error={fieldError}
          disabled={renaming}
          autoFocus
        />
        {formError ? (
          <p className="mt-3 text-[0.78rem] text-muted-foreground" role="alert">
            {formError}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => {
              if (!renaming) {
                setRenameTarget(null);
                resetNameForm();
              }
            }}
            className={vaultSecondaryButton}
            disabled={renaming}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleRename()}
            className={vaultPrimaryButton}
            disabled={renaming}
            aria-busy={renaming}
          >
            {renaming ? "Saving…" : "Save Name"}
          </button>
        </div>
      </VaultDialog>

      <VaultDialog
        open={deleteTarget !== null}
        title="Delete Tag"
        description={DELETE_DIALOG_DESCRIPTION}
        onClose={() => {
          if (!deleting) {
            setDeleteTarget(null);
          }
        }}
      >
        {deleteTarget ? (
          <p className="rounded-xl border border-border bg-mv-panel px-3.5 py-2.5 text-[0.86rem] text-foreground/80">
            {deleteTarget.name}
            {deleteTarget.noteCount > 0 ? (
              <span className="mt-1 block text-[0.74rem] text-mv-faint">
                {deleteTarget.noteCount === 1
                  ? "1 note uses this tag."
                  : `${deleteTarget.noteCount} notes use this tag.`}
              </span>
            ) : null}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => setDeleteTarget(null)}
            className={vaultSecondaryButton}
            disabled={deleting}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            className={vaultDestructiveButton}
            disabled={deleting}
            aria-busy={deleting}
          >
            {deleting ? "Deleting…" : "Delete tag"}
          </button>
        </div>
      </VaultDialog>
    </motion.div>
  );
}
