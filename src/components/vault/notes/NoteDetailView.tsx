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
  NOTE_UPDATE_SUCCESS,
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
import { cn } from "@/lib/utils";

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
  const [successMessage, setSuccessMessage] = useState("");

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
    setSuccessMessage("");
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
    setSuccessMessage("");
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
        }
        setFormError(
          data && !data.ok && data.message ? data.message : NOTE_UPDATE_ERROR,
        );
        return;
      }

      setNote(data.note);
      const nextValues = noteValuesFromSerialized(data.note);
      setValues(nextValues);
      setOriginalValues(nextValues);
      setEditing(false);
      setSuccessMessage(NOTE_UPDATE_SUCCESS);
      router.refresh();
    } catch {
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
      <p className="py-16 text-center text-[0.84rem] text-white/42">
        Loading note...
      </p>
    );
  }

  if (notFound) {
    return (
      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] px-6 py-14 text-center">
        <p className="font-editorial text-[1.2rem] text-brand-ink italic">
          {NOTE_NOT_FOUND_MESSAGE}
        </p>
        <Link
          href={vaultRoutes.notes}
          className="mt-5 inline-flex items-center gap-2 text-[0.82rem] text-white/58 hover:text-white/78"
        >
          <ArrowLeft aria-hidden className="size-3.5" />
          Back to All Notes
        </Link>
      </section>
    );
  }

  if (loadError || !note || !values) {
    return (
      <section className="rounded-2xl border border-white/10 bg-white/[0.03] px-6 py-10 text-center">
        <p className="text-[0.86rem] text-white/58">{loadError || NOTE_DETAIL_LOAD_ERROR}</p>
        <Link
          href={vaultRoutes.notes}
          className="mt-4 inline-flex items-center gap-2 text-[0.82rem] text-white/58 hover:text-white/78"
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
          className="inline-flex items-center gap-2 text-[0.82rem] text-white/52 transition-colors hover:text-white/78"
        >
          <ArrowLeft aria-hidden className="size-3.5" />
          Back to All Notes
        </Link>

        {!editing ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleEditClick}
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/12 px-4 text-[0.72rem] tracking-[0.12em] text-white/62 uppercase transition-colors hover:border-white/20 hover:text-white/82"
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
              className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/16 bg-white/[0.04] px-4 text-[0.72rem] tracking-[0.12em] text-white/68 uppercase transition-colors hover:border-white/24 hover:bg-white/[0.07] hover:text-white/86"
            >
              <Trash2 aria-hidden className="size-3.5" />
              Delete
            </button>
          </div>
        ) : null}
      </div>

      {successMessage ? (
        <p
          role="status"
          className="rounded-xl border border-white/14 bg-white/[0.05] px-3.5 py-3 text-[0.84rem] text-brand-ink"
        >
          {successMessage}
        </p>
      ) : null}

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
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[0.82rem] text-white/62"
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
              className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/12 px-4 text-[0.74rem] tracking-[0.12em] text-white/58 uppercase"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              aria-busy={saving}
              className={cn(
                "inline-flex min-h-11 items-center justify-center rounded-full bg-brand-ink px-5 text-[0.74rem] tracking-[0.14em] text-brand-void uppercase disabled:cursor-not-allowed",
                saving && "opacity-80",
              )}
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      ) : (
        <article className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-5 shadow-[0_12px_32px_rgba(0,0,0,0.18)] sm:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <h1 className="min-w-0 flex-1 font-editorial text-[1.65rem] leading-tight text-brand-ink italic sm:text-[1.9rem]">
              {note.title}
            </h1>
            <span className="shrink-0 rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-0.5 text-[0.62rem] tracking-[0.12em] text-white/45 uppercase">
              {typeLabel}
            </span>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.74rem] text-white/36">
            {note.category ? (
              <span className="rounded-full border border-white/10 px-2 py-0.5 text-white/52">
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
              className="mt-4 inline-flex items-center gap-1.5 text-[0.82rem] text-white/52 underline-offset-2 hover:text-white/78 hover:underline"
            >
              <ExternalLink aria-hidden className="size-3.5" />
              {note.sourceUrl}
            </a>
          ) : null}

          <div className="mt-6 border-t border-white/[0.06] pt-6">
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
        <p className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 text-[0.86rem] text-white/72">
          {note.title}
        </p>
        {deleteError ? (
          <p className="mt-3 text-[0.78rem] text-white/55" role="alert">
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
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/12 px-4 text-[0.72rem] tracking-[0.12em] text-white/58 uppercase"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleDelete()}
            disabled={deleting}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-red-400/30 bg-red-400/[0.08] px-4 text-[0.72rem] tracking-[0.12em] text-red-200/90 uppercase disabled:opacity-70"
          >
            {deleting ? "Deleting..." : "Delete Note"}
          </button>
        </div>
      </VaultDialog>
    </motion.div>
  );
}
