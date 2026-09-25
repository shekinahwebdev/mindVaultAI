"use client";

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

import {
  CAPTURE_ANALYZE_LABEL,
  CAPTURE_ANALYZE_MIN_LENGTH,
  CAPTURE_ANALYZING_LABEL,
  CAPTURE_DISCARD_CONFIRM,
  CAPTURE_SERVER_ERROR,
  CAPTURE_SUCCESS_MESSAGE,
  CAPTURE_SUGGESTED_LABEL,
  CAPTURE_UNAUTHORIZED,
  captureNoteTypeOptions,
} from "@/lib/notes/capture-config";
import type { CaptureFormValues } from "@/lib/notes/capture-client";
import {
  analyzeNoteRequest,
  captureFormIsDirty,
  createNoteRequest,
  emptyCaptureValues,
  validateCaptureForm,
} from "@/lib/notes/capture-client";
import { routes, vaultRoutes } from "@/lib/routes";
import { CATEGORY_LOAD_ERROR } from "@/lib/categories/category-client";
import { useCategories } from "@/lib/categories/use-categories";
import { usePreferences } from "@/lib/settings/preferences-context";
import { toastError, toastSuccess } from "@/lib/vault-toast";
import { cn } from "@/lib/utils";

import {
  vaultGhostButton,
  vaultPrimaryButton,
  vaultSecondaryButton,
} from "../vault-controls";

import {
  CaptureInputField,
  CaptureSelectField,
  CaptureTextareaField,
} from "./CaptureField";

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
  const analyzeAbortRef = useRef<AbortController | null>(null);
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
      const { data } = await analyzeNoteRequest(formValues.content, controller.signal);

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

  return (
    <form onSubmit={onSubmit} className="flex min-h-0 flex-1 flex-col">
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-hidden pb-[4.75rem] md:pb-0">
        <CaptureTextareaField
          ref={contentRef}
          id="capture-content"
          label="What do you want to remember?"
          labelAddon={
            preferences.aiAssistanceEnabled ? (
              <button
                type="button"
                onClick={handleAnalyze}
                disabled={
                  analyzing ||
                  loading ||
                  success ||
                  formValues.content.trim().length < CAPTURE_ANALYZE_MIN_LENGTH
                }
                aria-busy={analyzing}
                className={cn(
                  vaultGhostButton,
                  "h-8 shrink-0 border border-border px-3 text-[0.8125rem]",
                )}
              >
                {analyzing ? CAPTURE_ANALYZING_LABEL : CAPTURE_ANALYZE_LABEL}
              </button>
            ) : null
          }
          value={formValues.content}
          onChange={(event) => updateField("content", event.target.value)}
          placeholder="Paste an idea, quote, link, code, thought, or anything worth keeping..."
          disabled={loading || success}
          error={errors.content}
          className="flex min-h-0 flex-1 flex-col"
          textareaClassName="min-h-0 flex-1 resize-none"
        />

        <CaptureInputField
          id="capture-title"
          label="Title"
          value={formValues.title}
          onChange={(event) => updateField("title", event.target.value)}
          placeholder="Give this capture a name"
          disabled={loading || success}
          error={errors.title}
          hint={suggestedKeys.has("title") ? CAPTURE_SUGGESTED_LABEL : undefined}
          autoComplete="off"
          className="shrink-0"
        />

        <div className="grid shrink-0 gap-3 sm:grid-cols-2">
          <CaptureSelectField
            id="capture-type"
            label="Type"
            value={formValues.type}
            onChange={(event) => updateField("type", event.target.value)}
            disabled={loading || success}
            error={errors.type}
            hint={suggestedKeys.has("type") ? CAPTURE_SUGGESTED_LABEL : undefined}
            options={captureNoteTypeOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />

          <CaptureSelectField
            id="capture-category"
            label="Category"
            value={formValues.categoryId}
            onChange={(event) => updateField("categoryId", event.target.value)}
            disabled={loading || success || categoriesLoading}
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
              { value: "", label: "None / Uncategorized" },
              ...categories.map((category) => ({
                value: category.id,
                label: category.name,
              })),
            ]}
          />
        </div>

        <CaptureInputField
          id="capture-source-url"
          label="Source URL"
          type="url"
          inputMode="url"
          value={formValues.sourceUrl}
          onChange={(event) => updateField("sourceUrl", event.target.value)}
          placeholder="Optional..."
          disabled={loading || success}
          error={errors.sourceUrl}
          autoComplete="off"
          className="shrink-0"
        />
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 shrink-0 border-t border-border bg-mv-panel/95 px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur-md md:static md:z-auto md:mt-3 md:border-t-0 md:bg-transparent md:px-0 md:py-0 md:pb-0">
        <div className="mx-auto flex max-w-2xl items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={requestClose}
            disabled={loading || success}
            className={vaultSecondaryButton}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || success}
            aria-busy={loading}
            className={cn(vaultPrimaryButton, loading && "opacity-80")}
          >
            {loading ? "Saving..." : "Save to Vault"}
          </button>
        </div>
      </div>
    </form>
  );
  },
);