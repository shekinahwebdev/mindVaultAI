"use client";

import { ArrowLeft } from "lucide-react";
import type { FormEvent, RefObject } from "react";

import { CATEGORY_LOAD_ERROR } from "@/lib/categories/category-client";
import type { SerializedCategory } from "@/lib/categories/category-client";
import { captureNoteTypeOptions } from "@/lib/notes/capture-config";
import type {
  CaptureFieldErrors,
  CaptureFormValues,
} from "@/lib/notes/capture-validation";
import { vaultEditorialPageTitleClassName } from "@/lib/vault/vault-typography";
import { cn } from "@/lib/utils";

import { TagMultiSelect } from "@/components/vault/tags/TagMultiSelect";

import {
  CaptureInputField,
  CaptureSelectField,
} from "../capture/CaptureField";
import {
  vaultPrimaryButton,
  vaultSecondaryButton,
} from "../vault-controls";

import { noteEditorBodyClassName } from "./note-detail-ui";

const editSectionLabelClassName =
  "text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-mv-faint";

const editPropertiesWidthClassName = "w-full lg:w-[16.75rem] xl:w-[18.75rem]";

type NoteDetailEditFormProps = {
  idPrefix: string;
  values: CaptureFormValues;
  errors: CaptureFieldErrors;
  onChange: <K extends keyof CaptureFormValues>(
    key: K,
    value: CaptureFormValues[K],
  ) => void;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onCancel: () => void;
  saving: boolean;
  formError: string;
  categories: SerializedCategory[];
  categoriesLoading?: boolean;
  categoriesError?: string;
  contentRef?: RefObject<HTMLTextAreaElement | null>;
};

function EditFieldMessage({ id, error }: { id: string; error?: string }) {
  if (!error) return null;
  return (
    <span id={`${id}-error`} className="mt-1.5 text-[0.75rem] text-muted-foreground">
      {error}
    </span>
  );
}

export function NoteDetailEditForm({
  idPrefix,
  values,
  errors,
  onChange,
  onSubmit,
  onCancel,
  saving,
  formError,
  categories,
  categoriesLoading,
  categoriesError,
  contentRef,
}: NoteDetailEditFormProps) {
  const titleId = `${idPrefix}-title`;
  const contentId = `${idPrefix}-content`;

  return (
    <form
      onSubmit={onSubmit}
      className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden"
    >
      <header className="sticky top-0 z-20 flex shrink-0 items-center justify-between gap-3 border-b border-border bg-surface/95 px-3 py-2.5 backdrop-blur-sm sm:px-4">
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="inline-flex min-w-0 items-center gap-2 rounded-[var(--mv-radius-control)] py-1.5 text-left text-[0.8125rem] text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-50"
        >
          <ArrowLeft aria-hidden className="size-3.5 shrink-0" />
          <span className="truncate">
            <span className="hidden sm:inline">Back · </span>
            <span className="font-medium text-foreground">Edit note</span>
          </span>
        </button>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className={cn(vaultSecondaryButton, "h-9 px-3 text-[0.8125rem]")}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            aria-busy={saving}
            className={cn(vaultPrimaryButton, "h-9 px-3.5 text-[0.8125rem]", saving && "opacity-80")}
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="mv-scrollbar flex min-h-0 min-w-0 flex-1 flex-col overflow-y-auto overscroll-contain px-4 py-5 sm:px-6 lg:px-8 lg:py-6">
          <div className="mx-auto flex w-full max-w-[42rem] min-w-0 flex-1 flex-col">
            <label htmlFor={titleId} className="sr-only">
              Title
            </label>
            <input
              id={titleId}
              name="title"
              value={values.title}
              onChange={(event) => onChange("title", event.target.value)}
              disabled={saving}
              autoComplete="off"
              aria-invalid={errors.title ? true : undefined}
              aria-describedby={errors.title ? `${titleId}-error` : undefined}
              placeholder="Note title"
              className={cn(
                "w-full border-0 bg-transparent px-0 py-1 text-foreground outline-none",
                "placeholder:text-mv-faint",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                vaultEditorialPageTitleClassName,
                "text-[1.75rem] sm:text-[2rem]",
              )}
            />
            <EditFieldMessage id={titleId} error={errors.title} />

            <p className="sr-only" id={`${contentId}-label`}>
              Note content
            </p>
            <div className="my-4 h-px w-full shrink-0 bg-border" role="separator" />

            <textarea
              ref={contentRef}
              id={contentId}
              name="content"
              value={values.content}
              onChange={(event) => onChange("content", event.target.value)}
              disabled={saving}
              aria-labelledby={`${contentId}-label`}
              aria-invalid={errors.content ? true : undefined}
              aria-describedby={errors.content ? `${contentId}-error` : undefined}
              placeholder="Write your note…"
              className={cn(
                noteEditorBodyClassName,
                "min-h-[min(55vh,36rem)] w-full flex-1 resize-y border-0 bg-transparent px-0 py-0 text-[1rem] leading-[1.65]",
                "text-foreground outline-none placeholder:text-mv-faint",
                "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                "disabled:cursor-not-allowed disabled:opacity-60",
              )}
            />
            <EditFieldMessage id={contentId} error={errors.content} />

            {formError ? (
              <p role="alert" className="mt-3 text-[0.8125rem] text-muted-foreground">
                {formError}
              </p>
            ) : null}
          </div>
        </div>

        <aside
          className={cn(
            "mv-scrollbar shrink-0 overflow-y-auto overscroll-contain border-border bg-mv-panel/40 px-4 py-5 lg:border-l lg:py-6",
            editPropertiesWidthClassName,
          )}
        >
          <div className="space-y-6">
            <section aria-labelledby={`${idPrefix}-props-heading`}>
              <h2 id={`${idPrefix}-props-heading`} className={editSectionLabelClassName}>
                Properties
              </h2>
              <div className="mt-3 space-y-4">
                <CaptureSelectField
                  id={`${idPrefix}-type`}
                  label="Type"
                  value={values.type}
                  onChange={(event) => onChange("type", event.target.value)}
                  disabled={saving}
                  error={errors.type}
                  className="[&_span:first-child]:text-[0.8125rem]"
                  options={captureNoteTypeOptions.map((option) => ({
                    value: option.value,
                    label: option.label,
                  }))}
                />

                <CaptureSelectField
                  id={`${idPrefix}-category`}
                  label="Category"
                  value={values.categoryId}
                  onChange={(event) => onChange("categoryId", event.target.value)}
                  disabled={saving || categoriesLoading}
                  error={errors.categoryId}
                  hint={
                    categoriesError
                      ? CATEGORY_LOAD_ERROR
                      : categoriesLoading
                        ? "Loading categories..."
                        : undefined
                  }
                  className="[&_span:first-child]:text-[0.8125rem]"
                  options={[
                    { value: "", label: "None / Uncategorized" },
                    ...categories.map((category) => ({
                      value: category.id,
                      label: category.name,
                    })),
                  ]}
                />
              </div>
            </section>

            <section aria-labelledby={`${idPrefix}-tags-heading`}>
              <h2 id={`${idPrefix}-tags-heading`} className={editSectionLabelClassName}>
                Tags
              </h2>
              <div className="mt-3">
                <TagMultiSelect
                  label="Tags"
                  value={values.tagIds}
                  onChange={(tagIds) => onChange("tagIds", tagIds)}
                  disabled={saving}
                  error={errors.tagIds}
                />
              </div>
            </section>

            <section aria-labelledby={`${idPrefix}-source-heading`}>
              <h2 id={`${idPrefix}-source-heading`} className={editSectionLabelClassName}>
                Source
              </h2>
              <div className="mt-3">
                <CaptureInputField
                  id={`${idPrefix}-source-url`}
                  label="Source URL"
                  type="url"
                  inputMode="url"
                  value={values.sourceUrl}
                  onChange={(event) => onChange("sourceUrl", event.target.value)}
                  placeholder="https://…"
                  disabled={saving}
                  error={errors.sourceUrl}
                  autoComplete="off"
                  className="[&_input]:break-all [&_span:first-child]:text-[0.8125rem]"
                />
              </div>
            </section>
          </div>
        </aside>
      </div>
    </form>
  );
}