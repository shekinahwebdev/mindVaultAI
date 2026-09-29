"use client";

import { motion } from "framer-motion";
import { ArrowLeft, Pencil, Search, Tag, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { EmptyState } from "@/components/mv/EmptyState";
import { PageStack } from "@/components/mv/PageStack";
import { CategoryNameField } from "@/components/vault/categories/CategoryNameField";
import { NoteCard } from "@/components/vault/notes/NoteCard";
import { NotesToolbarSelect } from "@/components/vault/notes/NotesToolbarSelect";
import { VaultDialog } from "@/components/vault/VaultDialog";
import {
  NOTE_SORT_LABELS,
  NOTE_SORT_OPTIONS,
  type NoteSortOption,
} from "@/lib/notes/notes-list-config";
import { useNotesList } from "@/lib/notes/use-notes-list";
import { routes, vaultRoutes } from "@/lib/routes";
import { TAG_NOT_FOUND_MESSAGE } from "@/lib/tags/tag-errors";
import {
  deleteTag,
  fetchTag,
  getMutationFieldError,
  renameTag,
  TAG_CLIENT_ERROR,
  TAG_DELETED_MESSAGE,
  TAG_RENAMED_MESSAGE,
  type SerializedTag,
} from "@/lib/tags/tags-client";
import { getTagColor } from "@/lib/vault/tag-colors";
import { toastError, toastSuccess } from "@/lib/vault-toast";
import { validateTagName } from "@/lib/tags/tag-validation";

import {
  vaultDestructiveButton,
  vaultPrimaryButton,
  vaultSecondaryButton,
} from "../vault-controls";
import { vaultEase } from "../vault-motion";

const DELETE_DIALOG_DESCRIPTION =
  "Deleting this tag removes the tag from notes using it. The notes themselves will not be deleted.";

const SEARCH_DEBOUNCE_MS = 300;

type TagDetailViewProps = {
  tagId: string;
};

export function TagDetailView({ tagId }: TagDetailViewProps) {
  const router = useRouter();
  const submittingRef = useRef(false);
  const searchDebounceRef = useRef<number | null>(null);

  const [tag, setTag] = useState<SerializedTag | null>(null);
  const [tagLoading, setTagLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [tagError, setTagError] = useState("");

  const [sort, setSort] = useState<NoteSortOption>("updated_desc");
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);

  const [renameOpen, setRenameOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [name, setName] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [formError, setFormError] = useState("");
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const {
    notes,
    total,
    totalPages,
    loading: notesLoading,
    loadingMore,
    error: notesError,
  } = useNotesList({
    tagId,
    sort,
    searchQuery,
    page,
  });

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setTagLoading(true);
      setTagError("");
      setNotFound(false);

      try {
        const { response, data } = await fetchTag(tagId);

        if (cancelled) {
          return;
        }

        if (response.status === 401) {
          router.push(routes.signIn);
          return;
        }

        if (response.status === 404) {
          setNotFound(true);
          setTag(null);
          return;
        }

        if (!data || !response.ok || !data.ok) {
          setTagError(
            data && !data.ok && data.message ? data.message : TAG_CLIENT_ERROR,
          );
          setTag(null);
          return;
        }

        setTag(data.tag);
      } catch {
        if (!cancelled) {
          setTagError(TAG_CLIENT_ERROR);
        }
      } finally {
        if (!cancelled) {
          setTagLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, tagId]);

  function handleSearchInputChange(value: string) {
    setSearchInput(value);
    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
    }
    searchDebounceRef.current = window.setTimeout(() => {
      setSearchQuery(value);
      setPage(1);
    }, SEARCH_DEBOUNCE_MS);
  }

  useEffect(() => {
    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
      }
    };
  }, []);

  function openRename() {
    if (!tag) return;
    setName(tag.name);
    setFieldError("");
    setFormError("");
    setRenameOpen(true);
  }

  function openDelete() {
    setFormError("");
    setDeleteOpen(true);
  }

  function validateNameLocal(value: string) {
    return validateTagName(value) ?? "";
  }

  async function handleRename() {
    if (!tag || renaming || submittingRef.current) {
      return;
    }

    const error = validateNameLocal(name);
    if (error) {
      setFieldError(error);
      return;
    }

    submittingRef.current = true;
    setRenaming(true);
    setFieldError("");
    setFormError("");

    try {
      const { response, data } = await renameTag(tag.id, name.trim());

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

      setTag(data.tag);
      setRenameOpen(false);
      toastSuccess(TAG_RENAMED_MESSAGE);
    } finally {
      submittingRef.current = false;
      setRenaming(false);
    }
  }

  async function handleDelete() {
    if (!tag || deleting || submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setDeleting(true);

    try {
      const { response, data } = await deleteTag(tag.id);

      if (response.status === 401) {
        router.push(routes.signIn);
        return;
      }

      if (!data || !response.ok || !data.ok) {
        toastError(data && !data.ok && data.message ? data.message : TAG_CLIENT_ERROR);
        return;
      }

      toastSuccess(TAG_DELETED_MESSAGE);
      router.push(vaultRoutes.tags);
      router.refresh();
    } finally {
      submittingRef.current = false;
      setDeleting(false);
    }
  }

  const sortOptions = NOTE_SORT_OPTIONS.map((option) => ({
    value: option,
    label: NOTE_SORT_LABELS[option],
  }));

  const hasSearch = searchQuery.trim().length > 0;
  const showNotesSkeleton = notesLoading && page === 1;
  const showEmptyTag =
    !notesLoading && !notesError && tag && !hasSearch && total === 0;
  const showNoSearchResults =
    !notesLoading && !notesError && hasSearch && total === 0;
  const canLoadMore = page < totalPages;

  if (tagLoading) {
    return (
      <PageStack className="gap-5">
        <div className="animate-pulse space-y-3">
          <span className="block h-4 w-28 rounded bg-mv-panel" />
          <span className="block h-9 w-64 max-w-full rounded bg-mv-panel" />
          <span className="block h-4 w-20 rounded bg-mv-panel" />
        </div>
        <p className="py-12 text-center text-[0.8125rem] text-muted-foreground">
          Loading tag…
        </p>
      </PageStack>
    );
  }

  if (notFound) {
    return (
      <EmptyState
        variant="dashed"
        className="py-16"
        title={TAG_NOT_FOUND_MESSAGE}
        description="This tag may have been deleted or never existed."
        action={
          <Link href={vaultRoutes.tags} className={vaultSecondaryButton}>
            <ArrowLeft aria-hidden className="size-3.5" />
            Back to Tags
          </Link>
        }
      />
    );
  }

  if (tagError || !tag) {
    return (
      <div className="rounded-[var(--mv-radius-card)] border border-border bg-mv-panel px-4 py-8 text-center">
        <p className="text-[0.8125rem] text-muted-foreground">{tagError || TAG_CLIENT_ERROR}</p>
        <Link
          href={vaultRoutes.tags}
          className="mt-4 inline-flex items-center gap-2 text-[0.8125rem] font-medium text-foreground underline-offset-2 hover:underline"
        >
          <ArrowLeft aria-hidden className="size-3.5" />
          Back to Tags
        </Link>
      </div>
    );
  }

  const color = getTagColor(tag.name);
  const countLabel = hasSearch
    ? `${total.toLocaleString()} matching ${total === 1 ? "note" : "notes"}`
    : tag.noteCount === 1
      ? "1 note"
      : `${tag.noteCount.toLocaleString()} notes`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: vaultEase }}
    >
      <PageStack className="gap-5">
        <header className="space-y-3">
          <Link
            href={vaultRoutes.tags}
            className="inline-flex items-center gap-2 text-[0.8125rem] text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft aria-hidden className="size-3.5" />
            Back to Tags
          </Link>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2.5">
                <span
                  aria-hidden
                  className="size-3 shrink-0 rounded-full"
                  style={{ backgroundColor: color }}
                />
                <Tag aria-hidden className="size-5 text-muted-foreground" />
                <h1 className="truncate text-[1.5rem] font-semibold tracking-[-0.02em] text-foreground sm:text-[1.75rem]">
                  {tag.name}
                </h1>
              </div>
              <p className="mt-1.5 text-[0.8125rem] text-muted-foreground">
                {countLabel}
                {!hasSearch ? (
                  <span className="text-mv-faint"> · Notes tagged with {tag.name}</span>
                ) : null}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <button type="button" onClick={openRename} className={vaultSecondaryButton}>
                <Pencil aria-hidden className="size-3.5" />
                Rename
              </button>
              <button type="button" onClick={openDelete} className={vaultSecondaryButton}>
                <Trash2 aria-hidden className="size-3.5" />
                Delete
              </button>
            </div>
          </div>
        </header>

        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <label className="relative min-w-0 flex-1">
            <span className="sr-only">Search notes in this tag</span>
            <Search
              aria-hidden
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-mv-faint"
            />
            <input
              type="search"
              value={searchInput}
              onChange={(event) => handleSearchInputChange(event.target.value)}
              placeholder="Search in this tag…"
              className="h-10 w-full rounded-[var(--mv-radius-control)] border border-border bg-mv-panel py-2 pr-3 pl-9 text-[0.8125rem] text-foreground outline-none placeholder:text-mv-faint focus-visible:border-foreground/25 focus-visible:ring-2 focus-visible:ring-ring/30"
            />
          </label>
          <NotesToolbarSelect
            id="tag-notes-sort"
            label="Sort"
            value={sort}
            onChange={(value) => {
              if (NOTE_SORT_OPTIONS.includes(value as NoteSortOption)) {
                setSort(value as NoteSortOption);
                setPage(1);
              }
            }}
            options={sortOptions}
          />
        </div>

        {notesError ? (
          <div className="rounded-[var(--mv-radius-card)] border border-border bg-mv-panel px-4 py-3 text-[0.8125rem] text-muted-foreground">
            {notesError}
          </div>
        ) : null}

        {showNotesSkeleton ? (
          <ul className="space-y-3" aria-busy="true" aria-label="Loading notes">
            {Array.from({ length: 4 }, (_, index) => (
              <li
                key={index}
                className="animate-pulse rounded-xl border border-border bg-surface px-4 py-4"
              >
                <span className="block h-4 w-2/3 rounded bg-mv-panel" />
                <span className="mt-2 block h-3 w-full rounded bg-mv-panel" />
              </li>
            ))}
          </ul>
        ) : showEmptyTag ? (
          <EmptyState
            variant="dashed"
            className="py-14"
            title="No notes with this tag yet"
            description="Add this tag to a note to see it here."
            action={
              <Link href={vaultRoutes.capture} className={vaultSecondaryButton}>
                Add to Vault
              </Link>
            }
          />
        ) : showNoSearchResults ? (
          <EmptyState
            variant="solid"
            className="py-14"
            title="No matching notes"
            description="Try a different search term."
            action={
              <button
                type="button"
                className={vaultSecondaryButton}
                onClick={() => {
                  setSearchInput("");
                  setSearchQuery("");
                  setPage(1);
                }}
              >
                Clear search
              </button>
            }
          />
        ) : (
          <>
            <ul className="space-y-3">
              {notes.map((note) => (
                <li key={note.id}>
                  <NoteCard note={note} showTags />
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
                  {loadingMore ? "Loading…" : "Load more"}
                </button>
              </div>
            ) : null}
          </>
        )}
      </PageStack>

      <VaultDialog
        open={renameOpen}
        title="Rename Tag"
        onClose={() => {
          if (!renaming) {
            setRenameOpen(false);
            setFieldError("");
            setFormError("");
          }
        }}
      >
        <CategoryNameField
          id="tag-detail-rename"
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
            onClick={() => setRenameOpen(false)}
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
        open={deleteOpen}
        title="Delete Tag"
        description={DELETE_DIALOG_DESCRIPTION}
        onClose={() => {
          if (!deleting) {
            setDeleteOpen(false);
          }
        }}
      >
        <p className="rounded-xl border border-border bg-mv-panel px-3.5 py-2.5 text-[0.86rem] text-foreground/80">
          {tag.name}
          {tag.noteCount > 0 ? (
            <span className="mt-1 block text-[0.74rem] text-mv-faint">
              {tag.noteCount === 1
                ? "1 note uses this tag."
                : `${tag.noteCount} notes use this tag.`}
            </span>
          ) : null}
        </p>
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => setDeleteOpen(false)}
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
