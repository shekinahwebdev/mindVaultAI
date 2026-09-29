"use client";

import { motion } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  ExternalLink,
  Maximize2,
  MoreHorizontal,
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
import {
  formatNoteDate,
  formatNoteDateTime,
  noteTypeLabels,
} from "@/lib/notes/note-display";
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
import { NoteTagBadges } from "@/components/vault/tags/NoteTagBadges";

import { NoteDetailBody } from "./NoteDetailBody";
import { NoteDetailMetaSidebar } from "./NoteDetailMetaSidebar";
import { NoteDetailNotesRail } from "./NoteDetailNotesRail";
import { NoteFormFields } from "./NoteFormFields";

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
  const [starred, setStarred] = useState(false);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: vaultEase }}
      className={cn(
        "-mx-[var(--mv-page-padding-x)] flex min-h-[calc(100dvh-7.5rem)] flex-col overflow-hidden border-y border-border bg-surface md:mx-0 md:rounded-[var(--mv-radius-card)] md:border",
        editing && "min-h-0",
      )}
    >
      {editing ? (
        <div className="space-y-5 overflow-y-auto p-4 sm:p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Link
              href={vaultRoutes.notes}
              className="inline-flex items-center gap-2 text-[0.8125rem] text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft aria-hidden className="size-3.5" />
              All Notes
            </Link>
          </div>
          <form onSubmit={handleSave} className="mx-auto max-w-3xl space-y-5">
            <NoteFormFields
              idPrefix="edit-note"
              values={values}
              errors={errors}
              onChange={updateField}
              disabled={saving}
              categories={categories}
              categoriesLoading={categoriesLoading}
              categoriesError={categoriesError}
              contentLabel="Content"
            />
            {formError ? (
              <p role="alert" className="text-[0.8125rem] text-muted-foreground">
                {formError}
              </p>
            ) : null}
            <div className="flex flex-wrap justify-end gap-2.5">
              <button
                type="button"
                onClick={() => exitEditMode()}
                disabled={saving}
                className={vaultSecondaryButton}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className={cn(vaultPrimaryButton, saving && "opacity-80")}
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <NoteDetailNotesRail activeNoteId={noteId} />

          <section className="flex min-w-0 flex-1 flex-col">
            <header className="shrink-0 border-b border-border px-4 py-3 sm:px-6">
              <nav className="flex flex-wrap items-center gap-1 text-[0.75rem] text-muted-foreground">
                <Link href={vaultRoutes.notes} className="hover:text-foreground">
                  All Notes
                </Link>
                <ChevronRight aria-hidden className="size-3.5" />
                <span className="line-clamp-1 text-foreground">{note.title}</span>
              </nav>

              <div className="mt-2 flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1" />
                <div className="flex shrink-0 items-center gap-1">
                  <button
                    type="button"
                    aria-label={starred ? "Remove favorite" : "Add favorite"}
                    onClick={toggleStar}
                    className="flex size-8 items-center justify-center rounded-[var(--mv-radius-control)] text-muted-foreground hover:bg-mv-panel hover:text-foreground"
                  >
                    <Star
                      aria-hidden
                      className={cn("size-4", starred && "fill-amber-400 text-amber-400")}
                    />
                  </button>
                  <button
                    type="button"
                    aria-label="Share"
                    className="flex size-8 items-center justify-center rounded-[var(--mv-radius-control)] text-muted-foreground hover:bg-mv-panel"
                    onClick={() => toastInfo("Sharing is coming soon.")}
                  >
                    <Share2 aria-hidden className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="More"
                    className="flex size-8 items-center justify-center rounded-[var(--mv-radius-control)] text-muted-foreground hover:bg-mv-panel"
                    onClick={() => {
                      setDeleteError("");
                      setDeleteOpen(true);
                    }}
                  >
                    <MoreHorizontal aria-hidden className="size-4" />
                  </button>
                  <button
                    type="button"
                    aria-label="Fullscreen"
                    className="hidden size-8 items-center justify-center rounded-[var(--mv-radius-control)] text-muted-foreground hover:bg-mv-panel sm:flex"
                    onClick={() => toastInfo("Fullscreen is coming soon.")}
                  >
                    <Maximize2 aria-hidden className="size-4" />
                  </button>
                </div>
              </div>

              <h1 className="mt-3 font-serif text-[1.75rem] leading-tight tracking-[-0.02em] text-foreground sm:text-[2rem]">
                {note.title}
              </h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[0.75rem] text-muted-foreground">
                <span>Created {formatNoteDateTime(note.createdAt)}</span>
                <span aria-hidden>·</span>
                <span>{readMinutes} min read</span>
                {note.category ? (
                  <span className="rounded-full border border-border bg-mv-panel px-2 py-0.5 text-foreground">
                    {note.category.name}
                  </span>
                ) : null}
              </div>

              <NoteTagBadges tags={note.tags} className="mt-2" />

              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={handleEditClick}
                  className={cn(vaultSecondaryButton, "h-8 gap-1.5 px-2.5 text-[0.8125rem]")}
                >
                  <Pencil aria-hidden className="size-3.5" />
                  Edit
                </button>
                <span className={cn("inline-flex h-8 items-center rounded-[var(--mv-radius-control)] border border-border px-2.5", vaultMetaClassName)}>
                  {typeLabel}
                </span>
              </div>
            </header>

            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
              <div className="mx-auto max-w-3xl">
                {note.sourceUrl ? (
                  <a
                    href={note.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mb-6 inline-flex items-center gap-1.5 text-[0.8125rem] text-muted-foreground hover:text-foreground hover:underline"
                  >
                    <ExternalLink aria-hidden className="size-3.5" />
                    {note.sourceUrl}
                  </a>
                ) : null}
                <NoteDetailBody content={note.content} type={note.type} />
              </div>
            </div>
          </section>

          <NoteDetailMetaSidebar note={note} relatedNotes={relatedNotes} />
        </div>
      )}

      <VaultDialog
        open={deleteOpen}
        title="Delete this note?"
        description="This will permanently remove it from your vault."
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
