"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

import { VaultDialog } from "@/components/vault/VaultDialog";
import {
  CATEGORY_CLIENT_ERROR,
  createCategory,
  deleteCategory,
  renameCategory,
  type SerializedCategory,
} from "@/lib/categories/category-client";
import { validateCategoryNameField } from "@/lib/categories/category-validation-client";
import { useCategories } from "@/lib/categories/use-categories";
import { routes } from "@/lib/routes";
import { toastError, toastSuccess } from "@/lib/vault-toast";
import { cn } from "@/lib/utils";

import {
  vaultDestructiveButton,
  vaultPageLeadClassName,
  vaultPageTitleClassName,
  vaultPrimaryButton,
  vaultSecondaryButton,
} from "../vault-controls";

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
      toastSuccess("Category added.");
      router.refresh();
    } catch {
      toastError(CATEGORY_CLIENT_ERROR);
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
      toastSuccess("Category updated.");
      router.refresh();
    } catch {
      toastError(CATEGORY_CLIENT_ERROR);
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
      toastSuccess("Removed from your vault.");
      router.refresh();
    } catch {
      toastError(CATEGORY_CLIENT_ERROR);
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
          <h1 className={vaultPageTitleClassName}>
            Categories
          </h1>
          <p className={vaultPageLeadClassName}>
            Group what you&apos;ve saved into categories that fit the way you
            think.
          </p>
        </div>
        <button
          type="button"
          onClick={openAddDialog}
          className={vaultPrimaryButton}
        >
          <Plus aria-hidden className="size-4" />
          Add Category
        </button>
      </div>

      {error ? (
        <div className="rounded-xl border border-border bg-mv-panel px-3.5 py-3 text-[0.84rem] text-muted-foreground">
          <p>{error}</p>
          <button
            type="button"
            onClick={() => void refresh()}
            className="mt-2 text-[0.8125rem] font-medium text-foreground underline-offset-2 hover:underline"
          >
            Try again
          </button>
        </div>
      ) : null}

      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-4 sm:p-5 shadow-[0_1px_2px_rgb(0_0_0/0.03)]">
        {loading ? (
          <p className="py-10 text-center text-[0.84rem] text-muted-foreground">
            Loading categories...
          </p>
        ) : categories.length === 0 ? (
          <div className="py-10 text-center">
          <p className="text-[1.15rem] font-medium text-foreground">
              No categories yet.
            </p>
            <p className="mt-2 text-[0.84rem] text-muted-foreground">
              Create one when you want to group what you&apos;ve saved.
            </p>
            <button
              type="button"
              onClick={openAddDialog}
              className={cn(vaultSecondaryButton, "mt-5 gap-2")}
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
          <p className="mt-3 text-[0.78rem] text-muted-foreground" role="alert">
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
            className={vaultSecondaryButton}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleCreate()}
            disabled={saving}
            className={cn(vaultPrimaryButton, saving && "opacity-80")}
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
          <p className="mt-3 text-[0.78rem] text-muted-foreground" role="alert">
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
            className={vaultSecondaryButton}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={() => void handleRename()}
            disabled={saving}
            className={cn(vaultPrimaryButton, saving && "opacity-80")}
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
          <p className="rounded-xl border border-border bg-mv-panel px-3.5 py-2.5 text-[0.86rem] text-foreground/80">
            {deleteTarget.name}
            <span className="mt-1 block text-[0.74rem] text-mv-faint">
              {deleteTarget.noteCount === 1
                ? "1 note will become uncategorized"
                : `${deleteTarget.noteCount} notes will become uncategorized`}
            </span>
          </p>
        ) : null}
        {formError ? (
          <p className="mt-3 text-[0.78rem] text-muted-foreground" role="alert">
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
            {deleting ? "Deleting…" : "Delete category"}
          </button>
        </div>
      </VaultDialog>
    </motion.div>
  );
}
