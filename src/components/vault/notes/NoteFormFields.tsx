"use client";

import type { RefObject } from "react";

import { CATEGORY_LOAD_ERROR } from "@/lib/categories/category-client";
import type { SerializedCategory } from "@/lib/categories/category-client";
import { captureNoteTypeOptions } from "@/lib/notes/capture-config";
import type {
  CaptureFieldErrors,
  CaptureFormValues,
} from "@/lib/notes/capture-validation";

import {
  CaptureInputField,
  CaptureSelectField,
  CaptureTextareaField,
} from "../capture/CaptureField";

type NoteFormFieldsProps = {
  idPrefix: string;
  values: CaptureFormValues;
  errors: CaptureFieldErrors;
  onChange: <K extends keyof CaptureFormValues>(
    key: K,
    value: CaptureFormValues[K],
  ) => void;
  disabled?: boolean;
  categories: SerializedCategory[];
  categoriesLoading?: boolean;
  categoriesError?: string;
  contentRef?: RefObject<HTMLTextAreaElement | null>;
  contentLabel?: string;
  contentPlaceholder?: string;
};

export function NoteFormFields({
  idPrefix,
  values,
  errors,
  onChange,
  disabled,
  categories,
  categoriesLoading,
  categoriesError,
  contentRef,
  contentLabel = "Content",
  contentPlaceholder = "Write your note...",
}: NoteFormFieldsProps) {
  return (
    <div className="space-y-5">
      <CaptureTextareaField
        ref={contentRef}
        id={`${idPrefix}-content`}
        label={contentLabel}
        value={values.content}
        onChange={(event) => onChange("content", event.target.value)}
        placeholder={contentPlaceholder}
        disabled={disabled}
        error={errors.content}
      />

      <CaptureInputField
        id={`${idPrefix}-title`}
        label="Title"
        value={values.title}
        onChange={(event) => onChange("title", event.target.value)}
        placeholder="Give this note a title"
        disabled={disabled}
        error={errors.title}
        autoComplete="off"
      />

      <div className="grid gap-5 sm:grid-cols-2">
        <CaptureSelectField
          id={`${idPrefix}-type`}
          label="Type"
          value={values.type}
          onChange={(event) => onChange("type", event.target.value)}
          disabled={disabled}
          error={errors.type}
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
          disabled={disabled || categoriesLoading}
          error={errors.categoryId}
          hint={
            categoriesError
              ? CATEGORY_LOAD_ERROR
              : categoriesLoading
                ? "Loading categories..."
                : undefined
          }
          options={[
            { value: "", label: "None / Uncategorized" },
            ...categories.map((category) => ({
              value: category.id,
              label: category.name,
            })),
          ]}
        />
      </div>

      <CaptureInputField
        id={`${idPrefix}-source-url`}
        label="Source URL"
        type="url"
        inputMode="url"
        value={values.sourceUrl}
        onChange={(event) => onChange("sourceUrl", event.target.value)}
        placeholder="Optional..."
        disabled={disabled}
        error={errors.sourceUrl}
        autoComplete="off"
      />
    </div>
  );
}
