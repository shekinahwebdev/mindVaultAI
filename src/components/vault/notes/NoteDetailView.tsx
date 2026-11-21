"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Maximize2,
  Minimize2,
  MoreHorizontal,
  PanelLeft,
  PanelRight,
  Pencil,
  Share2,
  Star,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { VaultDialog } from "@/components/vault/VaultDialog";
import { useCategories } from "@/lib/categories/use-categories";
import {
  archiveNoteRequest,
  restoreNoteRequest,
} from "@/lib/notes/archive-client";
import {
  deleteNoteRequest,
  fetchNote,
  NOTE_DELETE_FLASH_KEY,
  type SerializedNote,
  updateNoteRequest,
} from "@/lib/notes/capture-client";
import {
  NOTE_DELETE_ERROR,
  NOTE_DELETE_SUCCESS,
  NOTE_DETAIL_LOAD_ERROR,
  NOTE_EDIT_DISCARD_CONFIRM,
  NOTE_NOT_FOUND_MESSAGE,
  NOTE_UPDATE_ERROR,
  noteEditFormIsDirty,
  noteValuesFromSerialized,
  validateCaptureForm,
  type CaptureFieldErrors,
  type CaptureFormValues,
} from "@/lib/notes/capture-validation";
import {
  countWords,
  estimateReadMinutes,
  readNoteStarred,
  writeNoteStarred,
} from "@/lib/notes/note-detail-utils";
import { formatNoteDateTime, noteTypeLabels } from "@/lib/notes/note-display";
import { useNotesList } from "@/lib/notes/use-notes-list";
import { routes, vaultRoutes } from "@/lib/routes";
import { toastError, toastInfo, toastSuccess } from "@/lib/vault-toast";
import { cn } from "@/lib/utils";

import {
  vaultDestructiveButton,
  vaultMetaClassName,
  vaultPrimaryButton,
  vaultSecondaryButton,
} from "../vault-controls";

import { vaultEase } from "../vault-motion";
import { NoteDetailBody } from "./NoteDetailBody";
import { NoteDetailMetaSidebar } from "./NoteDetailMetaSidebar";
import { NoteDetailNotesRail } from "./NoteDetailNotesRail";
import { NoteDetailEditForm } from "./NoteDetailEditForm";
import {
  noteDetailArticleMeasureClassName,
  noteDetailWorkspaceClassName,
} from "./note-detail-ui";

type NoteDetailViewProps = {
  noteId: string;
};

export function NoteDetailView({ noteId }: NoteDetailViewProps) {
  const router = useRouter();
  const submittingRef = useRef(false);

  const [note, setNote] = useState<SerializedNote | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [loadError, setLoadError] = useState("");

  const [editing, setEditing] = useState(false);
  const [originalValues, setOriginalValues] = useState<CaptureFormValues | null>(
    null,
  );
  const [values, setValues] = useState<CaptureFormValues | null>(null);
  const [errors, setErrors] = useState<CaptureFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [archiving, setArchiving] = useState(false);
  const [restoring, setRestoring] = useState(false);
  const [starred, setStarred] = useState(false);
  const [notesPanelOpen, setNotesPanelOpen] = useState(false);
  const [metaPanelOpen, setMetaPanelOpen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);

  useEffect(() => {
  function syncPanels() {
    const lg = window.matchMedia("(min-width: 1024px)");
    const xl = window.matchMedia("(min-width: 1280px)");
    if (focusMode) {
      return;
    }
    if (!lg.matches) {
      setNotesPanelOpen(false);
      setMetaPanelOpen(false);
      return;
    }
    setNotesPanelOpen(true);
    setMetaPanelOpen(xl.matches);
  }

    syncPanels();
    const lg = window.matchMedia("(min-width: 1024px)");
    const xl = window.matchMedia("(min-width: 1280px)");
    lg.addEventListener("change", syncPanels);
    xl.addEventListener("change", syncPanels);
    return () => {
      lg.removeEventListener("change", syncPanels);
      xl.removeEventListener("change", syncPanels);
    };
  }, [noteId, focusMode]);

  const { notes: relatedPool } = useNotesList({
    typeFilter: "",
    categoryFilter: note?.categoryId ?? "",
    sort: "updated_desc",
    searchQuery: "",
    page: 1,
  });

  const relatedNotes = relatedPool.filter((item) => item.id !== noteId).slice(0, 3);

  useEffect(() => {
    queueMicrotask(() => setStarred(readNoteStarred(noteId)));
  }, [noteId]);

  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCategories();

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setLoadError("");
      setNotFound(false);

      try {
        const { response, data } = await fetchNote(noteId);

        if (cancelled) {
          return;
        }

        if (response.status === 401) {
          router.push(routes.signIn);
          return;
        }

        if (response.status === 404) {
          setNotFound(true);
          setNote(null);
          return;
        }

        if (!data || !response.ok || !data.ok) {
          setLoadError(
            data && !data.ok && data.message
              ? data.message
              : NOTE_DETAIL_LOAD_ERROR,
          );
          setNote(null);
          return;
        }

        setNote(data.note);
        const formValues = noteValuesFromSerialized(data.note);
        setValues(formValues);
        setOriginalValues(formValues);
      } catch {
        if (!cancelled) {
          setLoadError(NOTE_DETAIL_LOAD_ERROR);
          setNote(null);
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
  }, [noteId, router]);

  function updateField<K extends keyof CaptureFormValues>(
    key: K,
    value: CaptureFormValues[K],
  ) {
    setValues((current) => (current ? { ...current, [key]: value } : current));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError("");
  }

  function exitEditMode(force = false) {
    if (!force && originalValues && values && noteEditFormIsDirty(originalValues, values)) {
      if (!window.confirm(NOTE_EDIT_DISCARD_CONFIRM)) {
        return false;
      }
    }

    if (originalValues) {
      setValues(originalValues);
    }
    setEditing(false);
    setErrors({});
    setFormError("");
    return true;
  }

  function handleEditClick() {
    if (note?.archivedAt) return;
    setEditing(true);
  }

  async function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!values || saving || submittingRef.current) {
      return;
    }

    const parsed = validateCaptureForm(values);
    if (!parsed.success) {
      setErrors(parsed.errors);
      return;
    }

    submittingRef.current = true;
    setSaving(true);
    setFormError("");
    setErrors({});

    try {
      const { response, data } = await updateNoteRequest(noteId, parsed.data);

      if (response.status === 401) {
        router.push(routes.signIn);
        return;
      }

      if (response.status === 404) {
        setNotFound(true);
        setEditing(false);
        setNote(null);
        return;
      }

      if (!data || !response.ok || !data.ok) {
        if (data && !data.ok && data.errors) {
          setErrors(data.errors);
        } else {
          toastError(
            data && !data.ok && data.message ? data.message : NOTE_UPDATE_ERROR,
          );
        }
        return;
      }

      setNote(data.note);
      const nextValues = noteValuesFromSerialized(data.note);
      setValues(nextValues);
      setOriginalValues(nextValues);
      setEditing(false);
      toastSuccess("Note updated.");
      router.refresh();
    } catch {
      toastError(NOTE_UPDATE_ERROR);
      setFormError(NOTE_UPDATE_ERROR);
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  }

  async function handleArchive() {
    if (archiving || !note || note.archivedAt) return;
    setArchiving(true);
    try {
      const { response, data } = await archiveNoteRequest(noteId);
      if (response.status === 401) {
        router.push(routes.signIn);
        return;
      }
      if (!data?.ok) {
        toastError(data?.message ?? "Could not archive this note.");
        return;
      }
      toastSuccess("Note archived.");
      router.push(vaultRoutes.notes);
      router.refresh();
    } finally {
      setArchiving(false);
    }
  }

  async function handleRestore() {
    if (restoring || !note?.archivedAt) return;
    setRestoring(true);
    try {
      const { response, data } = await restoreNoteRequest(noteId);
      if (response.status === 401) {
        router.push(routes.signIn);
        return;
      }
      if (!data?.ok) {
        toastError(data?.message ?? "Could not restore this note.");
        return;
      }
      setNote(data.note);
      toastSuccess("Note restored.");
      router.refresh();
    } finally {
      setRestoring(false);
    }
  }

  async function handleDelete() {
    if (deleting || submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setDeleting(true);
    setDeleteError("");

    try {
      const { response, data } = await deleteNoteRequest(noteId);

      if (response.status === 401) {
        router.push(routes.signIn);
        return;
      }

      if (response.status === 404) {
        setDeleteOpen(false);
        setNotFound(true);
        setNote(null);
        return;
      }

      if (!data || !response.ok || !data.ok) {
        setDeleteError(
          data && !data.ok && data.message
            ? data.message
            : NOTE_DELETE_ERROR,
        );
        return;
      }

      sessionStorage.setItem(NOTE_DELETE_FLASH_KEY, NOTE_DELETE_SUCCESS);
      router.push(vaultRoutes.notes);
      router.refresh();
    } catch {
      setDeleteError(NOTE_DELETE_ERROR);
    } finally {
      submittingRef.current = false;
      setDeleting(false);
    }
  }

  const isArchived = Boolean(note?.archivedAt);

  if (loading) {
    return (
      <p className="py-16 text-center text-[0.84rem] text-muted-foreground">
        Loading note...
      </p>
    );
  }

  if (notFound) {
    return (
      <section className="rounded-2xl border border-border bg-surface px-6 py-14 text-center">
        <p className="text-[1.2rem] font-medium text-foreground">
          {NOTE_NOT_FOUND_MESSAGE}
        </p>
        <Link
          href={vaultRoutes.notes}
          className="mt-5 inline-flex items-center gap-2 text-[0.82rem] text-muted-foreground hover:text-foreground/85"
        >
          <ArrowLeft aria-hidden className="size-3.5" />
          Back to All Notes
        </Link>
      </section>
    );
  }

  if (loadError || !note || !values) {
    return (
      <section className="rounded-2xl border border-border bg-mv-panel px-6 py-10 text-center">
        <p className="text-[0.86rem] text-muted-foreground">{loadError || NOTE_DETAIL_LOAD_ERROR}</p>
        <Link
          href={vaultRoutes.notes}
          className="mt-4 inline-flex items-center gap-2 text-[0.82rem] text-muted-foreground hover:text-foreground/85"
        >
          <ArrowLeft aria-hidden className="size-3.5" />
          Back to All Notes
        </Link>
      </section>
    );
  }

  const typeLabel = noteTypeLabels[note.type] ?? note.type;
  const wordCount = countWords(note.content);
  const readMinutes = estimateReadMinutes(wordCount);

  function toggleStar() {
    const next = !starred;
    setStarred(next);
    writeNoteStarred(noteId, next);
  }

  function toggleFocusMode() {
    setFocusMode((prev) => {
      const next = !prev;
      if (next) {
        setNotesPanelOpen(false);
        setMetaPanelOpen(false);
      } else {
        const lg = window.matchMedia("(min-width: 1024px)");
        const xl = window.matchMedia("(min-width: 1280px)");
        setNotesPanelOpen(lg.matches);
        setMetaPanelOpen(xl.matches);
      }
      return next;
    });
  }

  const panelToggleClassName =
    "flex size-8 items-center justify-center rounded-[var(--mv-radius-control)] border border-transparent text-muted-foreground hover:border-border hover:bg-mv-panel hover:text-foreground";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: vaultEase }}
      className={cn(noteDetailWorkspaceClassName, editing && "overflow-hidden")}
    >
      {editing ? (
        <NoteDetailEditForm
          idPrefix="edit-note"
          values={values}
          errors={errors}
          onChange={updateField}
          onSubmit={handleSave}
          onCancel={() => exitEditMode()}
          saving={saving}
          formError={formError}
          categories={categories}
          categoriesLoading={categoriesLoading}
          categoriesError={categoriesError}
        />
      ) : (
        <>
          <div className="flex shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 sm:px-4">
            <Link
              href={vaultRoutes.notes}
              className="inline-flex items-center gap-1.5 text-[0.75rem] text-muted-foreground hover:text-foreground lg:hidden"
            >
              <ArrowLeft aria-hidden className="size-3.5" />
              All Notes
            </Link>
            <div className="hidden items-center gap-1 lg:flex">
              <button
                type="button"
                aria-pressed={notesPanelOpen && !focusMode}
                aria-label={notesPanelOpen ? "Hide notes list" : "Show notes list"}
                onClick={() => {
                  setFocusMode(false);
                  setNotesPanelOpen((open) => !open);
                }}
                className={cn(
                  panelToggleClassName,
                  notesPanelOpen && !focusMode && "border-border bg-mv-panel text-foreground",
                )}
              >
                <PanelLeft aria-hidden className="size-4" />
              </button>
              <button
                type="button"
                aria-pressed={metaPanelOpen && !focusMode}
                aria-label={metaPanelOpen ? "Hide details" : "Show details"}
                onClick={() => {
                  setFocusMode(false);
                  setMetaPanelOpen((open) => !open);
                }}
                className={cn(
                  panelToggleClassName,
                  metaPanelOpen && !focusMode && "border-border bg-mv-panel text-foreground",
                )}
              >
                <PanelRight aria-hidden className="size-4" />
              </button>
              <button
                type="button"
                aria-pressed={focusMode}
                aria-label={focusMode ? "Exit focus reading mode" : "Focus reading mode"}
                onClick={toggleFocusMode}
                className={cn(panelToggleClassName, focusMode && "border-border bg-mv-panel text-foreground")}
              >
                {focusMode ? (
                  <Minimize2 aria-hidden className="size-4" />
                ) : (
                  <Maximize2 aria-hidden className="size-4" />
                )}
              </button>
            </div>
            <div className="ml-auto flex items-center gap-1">
              <button
                type="button"
                aria-label={starred ? "Remove favorite" : "Add favorite"}
                onClick={toggleStar}
                className={panelToggleClassName}
              >
                <Star
                  aria-hidden
                  className={cn("size-4", starred && "fill-amber-400 text-amber-400")}
                />
              </button>
              <button
                type="button"
                aria-label="Share"
                className={panelToggleClassName}
                onClick={() => toastInfo("Sharing is coming soon.")}
              >
                <Share2 aria-hidden className="size-4" />
              </button>
              <button
                type="button"
                aria-label="More actions"
                className={panelToggleClassName}
                onClick={() => {
                  setDeleteError("");
                  setDeleteOpen(true);
                }}
              >
                <MoreHorizontal aria-hidden className="size-4" />
              </button>
            </div>
          </div>

          <div className="flex min-h-0 min-w-0 flex-1">
            {notesPanelOpen && !focusMode ? (
              <NoteDetailNotesRail activeNoteId={noteId} />
            ) : null}

            <article className="flex min-h-0 min-w-0 flex-1 flex-col border-border lg:min-w-0 lg:border-x">
              <header className="shrink-0 border-b border-border px-4 py-3 sm:px-5">
                <nav className="hidden flex-wrap items-center gap-1 text-[0.75rem] text-muted-foreground lg:flex">
                  <Link href={vaultRoutes.notes} className="hover:text-foreground">
                    All Notes
                  </Link>
                  <ChevronRight aria-hidden className="size-3.5" />
                  <span className="line-clamp-1 break-words text-foreground">{note.title}</span>
                </nav>

                <h1 className="mt-1 font-serif text-[1.875rem] leading-[1.15] tracking-[-0.02em] text-foreground sm:text-[2rem] lg:mt-2">
                  <span className="break-words">{note.title}</span>
                </h1>

                <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[0.75rem] text-muted-foreground">
                  {isArchived ? (
                    <span className="rounded-full border border-amber-500/30 bg-amber-500/10 px-2 py-0.5 font-medium text-amber-800 dark:text-amber-200">
                      Archived
                    </span>
                  ) : null}
                  <span>{readMinutes} min read</span>
                  <span aria-hidden>·</span>
                  <span className="whitespace-nowrap">Updated {formatNoteDateTime(note.updatedAt)}</span>
                  <span
                    className={cn(
                      "rounded-full border border-border bg-mv-panel px-2 py-0.5 text-foreground",
                      vaultMetaClassName,
                    )}
                  >
                    {typeLabel}
                  </span>
                </div>

                <div className="mt-2.5 flex flex-wrap gap-2">
                  {isArchived ? (
                    <>
                      <button
                        type="button"
                        disabled={restoring}
                        onClick={() => void handleRestore()}
                        className={cn(vaultSecondaryButton, "h-8 gap-1.5 px-2.5 text-[0.8125rem]")}
                      >
                        {restoring ? "Restoring…" : "Restore"}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setDeleteError("");
                          setDeleteOpen(true);
                        }}
                        className={cn(vaultDestructiveButton, "h-8 px-2.5 text-[0.8125rem]")}
                      >
                        Delete permanently
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleEditClick}
                        className={cn(vaultSecondaryButton, "h-8 gap-1.5 px-2.5 text-[0.8125rem]")}
                      >
                        <Pencil aria-hidden className="size-3.5" />
                        Edit
                      </button>
                      <button
                        type="button"
                        disabled={archiving}
                        onClick={() => void handleArchive()}
                        className={cn(vaultSecondaryButton, "h-8 px-2.5 text-[0.8125rem]")}
                      >
                        {archiving ? "Archiving…" : "Archive"}
                      </button>
                    </>
                  )}
                </div>
              </header>

              <div
                className="mv-scrollbar min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-6 sm:py-5"
                tabIndex={0}
              >
                <div className={noteDetailArticleMeasureClassName}>
                  {note.sourceUrl ? (
                    <a
                      href={note.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-4 inline-flex max-w-full items-start gap-1.5 break-all text-[0.8125rem] text-muted-foreground hover:text-foreground hover:underline"
                    >
                      <ExternalLink aria-hidden className="mt-0.5 size-3.5 shrink-0" />
                      {note.sourceUrl}
                    </a>
                  ) : null}
                  <NoteDetailBody content={note.content} type={note.type} />
                </div>
              </div>
            </article>

            {metaPanelOpen && !focusMode ? (
              <NoteDetailMetaSidebar note={note} relatedNotes={relatedNotes} />
            ) : null}
          </div>
        </>
      )}

      <VaultDialog
        open={deleteOpen}
        title={isArchived ? "Delete this note permanently?" : "Delete this note?"}
        description={
          isArchived
            ? "This cannot be undone."
            : "This will permanently remove it from your vault."
        }
        onClose={() => {
          if (!deleting) {
            setDeleteOpen(false);
            setDeleteError("");
          }
        }}
      >
        <p className="rounded-xl border border-border bg-mv-panel px-3.5 py-2.5 text-[0.86rem] text-foreground/80">
          {note.title}
        </p>
        {deleteError ? (
          <p className="mt-3 text-[0.78rem] text-muted-foreground" role="alert">
            {deleteError}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => {
              setDeleteOpen(false);
              setDeleteError("");
            }}
            disabled={deleting}
            className={vaultSecondaryButton}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting}
            className={cn(vaultDestructiveButton, deleting && "opacity-80")}
          >
            {deleting ? "Deleting…" : "Delete note"}
          </button>
        </div>
      </VaultDialog>
    </motion.div>
  );
}
