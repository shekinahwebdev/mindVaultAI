"use client";

import { ArrowLeft } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
  type FormEvent,
} from "react";

import { NoteType } from "@/generated/prisma/enums";

import {
  CAPTURE_ANALYZE_MIN_LENGTH,
  CAPTURE_DEFAULT_TYPE,
  CAPTURE_DISCARD_CONFIRM,
  CAPTURE_IMPORT_GENERIC_ERROR,
  CAPTURE_IMPORT_REPLACE_CONFIRM,
  CAPTURE_IMPORT_SUCCESS,
  CAPTURE_SERVER_ERROR,
  CAPTURE_SUCCESS_MESSAGE,
  CAPTURE_SUGGESTED_LABEL,
  CAPTURE_UNAUTHORIZED,
  captureNoteTypeOptions,
} from "@/lib/notes/capture-config";
import type { IngestUrlPreview } from "@/lib/notes/ingest-client";
import type {
  AnalyzeTagSuggestions,
  CaptureFormValues,
} from "@/lib/notes/capture-client";
import {
  analyzeNoteRequest,
  captureFormIsDirty,
  createNoteRequest,
  emptyCaptureValues,
  validateCaptureForm,
} from "@/lib/notes/capture-client";
import { MAX_TAGS_PER_NOTE } from "@/lib/notes/note-tag-limits";
import {
  createTag,
  fetchTags,
  TAG_CLIENT_ERROR,
} from "@/lib/tags/tags-client";
import { routes, vaultRoutes } from "@/lib/routes";
import { useCategories } from "@/lib/categories/use-categories";
import { usePreferences } from "@/lib/settings/preferences-context";
import { toastError, toastSuccess } from "@/lib/vault-toast";
import { cn } from "@/lib/utils";

import { captureMetaForType } from "@/lib/notes/capture-type-ui";
import { NoteTypeIcon } from "@/lib/vault/note-type-ui";

import {
  vaultIconButton,
  vaultPanelClassName,
  vaultPrimaryButton,
  vaultSecondaryButton,
} from "../vault-controls";

import {
  CaptureEditorField,
  CaptureTitleField,
} from "./CaptureField";
import { CaptureMetaPanel } from "./CaptureMetaPanel";
import { CaptureTypeSwitcher } from "./CaptureTypeSwitcher";
import { CaptureUrlImport } from "./CaptureUrlImport";

type CaptureFormProps = {
  onRequestClose: () => void;
};

export type CaptureFormHandle = {
  requestClose: () => void;
};

type CaptureFieldErrors = Partial<Record<keyof CaptureFormValues, string>>;

export const CaptureForm = forwardRef<CaptureFormHandle, CaptureFormProps>(
  function CaptureForm({ onRequestClose }, ref) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const submittingRef = useRef(false);
  const [values, setValues] = useState<CaptureFormValues>(emptyCaptureValues);
  const [errors, setErrors] = useState<CaptureFieldErrors>({});
  const [, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [suggestedKeys, setSuggestedKeys] = useState<
    Set<"title" | "type" | "categoryId">
  >(new Set());
  const [aiTagSuggestions, setAiTagSuggestions] =
    useState<AnalyzeTagSuggestions | null>(null);
  const [dismissedAiTagKeys, setDismissedAiTagKeys] = useState<Set<string>>(
    () => new Set(),
  );
  const analyzeAbortRef = useRef<AbortController | null>(null);
  const typeTouchedByUserRef = useRef(false);
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCategories();
  const { preferences, loading: preferencesLoading } = usePreferences();

  const formValues = useMemo<CaptureFormValues>(() => {
    if (preferencesLoading || captureFormIsDirty(values)) {
      return values;
    }

    return {
      ...values,
      type: preferences.defaultNoteType,
      categoryId: preferences.defaultCategoryId ?? "",
      tagIds: values.tagIds ?? [],
    };
  }, [preferences.defaultCategoryId, preferences.defaultNoteType, preferencesLoading, values]);

  useEffect(() => {
    const typeParam = searchParams.get("type");
    if (!typeParam) {
      return;
    }
    const isValid = captureNoteTypeOptions.some(
      (option) => option.value === typeParam,
    );
    if (!isValid) {
      return;
    }
    typeTouchedByUserRef.current = true;
    setValues((current) => ({
      ...current,
      type: typeParam as CaptureFormValues["type"],
    }));
  }, [searchParams]);

  useEffect(() => {
    return () => {
      analyzeAbortRef.current?.abort();
    };
  }, []);

  useEffect(() => {
    contentRef.current?.focus();
  }, []);

  const requestClose = useCallback(() => {
    if (loading || success) {
      return;
    }

    if (!captureFormIsDirty(formValues)) {
      onRequestClose();
      return;
    }

    if (window.confirm(CAPTURE_DISCARD_CONFIRM)) {
      onRequestClose();
    }
  }, [loading, onRequestClose, success, formValues]);

  useImperativeHandle(ref, () => ({ requestClose }), [requestClose]);

  const handleEscape = useCallback(
    (event: KeyboardEvent) => {
      if (event.key !== "Escape" || loading || success) {
        return;
      }

      event.preventDefault();
      requestClose();
    },
    [loading, requestClose, success],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [handleEscape]);

  function updateField<K extends keyof CaptureFormValues>(
    key: K,
    value: CaptureFormValues[K],
  ) {
    if (key === "type") {
      typeTouchedByUserRef.current = true;
      const nextType = value as CaptureFormValues["type"];
      const params = new URLSearchParams(searchParams.toString());
      params.set("type", nextType);
      router.replace(`${vaultRoutes.capture}?${params.toString()}`, {
        scroll: false,
      });
    }

    setValues((current) => ({ ...current, [key]: value }));
    setErrors((current) => ({ ...current, [key]: undefined }));
    setFormError("");

    if (key === "title" || key === "type" || key === "categoryId") {
      setSuggestedKeys((current) => {
        if (!current.has(key)) {
          return current;
        }
        const next = new Set(current);
        next.delete(key);
        return next;
      });
    }
  }

  const confirmImportReplace = useCallback(() => {
    const hasContent = formValues.content.trim().length > 0;
    const hasTitle = formValues.title.trim().length > 0;
    if (!hasContent && !hasTitle) {
      return true;
    }
    return window.confirm(CAPTURE_IMPORT_REPLACE_CONFIRM);
  }, [formValues.content, formValues.title]);

  const handleImportedPreview = useCallback(
    (preview: IngestUrlPreview) => {
      setValues((current) => ({
        ...current,
        content: preview.content,
        title: preview.title ?? "",
        sourceUrl: preview.originalUrl,
        type:
          !typeTouchedByUserRef.current &&
          current.type === CAPTURE_DEFAULT_TYPE
            ? NoteType.ARTICLE
            : current.type,
      }));
      setErrors({});
      setSuggestedKeys(new Set());
      setFormError("");
      toastSuccess(CAPTURE_IMPORT_SUCCESS);
    },
    [],
  );

  async function handleAnalyze() {
    if (
      analyzing ||
      loading ||
      success ||
      formValues.content.trim().length < CAPTURE_ANALYZE_MIN_LENGTH
    ) {
      return;
    }

    analyzeAbortRef.current?.abort();
    const controller = new AbortController();
    analyzeAbortRef.current = controller;

    setAnalyzing(true);

    try {
      const { data } = await analyzeNoteRequest(formValues.content, {
        signal: controller.signal,
        selectedTagIds: formValues.tagIds,
      });

      if (!data || !data.ok) {
        toastError("MindVault couldn't analyze this right now.");
        return;
      }

      const { suggestion } = data;
      setValues((current) => ({
        ...current,
        title: suggestion.title || current.title,
        type: suggestion.type,
        categoryId: suggestion.categoryId ?? current.categoryId,
      }));
      setAiTagSuggestions(suggestion.tags);
      setDismissedAiTagKeys(new Set());
      setErrors({});
      setSuggestedKeys(() => {
        const next = new Set<"title" | "type" | "categoryId">(["type"]);
        if (suggestion.title) {
          next.add("title");
        }
        if (suggestion.categoryId) {
          next.add("categoryId");
        }
        return next;
      });
    } catch (error) {
      if ((error as { name?: string }).name !== "AbortError") {
        toastError("MindVault couldn't analyze this right now.");
      }
    } finally {
      if (analyzeAbortRef.current === controller) {
        setAnalyzing(false);
        analyzeAbortRef.current = null;
      }
    }
  }

  function dismissAiTagSuggestion(key: string) {
    setDismissedAiTagKeys((current) => new Set(current).add(key));
  }

  function acceptExistingAiTag(id: string) {
    if (formValues.tagIds.length >= MAX_TAGS_PER_NOTE) {
      toastError(`You can add at most ${MAX_TAGS_PER_NOTE} tags to a note.`);
      return;
    }
    if (formValues.tagIds.includes(id)) {
      return;
    }
    updateField("tagIds", [...formValues.tagIds, id]);
  }

  async function acceptNewAiTag(name: string) {
    if (formValues.tagIds.length >= MAX_TAGS_PER_NOTE) {
      toastError(`You can add at most ${MAX_TAGS_PER_NOTE} tags to a note.`);
      return;
    }

    const { response, data } = await createTag(name);

    if (data?.ok) {
      updateField("tagIds", [...formValues.tagIds, data.tag.id]);
      return;
    }

    if (response.status === 409) {
      const { data: listData } = await fetchTags({ sort: "name_asc", filter: "all" });
      if (listData?.ok) {
        const normalized = name.trim().toLowerCase();
        const match = listData.tags.find(
          (tag) => tag.name.trim().toLowerCase() === normalized,
        );
        if (match && !formValues.tagIds.includes(match.id)) {
          updateField("tagIds", [...formValues.tagIds, match.id]);
          return;
        }
      }
    }

    toastError(
      data && !data.ok && data.message ? data.message : TAG_CLIENT_ERROR,
    );
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading || submittingRef.current || success) {
      return;
    }

    const parsed = validateCaptureForm(formValues);
    if (!parsed.success) {
      setErrors(parsed.errors);
      return;
    }

    submittingRef.current = true;
    setLoading(true);
    setFormError("");
    setErrors({});

    try {
      const { response, data } = await createNoteRequest(parsed.data);

      if (!data) {
        setFormError(CAPTURE_SERVER_ERROR);
        return;
      }

      if (response.status === 401) {
        setFormError(CAPTURE_UNAUTHORIZED);
        router.push(routes.signIn);
        return;
      }

      if (!response.ok || !data.ok) {
        if ("errors" in data && data.errors) {
          setErrors(data.errors);
        }

        if ("message" in data && data.message) {
          setFormError(data.message);
          toastError(data.message);
        } else {
          setFormError(CAPTURE_SERVER_ERROR);
          toastError(CAPTURE_SERVER_ERROR);
        }
        return;
      }

      setSuccess(true);
      toastSuccess(CAPTURE_SUCCESS_MESSAGE);
      router.refresh();

      window.setTimeout(() => {
        router.push(vaultRoutes.dashboard);
      }, 900);
    } catch {
      toastError(CAPTURE_SERVER_ERROR);
    } finally {
      submittingRef.current = false;
      setLoading(false);
    }
  }

  const typeMeta = captureMetaForType(formValues.type);
  const formDisabled = loading || success;

  return (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <header className="mb-4 flex shrink-0 flex-col gap-4 sm:mb-5">
        <div className="flex items-start gap-3">
          <button
            type="button"
            onClick={requestClose}
            aria-label="Close capture"
            className={vaultIconButton}
          >
            <ArrowLeft aria-hidden className="size-4" />
          </button>
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="flex size-9 items-center justify-center rounded-[var(--mv-radius-control)] border border-border bg-mv-panel text-foreground">
                  <NoteTypeIcon type={formValues.type} aria-hidden className="size-4" />
                </span>
                <p className="text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-muted-foreground">
                  {typeMeta.eyebrow}
                </p>
              </div>
              <h1 className="mt-2 text-[1.5rem] font-semibold leading-tight tracking-[-0.02em] text-foreground sm:text-[1.75rem]">
                {typeMeta.heading}
              </h1>
              <p className="mt-1.5 max-w-xl text-[0.875rem] leading-relaxed text-muted-foreground">
                {typeMeta.lead}
              </p>
            </div>
            <div className="hidden shrink-0 items-center gap-2 sm:flex">
              <button
                type="button"
                onClick={requestClose}
                disabled={formDisabled}
                className={vaultSecondaryButton}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={formDisabled}
                aria-busy={loading}
                className={cn(vaultPrimaryButton, loading && "opacity-80")}
              >
                {loading ? "Saving…" : "Save to Vault"}
              </button>
            </div>
          </div>
        </div>

        <CaptureTypeSwitcher
          value={formValues.type}
          onChange={(next) => updateField("type", next)}
          disabled={formDisabled || analyzing}
        />
      </header>

      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-hidden pb-[4.75rem] lg:flex-row lg:gap-6 lg:pb-0">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-3">
          {typeMeta.showUrlImport ? (
            <CaptureUrlImport
              disabled={formDisabled || analyzing}
              fallbackErrorMessage={CAPTURE_IMPORT_GENERIC_ERROR}
              onBeforeImport={confirmImportReplace}
              onImported={handleImportedPreview}
              onUnauthorized={() => router.push(routes.signIn)}
            />
          ) : null}

          <div
            className={cn(
              vaultPanelClassName,
              "flex min-h-0 flex-1 flex-col px-4 py-4 shadow-[var(--mv-shadow-card)] sm:px-5 sm:py-5",
              formValues.type === NoteType.CODE && "font-mono",
              formValues.type === NoteType.QUOTE &&
                "border-l-2 border-l-foreground/20",
            )}
          >
            <CaptureTitleField
              id="capture-title"
              value={formValues.title}
              onChange={(event) => updateField("title", event.target.value)}
              placeholder={typeMeta.titlePlaceholder}
              disabled={formDisabled}
              error={errors.title}
              hint={suggestedKeys.has("title") ? CAPTURE_SUGGESTED_LABEL : undefined}
              autoComplete="off"
            />

            <div
              className={cn(
                "my-3 h-px shrink-0 bg-border/80",
                !formValues.title.trim() && "opacity-60",
              )}
              aria-hidden
            />

            <CaptureEditorField
              ref={contentRef}
              id="capture-content"
              label={typeMeta.contentLabel}
              hideLabel
              value={formValues.content}
              onChange={(event) => updateField("content", event.target.value)}
              placeholder={typeMeta.contentPlaceholder}
              disabled={formDisabled}
              error={errors.content}
              className="min-h-[14rem] flex-1 sm:min-h-[18rem]"
            />
          </div>

          {errors.type ? (
            <p className="text-[0.75rem] text-muted-foreground" id="capture-type-error">
              {errors.type}
            </p>
          ) : null}
          {suggestedKeys.has("type") ? (
            <p className="text-[0.75rem] text-mv-faint">{CAPTURE_SUGGESTED_LABEL} (type)</p>
          ) : null}
        </div>

        <div className="w-full shrink-0 overflow-visible lg:w-[17.5rem]">
          <CaptureMetaPanel
            formValues={formValues}
            errors={errors}
            categories={categories}
            categoriesLoading={categoriesLoading}
            categoriesError={categoriesError}
            suggestedKeys={suggestedKeys}
            emphasizeSourceUrl={typeMeta.emphasizeSourceUrl}
            disabled={formDisabled}
            analyzing={analyzing}
            aiEnabled={preferences.aiAssistanceEnabled}
            onAnalyze={handleAnalyze}
            onFieldChange={updateField}
            aiTagSuggestions={aiTagSuggestions}
            dismissedAiTagKeys={dismissedAiTagKeys}
            onDismissAiTag={dismissAiTagSuggestion}
            onAcceptExistingAiTag={acceptExistingAiTag}
            onAcceptNewAiTag={(name) => void acceptNewAiTag(name)}
          />
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 shrink-0 border-t border-border bg-mv-panel/95 px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur-md sm:hidden">
        <div className="mx-auto flex max-w-5xl items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={requestClose}
            disabled={formDisabled}
            className={vaultSecondaryButton}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={formDisabled}
            aria-busy={loading}
            className={cn(vaultPrimaryButton, loading && "opacity-80")}
          >
            {loading ? "Saving…" : "Save to Vault"}
          </button>
        </div>
      </div>
    </form>
  );
  },
);