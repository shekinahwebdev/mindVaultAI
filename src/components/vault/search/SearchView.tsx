"use client";

import { motion } from "framer-motion";
import { Search, Sparkles } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { NoteCard } from "@/components/vault/notes/NoteCard";
import { fetchNotes } from "@/lib/notes/notes-client";
import {
  semanticSearchRequest,
  type SemanticSearchMatch,
} from "@/lib/notes/semantic-search-client";
import type { SerializedNote } from "@/lib/notes/serialize";
import { usePreferences } from "@/lib/settings/preferences-context";
import { toastError } from "@/lib/vault-toast";
import { cn } from "@/lib/utils";

import {
  vaultPageLeadClassName,
  vaultPageTitleClassName,
  vaultPrimaryButton,
} from "../vault-controls";
import { VaultSegmentedControl } from "../VaultSegmentedControl";

import { vaultEase } from "../vault-motion";

type SearchMode = "keyword" | "semantic";

const KEYWORD_DEBOUNCE_MS = 300;

export function SearchView() {
  const searchParams = useSearchParams();
  const { preferences, loading: preferencesLoading } = usePreferences();
  const [modeOverride, setModeOverride] = useState<SearchMode | null>(null);
  const preferredMode: SearchMode =
    preferences.defaultSearchMode === "SEMANTIC" ? "semantic" : "keyword";
  const mode = modeOverride ?? (preferencesLoading ? "keyword" : preferredMode);
  const [input, setInput] = useState("");

  const [keywordResults, setKeywordResults] = useState<SerializedNote[]>([]);
  const [keywordLoading, setKeywordLoading] = useState(false);
  const [keywordError, setKeywordError] = useState("");
  const [keywordSearched, setKeywordSearched] = useState(false);

  const [semanticResults, setSemanticResults] = useState<SemanticSearchMatch[]>([]);
  const [semanticLoading, setSemanticLoading] = useState(false);
  const [semanticError, setSemanticError] = useState("");
  const [semanticSearched, setSemanticSearched] = useState(false);

  const keywordDebounceRef = useRef<number | null>(null);
  const semanticAbortRef = useRef<AbortController | null>(null);

  async function runKeywordSearch(query: string) {
    if (!query.trim()) {
      setKeywordResults([]);
      setKeywordSearched(false);
      setKeywordError("");
      return;
    }

    setKeywordLoading(true);
    setKeywordError("");

    const { data } = await fetchNotes({ q: query, limit: 10 });

    if (data?.ok) {
      setKeywordResults(data.notes);
    } else {
      setKeywordError(data?.message || "Could not search your vault. Please try again.");
      setKeywordResults([]);
    }

    setKeywordSearched(true);
    setKeywordLoading(false);
  }

  async function runSemanticSearch(query: string) {
    if (!query.trim()) {
      return;
    }

    semanticAbortRef.current?.abort();
    const controller = new AbortController();
    semanticAbortRef.current = controller;

    setSemanticLoading(true);
    setSemanticError("");

    try {
      const { data } = await semanticSearchRequest(query, controller.signal);

      if (data?.ok) {
        setSemanticResults(data.matches);
      } else {
        setSemanticError(
          data?.message ||
            "Semantic search isn't available right now. You can still search your vault normally.",
        );
        toastError("Semantic search isn't available right now.");
        setSemanticResults([]);
      }
      setSemanticSearched(true);
    } catch (error) {
      if ((error as { name?: string }).name !== "AbortError") {
        toastError("Semantic search isn't available right now.");
        setSemanticError(
          "Semantic search isn't available right now. You can still search your vault normally.",
        );
        setSemanticResults([]);
        setSemanticSearched(true);
      }
    } finally {
      if (semanticAbortRef.current === controller) {
        setSemanticLoading(false);
        semanticAbortRef.current = null;
      }
    }
  }

  function handleInputChange(value: string) {
    setInput(value);

    if (mode !== "keyword") {
      return;
    }

    if (keywordDebounceRef.current) {
      window.clearTimeout(keywordDebounceRef.current);
    }
    keywordDebounceRef.current = window.setTimeout(() => {
      runKeywordSearch(value);
    }, KEYWORD_DEBOUNCE_MS);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (mode === "semantic") {
      runSemanticSearch(input);
    } else {
      runKeywordSearch(input);
    }
  }

  function handleModeChange(nextMode: SearchMode) {
    setModeOverride(nextMode);
    // Each mode keeps its own result set — switching tabs never fires an
    // API call by itself, especially not a Gemini one for semantic mode.
  }

  useEffect(() => {
    const initialQuery = searchParams.get("q")?.trim();
    if (initialQuery) {
      setInput(initialQuery);
      void runKeywordSearch(initialQuery);
    }
    // Only hydrate from the URL once on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  useEffect(() => {
    return () => {
      if (keywordDebounceRef.current) {
        window.clearTimeout(keywordDebounceRef.current);
      }
      semanticAbortRef.current?.abort();
    };
  }, []);

  const loading = mode === "keyword" ? keywordLoading : semanticLoading;
  const error = mode === "keyword" ? keywordError : semanticError;
  const searched = mode === "keyword" ? keywordSearched : semanticSearched;
  const hasResults =
    mode === "keyword" ? keywordResults.length > 0 : semanticResults.length > 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: vaultEase }}
      className="space-y-5"
    >
      <div>
        <h1 className={vaultPageTitleClassName}>Search</h1>
        <p className={cn(vaultPageLeadClassName, "max-w-xl")}>
          Find what you saved — by the exact words, or by what it means.
        </p>
      </div>

      <section className="rounded-[var(--radius-card)] border border-border bg-surface p-4 sm:p-5 shadow-[0_1px_2px_rgb(0_0_0/0.03)]">
        <div className="mb-3">
          <VaultSegmentedControl
            ariaLabel="Search mode"
            value={mode}
            onChange={handleModeChange}
            options={[
              { value: "keyword", label: "Keyword" },
              { value: "semantic", label: "Semantic" },
            ]}
          />
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-mv-faint"
          />
          <input
            type="search"
            value={input}
            onChange={(event) => handleInputChange(event.target.value)}
            placeholder={
              mode === "keyword"
                ? "Search title or content..."
                : "Describe what you're looking for..."
            }
            className="min-h-11 w-full rounded-[var(--radius-input)] border border-border bg-mv-panel py-2 pr-24 pl-9 text-[0.88rem] text-foreground outline-none placeholder:text-mv-faint focus:border-foreground/25"
          />
          {mode === "semantic" ? (
            <button
              type="submit"
              disabled={semanticLoading || !input.trim()}
              className={cn(
                vaultPrimaryButton,
                "absolute top-1/2 right-1.5 h-8 min-h-8 -translate-y-1/2 px-3 text-[0.78rem]",
              )}
            >
              {semanticLoading ? "Searching..." : "Search"}
            </button>
          ) : null}
        </form>

        {mode === "semantic" ? (
          <p className="mt-2.5 flex items-start gap-1.5 text-[0.76rem] leading-relaxed text-mv-faint">
            <Sparkles aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            Search by meaning — find related notes even when the exact words are different.
          </p>
        ) : null}
      </section>

      {error ? (
        <div className="rounded-xl border border-border bg-mv-panel px-3.5 py-3 text-[0.84rem] text-muted-foreground">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="py-16 text-center text-[0.84rem] text-muted-foreground">
          {mode === "semantic" ? "Searching by meaning..." : "Searching..."}
        </p>
      ) : !searched ? null : !hasResults ? (
        <section className="rounded-2xl border border-border bg-mv-panel px-6 py-14 text-center">
          <p className="text-[1.1rem] font-medium text-foreground">
            Nothing matches this search.
          </p>
          <p className="mt-2 text-[0.86rem] text-muted-foreground">
            {mode === "semantic"
              ? "Try describing it a different way."
              : "Try different words, or switch to Semantic search."}
          </p>
        </section>
      ) : (
        <ul className="grid gap-2.5">
          {mode === "keyword"
            ? keywordResults.map((note) => (
                <li key={note.id}>
                  <NoteCard note={note} />
                </li>
              ))
            : semanticResults.map((match) => (
                <li key={match.note.id}>
                  <NoteCard
                    note={match.note}
                    matchLabel={`${Math.round(Math.max(0, Math.min(1, match.similarity)) * 100)}% match`}
                  />
                </li>
              ))}
        </ul>
      )}
    </motion.div>
  );
}
