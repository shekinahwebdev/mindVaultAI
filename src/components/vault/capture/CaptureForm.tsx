"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRouter } from "next/navigation";
import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type FormEvent,
} from "react";

import {
  CAPTURE_DISCARD_CONFIRM,
  CAPTURE_SERVER_ERROR,
  CAPTURE_SUCCESS_MESSAGE,
  CAPTURE_UNAUTHORIZED,
  captureNoteTypeOptions,
} from "@/lib/notes/capture-config";
import type { CaptureFormValues } from "@/lib/notes/capture-client";
import {
  captureFormIsDirty,
  createNoteRequest,
  emptyCaptureValues,
  validateCaptureForm,
} from "@/lib/notes/capture-client";
import { routes, vaultRoutes } from "@/lib/routes";
import { CATEGORY_LOAD_ERROR } from "@/lib/categories/category-client";
import { useCategories } from "@/lib/categories/use-categories";
import { cn } from "@/lib/utils";

import { vaultEase } from "../vault-motion";
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
  const contentRef = useRef<HTMLTextAreaElement>(null);
  const submittingRef = useRef(false);
  const [values, setValues] = useState<CaptureFormValues>(emptyCaptureValues);
  const [errors, setErrors] = useState<CaptureFieldErrors>({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const {
    categories,
    loading: categoriesLoading,
    error: categoriesError,
  } = useCategories();

  useEffect(() => {
    contentRef.current?.focus();
  }, []);

  const requestClose = useCallback(() => {
    if (loading || success) {
      return;
    }

    if (!captureFormIsDirty(values)) {
      onRequestClose();
      return;
    }

    if (window.confirm(CAPTURE_DISCARD_CONFIRM)) {
      onRequestClose();
    }
  }, [loading, onRequestClose, success, values]);

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
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (loading || submittingRef.current || success) {
      return;
    }

    const parsed = validateCaptureForm(values);
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
        } else {
          setFormError(CAPTURE_SERVER_ERROR);
        }
        return;
      }

      setSuccess(true);
      router.refresh();

      window.setTimeout(() => {
        router.push(vaultRoutes.dashboard);
      }, 900);
    } catch {
      setFormError(CAPTURE_SERVER_ERROR);
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
          value={values.content}
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
          value={values.title}
          onChange={(event) => updateField("title", event.target.value)}
          placeholder="Give this capture a name"
          disabled={loading || success}
          error={errors.title}
          autoComplete="off"
          className="shrink-0"
        />

        <div className="grid shrink-0 gap-3 sm:grid-cols-2">
          <CaptureSelectField
            id="capture-type"
            label="Type"
            value={values.type}
            onChange={(event) => updateField("type", event.target.value)}
            disabled={loading || success}
            error={errors.type}
            options={captureNoteTypeOptions.map((option) => ({
              value: option.value,
              label: option.label,
            }))}
          />

          <CaptureSelectField
            id="capture-category"
            label="Category"
            value={values.categoryId}
            onChange={(event) => updateField("categoryId", event.target.value)}
            disabled={loading || success || categoriesLoading}
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
          id="capture-source-url"
          label="Source URL"
          type="url"
          inputMode="url"
          value={values.sourceUrl}
          onChange={(event) => updateField("sourceUrl", event.target.value)}
          placeholder="Optional..."
          disabled={loading || success}
          error={errors.sourceUrl}
          autoComplete="off"
          className="shrink-0"
        />

        <AnimatePresence mode="wait">
          {formError ? (
            <motion.p
              key={formError}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.18, ease: vaultEase }}
              className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-[0.82rem] text-white/62"
              role="alert"
            >
              {formError}
            </motion.p>
          ) : null}
        </AnimatePresence>

        <AnimatePresence mode="wait">
          {success ? (
            <motion.p
              key="success"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.22, ease: vaultEase }}
              className="rounded-xl border border-white/14 bg-white/[0.05] px-3.5 py-3 text-[0.86rem] text-brand-ink"
              role="status"
            >
              {CAPTURE_SUCCESS_MESSAGE}
            </motion.p>
          ) : null}
        </AnimatePresence>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-20 shrink-0 border-t border-white/[0.08] bg-[#0a0a0c]/95 px-4 py-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] backdrop-blur-md md:static md:z-auto md:mt-3 md:border-t-0 md:bg-transparent md:px-0 md:py-0 md:pb-0">
        <div className="mx-auto flex max-w-2xl items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={requestClose}
            disabled={loading || success}
            className="inline-flex min-h-11 items-center justify-center rounded-full border border-white/12 px-4 text-[0.74rem] tracking-[0.12em] text-white/58 uppercase transition-colors hover:border-white/20 hover:text-white/78 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || success}
            aria-busy={loading}
            className={cn(
              "inline-flex min-h-11 items-center justify-center rounded-full bg-brand-ink px-5 text-[0.74rem] tracking-[0.14em] text-brand-void uppercase transition-opacity disabled:cursor-not-allowed",
              loading && "opacity-80",
            )}
          >
            {loading ? "Saving..." : "Save to Vault"}
          </button>
        </div>
      </div>
    </form>
  );
  },
);