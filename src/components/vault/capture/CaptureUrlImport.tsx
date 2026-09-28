"use client";

import { useEffect, useRef, useState } from "react";

import {
  CAPTURE_IMPORT_BUTTON,
  CAPTURE_IMPORT_HELPER,
  CAPTURE_IMPORT_LOADING,
  CAPTURE_IMPORT_SECTION_LABEL,
  CAPTURE_IMPORT_URL_LABEL,
  CAPTURE_IMPORT_URL_PLACEHOLDER,
  CAPTURE_IMPORT_URL_REQUIRED,
  CAPTURE_UNAUTHORIZED,
} from "@/lib/notes/capture-config";
import {
  ingestUrlRequest,
  messageForIngestResponse,
  type IngestUrlPreview,
} from "@/lib/notes/ingest-client";
import { vaultMetaClassName } from "@/lib/vault/vault-typography";
import { cn } from "@/lib/utils";

import { vaultSecondaryButton } from "../vault-controls";

import { CaptureInputField } from "./CaptureField";

type CaptureUrlImportProps = {
  disabled?: boolean;
  fallbackErrorMessage: string;
  onImported: (preview: IngestUrlPreview) => void;
  onBeforeImport?: () => boolean;
  onUnauthorized?: () => void;
};

export function CaptureUrlImport({
  disabled = false,
  fallbackErrorMessage,
  onImported,
  onBeforeImport,
  onUnauthorized,
}: CaptureUrlImportProps) {
  const [importUrl, setImportUrl] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const requestIdRef = useRef(0);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
    };
  }, []);

  async function handleImport() {
    const trimmed = importUrl.trim();
    if (!trimmed || importing || disabled) {
      if (!trimmed) {
        setError(CAPTURE_IMPORT_URL_REQUIRED);
      }
      return;
    }

    if (onBeforeImport && !onBeforeImport()) {
      return;
    }

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const requestId = requestIdRef.current + 1;
    requestIdRef.current = requestId;

    setImporting(true);
    setError("");

    try {
      const { response, data } = await ingestUrlRequest(trimmed, controller.signal);

      if (requestIdRef.current !== requestId) {
        return;
      }

      if (!data?.ok) {
        if (response.status === 401) {
          onUnauthorized?.();
          setError(CAPTURE_UNAUTHORIZED);
          return;
        }
        setError(messageForIngestResponse(response, data, fallbackErrorMessage));
        return;
      }

      onImported(data.preview);
      setImportUrl("");
      setError("");
    } catch (caught) {
      if ((caught as { name?: string }).name === "AbortError") {
        return;
      }
      if (requestIdRef.current === requestId) {
        setError(fallbackErrorMessage);
      }
    } finally {
      if (abortRef.current === controller && requestIdRef.current === requestId) {
        setImporting(false);
        abortRef.current = null;
      }
    }
  }

  return (
    <section
      aria-labelledby="capture-import-heading"
      className="shrink-0 rounded-[12px] border border-border bg-mv-panel/30 px-3 py-3 sm:px-4"
    >
      <h2 id="capture-import-heading" className={vaultMetaClassName}>
        {CAPTURE_IMPORT_SECTION_LABEL}
      </h2>
      <p className="mt-1 text-[0.8125rem] leading-relaxed text-muted-foreground">
        {CAPTURE_IMPORT_HELPER}
      </p>
      <div className="mt-3 flex flex-col gap-2 sm:flex-row sm:items-end">
        <CaptureInputField
          id="capture-import-url"
          label={CAPTURE_IMPORT_URL_LABEL}
          type="url"
          inputMode="url"
          value={importUrl}
          onChange={(event) => {
            setImportUrl(event.target.value);
            setError("");
          }}
          placeholder={CAPTURE_IMPORT_URL_PLACEHOLDER}
          disabled={disabled || importing}
          error={error}
          autoComplete="off"
          className="min-w-0 flex-1"
          onKeyDown={(event) => {
            if (event.key === "Enter") {
              event.preventDefault();
              void handleImport();
            }
          }}
        />
        <button
          type="button"
          onClick={() => void handleImport()}
          disabled={disabled || importing || !importUrl.trim()}
          aria-busy={importing}
          className={cn(
            vaultSecondaryButton,
            "h-10 w-full shrink-0 sm:w-auto sm:min-w-[6.5rem]",
            importing && "opacity-80",
          )}
        >
          {importing ? CAPTURE_IMPORT_LOADING : CAPTURE_IMPORT_BUTTON}
        </button>
      </div>
    </section>
  );
}

