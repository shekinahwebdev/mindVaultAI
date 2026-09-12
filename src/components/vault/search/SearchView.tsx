"use client";

import { motion } from "framer-motion";
import { Search, Sparkles } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { NoteCard } from "@/components/vault/notes/NoteCard";
import { fetchNotes } from "@/lib/notes/notes-client";
import {
  semanticSearchRequest,
  type SemanticSearchMatch,
} from "@/lib/notes/semantic-search-client";
import type { SerializedNote } from "@/lib/notes/serialize";
import { cn } from "@/lib/utils";

import { vaultEase } from "../vault-motion";

type SearchMode = "keyword" | "semantic";

const KEYWORD_DEBOUNCE_MS = 300;

export function SearchView() {
  const [mode, setMode] = useState<SearchMode>("keyword");
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
        setSemanticResults([]);
      }
      setSemanticSearched(true);
    } catch (error) {
      if ((error as { name?: string }).name !== "AbortError") {
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
    setMode(nextMode);
    // Each mode keeps its own result set — switching tabs never fires an
    // API call by itself, especially not a Gemini one for semantic mode.
  }

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
        <h1 className="font-editorial text-[1.55rem] text-brand-ink italic sm:text-[1.85rem]">
          Search
        </h1>
        <p className="mt-2 max-w-xl text-[0.88rem] leading-relaxed text-white/46">
          Find what you saved — by the exact words, or by what it means.
        </p>
      </div>

      <section className="rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4 shadow-[0_12px_32px_rgba(0,0,0,0.18)] sm:p-5">
        <div className="mb-3 inline-flex rounded-full border border-white/12 bg-white/[0.03] p-1">
          <button
            type="button"
            onClick={() => handleModeChange("keyword")}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[0.72rem] tracking-[0.1em] uppercase transition-colors",
              mode === "keyword"
                ? "bg-brand-ink text-brand-void"
                : "text-white/52 hover:text-white/78",
            )}
          >
            Keyword
          </button>
          <button
            type="button"
            onClick={() => handleModeChange("semantic")}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[0.72rem] tracking-[0.1em] uppercase transition-colors",
              mode === "semantic"
                ? "bg-brand-ink text-brand-void"
                : "text-white/52 hover:text-white/78",
            )}
          >
            Semantic
          </button>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-white/30"
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
            className="min-h-11 w-full rounded-xl border border-white/12 bg-white/[0.035] py-2 pr-24 pl-9 text-[0.88rem] text-brand-ink outline-none placeholder:text-white/28 focus:border-white/28"
          />
          {mode === "semantic" ? (
            <button
              type="submit"
              disabled={semanticLoading || !input.trim()}
              className="absolute top-1/2 right-1.5 -translate-y-1/2 rounded-full bg-brand-ink px-3.5 py-1.5 text-[0.68rem] tracking-[0.1em] text-brand-void uppercase transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
            >
              {semanticLoading ? "Searching..." : "Search"}
            </button>
          ) : null}
        </form>

        {mode === "semantic" ? (
          <p className="mt-2.5 flex items-start gap-1.5 text-[0.76rem] leading-relaxed text-white/40">
            <Sparkles aria-hidden className="mt-0.5 size-3.5 shrink-0" />
            Search by meaning — find related notes even when the exact words are different.
          </p>
        ) : null}
      </section>

      {error ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-3 text-[0.84rem] text-white/58">
          {error}
        </div>
      ) : null}

      {loading ? (
        <p className="py-16 text-center text-[0.84rem] text-white/42">
          {mode === "semantic" ? "Searching by meaning..." : "Searching..."}
        </p>
      ) : !searched ? null : !hasResults ? (
        <section className="rounded-2xl border border-white/[0.08] bg-white/[0.02] px-6 py-14 text-center">
          <p className="font-editorial text-[1.1rem] text-brand-ink italic">
            Nothing matches this search.
          </p>
          <p className="mt-2 text-[0.86rem] text-white/42">
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
