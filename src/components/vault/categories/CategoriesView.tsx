"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { VaultDialog } from "@/components/vault/VaultDialog";
import {
  CATEGORY_ADDED_MESSAGE,
  CATEGORY_CLIENT_ERROR,
  CATEGORY_DELETED_MESSAGE,
  CATEGORY_RENAMED_MESSAGE,
  createCategory,
  deleteCategory,
  renameCategory,
  type SerializedCategory,
} from "@/lib/categories/category-client";
import { validateCategoryNameField } from "@/lib/categories/category-validation-client";
import { useCategories } from "@/lib/categories/use-categories";
import { routes } from "@/lib/routes";

import { vaultEase } from "../vault-motion";
import { CategoryNameField } from "./CategoryNameField";
import { CategoryRow } from "./CategoryRow";

const DELETE_CONFIRM_MESSAGE =
  "Deleting this category will not delete its notes. Those notes will become uncategorized.";

export function CategoriesView() {
  const router = useRouter();
  const submittingRef = useRef(false);
  const { categories, loading, error, refresh, setCategories } = useCategories();

  const [addOpen, setAddOpen] = useState(false);
  const [renameTarget, setRenameTarget] = useState<SerializedCategory | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<SerializedCategory | null>(
    null,
  );

  const [name, setName] = useState("");
  const [fieldError, setFieldError] = useState("");
  const [formError, setFormError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  function resetForm() {
    setName("");
    setFieldError("");
    setFormError("");
  }

  function openAddDialog() {
    resetForm();
    setAddOpen(true);
  }

  function openRenameDialog(category: SerializedCategory) {
    resetForm();
    setRenameTarget(category);
    setName(category.name);
  }

  function openDeleteDialog(category: SerializedCategory) {
    setFormError("");
    setDeleteTarget(category);
  }

  async function handleCreate() {
    if (saving || submittingRef.current) {
      return;
    }

    const errors = validateCategoryNameField(name);
    if (errors.name) {
      setFieldError(errors.name);
      return;
    }

    submittingRef.current = true;
    setSaving(true);
    setFieldError("");
    setFormError("");

    try {
      const { response, data } = await createCategory(name.trim());

      if (response.status === 401) {
        router.push(routes.signIn);
        return;
      }

      if (!data || !response.ok || !data.ok) {
        if (data && !data.ok && data.errors?.name) {
          setFieldError(data.errors.name);
        } else {
          setFormError(
            data && !data.ok && data.message
              ? data.message
              : CATEGORY_CLIENT_ERROR,
          );
        }
        return;
      }

      setCategories((current) =>
        [...current, data.category].sort((a, b) =>
          a.name.localeCompare(b.name),
        ),
      );
      setAddOpen(false);
      resetForm();
      setSuccessMessage(CATEGORY_ADDED_MESSAGE);
      router.refresh();
    } catch {
      setFormError(CATEGORY_CLIENT_ERROR);
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  }

  async function handleRename() {
    if (!renameTarget || saving || submittingRef.current) {
      return;
    }

    const errors = validateCategoryNameField(name);
    if (errors.name) {
      setFieldError(errors.name);
      return;
    }

    submittingRef.current = true;
    setSaving(true);
    setFieldError("");
    setFormError("");

    try {
      const { response, data } = await renameCategory(renameTarget.id, name.trim());

      if (response.status === 401) {
        router.push(routes.signIn);
        return;
      }

      if (!data || !response.ok || !data.ok) {
        if (data && !data.ok && data.errors?.name) {
          setFieldError(data.errors.name);
        } else {
          setFormError(
            data && !data.ok && data.message
              ? data.message
              : CATEGORY_CLIENT_ERROR,
          );
        }
        return;
      }

      setCategories((current) =>
        current
          .map((category) =>
            category.id === renameTarget.id ? data.category : category,
          )
          .sort((a, b) => a.name.localeCompare(b.name)),
      );
      setRenameTarget(null);
      resetForm();
      setSuccessMessage(CATEGORY_RENAMED_MESSAGE);
      router.refresh();
    } catch {
      setFormError(CATEGORY_CLIENT_ERROR);
    } finally {
      submittingRef.current = false;
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget || deleting || submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    setDeleting(true);
    setFormError("");

    try {
      const { response, data } = await deleteCategory(deleteTarget.id);

      if (response.status === 401) {
        router.push(routes.signIn);
        return;
      }

      if (!data || !response.ok || !data.ok) {
        setFormError(
          data && !data.ok && "message" in data && data.message
            ? data.message
            : CATEGORY_CLIENT_ERROR,
        );
        return;
      }

      setCategories((current) =>
        current.filter((category) => category.id !== deleteTarget.id),
      );
      setDeleteTarget(null);
      setSuccessMessage(CATEGORY_DELETED_MESSAGE);
      router.refresh();
    } catch {
      setFormError(CATEGORY_CLIENT_ERROR);
    } finally {
      submittingRef.current = false;
      setDeleting(false);
    }
  }

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
            Categories
          </h1>
          <p className="mt-2 max-w-xl text-[0.88rem] leading-relaxed text-white/46">
            Group what you&apos;ve saved into categories that fit the way you
            think.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddDialog}
          className="inline-flex min-h-10 items-center gap-2 rounded-full bg-brand-ink px-4 text-[0.74rem] tracking-[0.14em] text-brand-void uppercase transition-opacity hover:opacity-90"
        >
          <Plus aria-hidden className="size-4" />
          Add Category
        </button>
      </div>

      {successMessage ? (
        <p
          role="status"
          className="rounded-xl border border-white/14 bg-white/[0.05] px-3.5 py-3 text-[0.84rem] text-brand-ink"
        >
          {successMessage}
        </p>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-[0.84rem] text-white/58">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-2 text-[0.74rem] tracking-[0.1em] text-white/72 uppercase underline-offset-2 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : null}

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.18)] sm:p-5">
        {loading ? (
          <p className="py-10 text-center text-[0.84rem] text-white/42">
            Loading categories...
          </p>
        ) : categories.length === 0 ? (
          <div className="py-10 text-center">
            <p className="font-editorial text-[1.15rem] text-brand-ink italic">
              No categories yet.
            </p>
            <p className="mt-2 text-[0.84rem] text-white/42">
              Create one when you want to group what you&apos;ve saved.
            </p>
            <button
              type="button"
              onClick={openAddDialog}
              className="mt-5 inline-flex min-h-10 items-center gap-2 rounded-full border border-white/16 px-4 text-[0.74rem] tracking-[0.12em] text-white/72 uppercase transition-colors hover:border-white/24 hover:text-white/88"
            >
              <Plus aria-hidden className="size-3.5" />
              Add Category
            </button>
          </div>
        ) : (
          <ul className="space-y-2.5">
            {categories.map((category) => (
              <CategoryRow
                key={category.id}
                category={category}
                onRename={openRenameDialog}
                onDelete={openDeleteDialog}
                busy={saving || deleting}
              />
            ))}
          </ul>
        )}
      </section>

      <VaultDialog
        open={addOpen}
        title="Add Category"
        description="Create a category to organize notes in your vault."
        onClose={() => {
          if (!saving) {
            setAddOpen(false);
            resetForm();
          }
        }}
      >
        <CategoryNameField
          id="add-category-name"
          label="Name"
          value={name}
          onChange={(value) => {
            setName(value);
            setFieldError("");
            setFormError("");
          }}
          error={fieldError}
          disabled={saving}
          autoFocus
        />
        {formError ? (
          <p className="mt-3 text-[0.78rem] text-white/55" role="alert">
            {formError}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => {
              setAddOpen(false);
              resetForm();
            }}
            disabled={saving}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/12 px-4 text-[0.72rem] tracking-[0.12em] text-white/58 uppercase"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={saving}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-brand-ink px-4 text-[0.72rem] tracking-[0.14em] text-brand-void uppercase disabled:opacity-70"
          >
            {saving ? "Saving..." : "Add Category"}
          </button>
        </div>
      </VaultDialog>

      <VaultDialog
        open={renameTarget !== null}
        title="Rename Category"
        onClose={() => {
          if (!saving) {
            setRenameTarget(null);
            resetForm();
          }
        }}
      >
        <CategoryNameField
          id="rename-category-name"
          label="Name"
          value={name}
          onChange={(value) => {
            setName(value);
            setFieldError("");
            setFormError("");
          }}
          error={fieldError}
          disabled={saving}
          autoFocus
        />
        {formError ? (
          <p className="mt-3 text-[0.78rem] text-white/55" role="alert">
            {formError}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => {
              setRenameTarget(null);
              resetForm();
            }}
            disabled={saving}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/12 px-4 text-[0.72rem] tracking-[0.12em] text-white/58 uppercase"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleRename()}
            disabled={saving}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-brand-ink px-4 text-[0.72rem] tracking-[0.14em] text-brand-void uppercase disabled:opacity-70"
          >
            {saving ? "Saving..." : "Save Name"}
          </button>
        </div>
      </VaultDialog>

      <VaultDialog
        open={deleteTarget !== null}
        title="Delete Category"
        description={DELETE_CONFIRM_MESSAGE}
        onClose={() => {
          if (!deleting) {
            setDeleteTarget(null);
            setFormError("");
          }
        }}
      >
        {deleteTarget ? (
          <p className="rounded-xl border border-white/[0.08] bg-white/[0.02] px-3.5 py-2.5 text-[0.86rem] text-white/72">
            {deleteTarget.name}
            <span className="mt-1 block text-[0.74rem] text-white/38">
              {deleteTarget.noteCount === 1
                ? "1 note will become uncategorized"
                : `${deleteTarget.noteCount} notes will become uncategorized`}
            </span>
          </p>
        ) : null}
        {formError ? (
          <p className="mt-3 text-[0.78rem] text-white/55" role="alert">
            {formError}
          </p>
        ) : null}
        <div className="mt-5 flex justify-end gap-2.5">
          <button
            type="button"
            onClick={() => {
              setDeleteTarget(null);
              setFormError("");
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
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-white/20 bg-white/[0.06] px-4 text-[0.72rem] tracking-[0.12em] text-white/78 uppercase disabled:opacity-70"
          >
            {deleting ? "Deleting..." : "Delete Category"}
          </button>
        </div>
      </VaultDialog>
    </motion.div>
  );
}
