"use client";

import { motion } from "framer-motion";
import { ArrowLeft, ExternalLink, Pencil, Trash2 } from "lucide-react";
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
  formatNoteDate,
  noteTypeLabels,
} from "@/lib/notes/note-display";
import { routes, vaultRoutes } from "@/lib/routes";
import { toastError, toastSuccess } from "@/lib/vault-toast";
import { cn } from "@/lib/utils";

import {
  vaultDestructiveButton,
  vaultMetaClassName,
  vaultPageTitleClassName,
  vaultPrimaryButton,
  vaultSecondaryButton,
} from "../vault-controls";

import { vaultEase } from "../vault-motion";
import { NoteContentDisplay } from "./NoteContentDisplay";
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: vaultEase }}
      className="mx-auto w-full max-w-3xl space-y-5"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          href={vaultRoutes.notes}
          className="inline-flex items-center gap-2 text-[0.82rem] text-muted-foreground transition-colors hover:text-foreground/85"
        >
          <ArrowLeft aria-hidden className="size-3.5" />
          Back to All Notes
        </Link>

        {!editing ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleEditClick}
              className={cn(vaultSecondaryButton, "gap-2")}
            >
              <Pencil aria-hidden className="size-3.5" />
              Edit
            </button>
            <button
              type="button"
              onClick={() => {
                setDeleteError("");
                setDeleteOpen(true);
              }}
              className={vaultSecondaryButton}
            >
              <Trash2 aria-hidden className="size-3.5" />
              Delete
            </button>
          </div>
        ) : null}
      </div>

      {editing ? (
        <form onSubmit={handleSave} className="space-y-5">
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
            <p
              role="alert"
              className="rounded-xl border border-border bg-mv-panel px-3.5 py-2.5 text-[0.82rem] text-muted-foreground"
            >
              {formError}
            </p>
          ) : null}

          <div className="flex flex-wrap justify-end gap-2.5">
            <button
              type="button"
              onClick={() => {
                exitEditMode();
              }}
              disabled={saving}
              className={vaultSecondaryButton}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              aria-busy={saving}
              className={cn(vaultPrimaryButton, saving && "opacity-80")}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      ) : (
        <article className="rounded-[var(--radius-card)] border border-border bg-surface p-5 sm:p-6 shadow-[0_1px_2px_rgb(0_0_0/0.03)]">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className={cn("min-w-0 flex-1", vaultPageTitleClassName)}>
              {note.title}
            </h1>
            <span className={cn("shrink-0 rounded-md border border-border bg-mv-panel px-2.5 py-0.5", vaultMetaClassName)}>
              {typeLabel}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.74rem] text-mv-faint">
            {note.category ? (
              <span className="rounded-md border border-border px-2 py-0.5 text-muted-foreground">
                {note.category.name}
              </span>
            ) : (
              <span>Uncategorized</span>
            )}
            <span>Created {formatNoteDate(note.createdAt)}</span>
            <span>Updated {formatNoteDate(note.updatedAt)}</span>
          </div>

          {note.sourceUrl ? (
            <a
              href={note.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 text-[0.82rem] text-muted-foreground underline-offset-2 hover:text-foreground/85 hover:underline"
            >
              <ExternalLink aria-hidden className="size-3.5" />
              {note.sourceUrl}
            </a>
          ) : null}

          <div className="mt-6 border-t border-border pt-6">
            <NoteContentDisplay content={note.content} type={note.type} />
          </div>
        </article>
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
