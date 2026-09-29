"use client";

import { Sparkles } from "lucide-react";

import { CATEGORY_LOAD_ERROR } from "@/lib/categories/category-client";
import type { SerializedCategory } from "@/lib/categories/category-client";
import {
  CAPTURE_ANALYZE_LABEL,
  CAPTURE_ANALYZING_LABEL,
  CAPTURE_ANALYZE_MIN_LENGTH,
  CAPTURE_SUGGESTED_LABEL,
} from "@/lib/notes/capture-config";
import type { CaptureFormValues } from "@/lib/notes/capture-client";
import { countWords } from "@/lib/notes/note-detail-utils";
import { cn } from "@/lib/utils";

import { vaultGhostButton, vaultPanelClassName } from "../vault-controls";

import { TagAnalyzeSuggestions } from "@/components/vault/tags/TagAnalyzeSuggestions";
import { TagMultiSelect } from "@/components/vault/tags/TagMultiSelect";
import type { AnalyzeTagSuggestions } from "@/lib/notes/capture-client";

import { CaptureInputField, CaptureSelectField } from "./CaptureField";

type CaptureFieldErrors = Partial<Record<keyof CaptureFormValues, string>>;

type CaptureMetaPanelProps = {
  formValues: CaptureFormValues;
  errors: CaptureFieldErrors;
  categories: SerializedCategory[];
  categoriesLoading: boolean;
  categoriesError: string | null;
  suggestedKeys: Set<"title" | "type" | "categoryId">;
  emphasizeSourceUrl: boolean;
  disabled: boolean;
  analyzing: boolean;
  aiEnabled: boolean;
  onAnalyze: () => void;
  onFieldChange: <K extends keyof CaptureFormValues>(
    key: K,
    value: CaptureFormValues[K],
  ) => void;
  aiTagSuggestions: AnalyzeTagSuggestions | null;
  dismissedAiTagKeys: Set<string>;
  onDismissAiTag: (key: string) => void;
  onAcceptExistingAiTag: (id: string) => void;
  onAcceptNewAiTag: (name: string) => void;
};

export function CaptureMetaPanel({
  formValues,
  errors,
  categories,
  categoriesLoading,
  categoriesError,
  suggestedKeys,
  emphasizeSourceUrl,
  disabled,
  analyzing,
  aiEnabled,
  onAnalyze,
  onFieldChange,
  aiTagSuggestions,
  dismissedAiTagKeys,
  onDismissAiTag,
  onAcceptExistingAiTag,
  onAcceptNewAiTag,
}: CaptureMetaPanelProps) {
  const wordCount = countWords(formValues.content);
  const canAnalyze =
    aiEnabled && formValues.content.trim().length >= CAPTURE_ANALYZE_MIN_LENGTH;

  return (
    <aside className="flex flex-col gap-3 overflow-visible lg:sticky lg:top-4 lg:self-start">
      <div className={cn(vaultPanelClassName, "p-4 shadow-[var(--mv-shadow-card)]")}>
        <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.06em] text-muted-foreground">
          Organize
        </p>

        <div className="mt-3 space-y-3 overflow-visible">
          <CaptureSelectField
            id="capture-category"
            label="Category"
            value={formValues.categoryId}
            onChange={(event) => onFieldChange("categoryId", event.target.value)}
            disabled={disabled || categoriesLoading}
            error={errors.categoryId}
            hint={
              categoriesError
                ? CATEGORY_LOAD_ERROR
                : categoriesLoading
                  ? "Loading categories..."
                  : suggestedKeys.has("categoryId")
                    ? CAPTURE_SUGGESTED_LABEL
                    : undefined
            }
            options={[
              { value: "", label: "Uncategorized" },
              ...categories.map((category) => ({
                value: category.id,
                label: category.name,
              })),
            ]}
          />

          <TagMultiSelect
            value={formValues.tagIds ?? []}
            onChange={(tagIds) => onFieldChange("tagIds", tagIds)}
            disabled={disabled}
            error={errors.tagIds}
          />

          <TagAnalyzeSuggestions
            suggestions={aiTagSuggestions}
            dismissedKeys={dismissedAiTagKeys}
            selectedTagIds={formValues.tagIds ?? []}
            disabled={disabled || analyzing}
            onDismiss={onDismissAiTag}
            onAcceptExisting={onAcceptExistingAiTag}
            onAcceptNew={onAcceptNewAiTag}
          />

          <CaptureInputField
            id="capture-source-url"
            label={emphasizeSourceUrl ? "Source URL" : "Source URL (optional)"}
            type="url"
            inputMode="url"
            value={formValues.sourceUrl}
            onChange={(event) => onFieldChange("sourceUrl", event.target.value)}
            placeholder={emphasizeSourceUrl ? "https://…" : "Optional"}
            disabled={disabled}
            error={errors.sourceUrl}
            autoComplete="off"
          />
        </div>
      </div>

      <div className={cn(vaultPanelClassName, "p-4")}>
        <div className="flex items-center justify-between gap-2">
          <p className="text-[0.8125rem] text-muted-foreground">
            <span className="font-medium tabular-nums text-foreground">{wordCount}</span>{" "}
            {wordCount === 1 ? "word" : "words"}
          </p>
          {aiEnabled ? (
            <button
              type="button"
              onClick={onAnalyze}
              disabled={disabled || analyzing || !canAnalyze}
              aria-busy={analyzing}
              className={cn(
                vaultGhostButton,
                "h-8 gap-1.5 border border-border px-2.5 text-[0.75rem]",
              )}
            >
              <Sparkles aria-hidden className="size-3.5" />
              {analyzing ? CAPTURE_ANALYZING_LABEL : CAPTURE_ANALYZE_LABEL}
            </button>
          ) : null}
        </div>
        {aiEnabled && !canAnalyze ? (
          <p className="mt-2 text-[0.75rem] leading-snug text-mv-faint">
            Add a few more words to enable AI suggestions for title, type, category, and tags.
          </p>
        ) : null}
      </div>
    </aside>
  );
}
