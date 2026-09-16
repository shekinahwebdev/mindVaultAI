"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowUp, Sparkles } from "lucide-react";
import Link from "next/link";
import { useRef, useState, type KeyboardEvent } from "react";

import type { AgentAction } from "@/lib/agent/agent-client";
import { AGENT_LOAD_ERROR, askAgentRequest } from "@/lib/agent/agent-client";
import type { AgentTraceStep } from "@/lib/agent/types";
import { createNoteRequest } from "@/lib/notes/capture-client";
import { noteDetailPath, noteTypeLabels } from "@/lib/notes/note-display";
import { askVaultRequest, CHAT_LOAD_ERROR, type AskVaultSource } from "@/lib/rag/chat-client";
import { usePreferences } from "@/lib/settings/preferences-context";
import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { vaultEase } from "../vault-motion";

type ChatMode = "ask" | "agent";

const ASK_EXAMPLES = [
  "What have I saved about authentication?",
  "What did I learn about Python errors?",
  "Show me what I know about AWS storage.",
];

const AGENT_EXAMPLES = [
  "Find what I've saved about Python.",
  "What categories do I currently have?",
  "Save this idea: Add voice capture to MindVault.",
];

type ActionState = "pending" | "saving" | "saved" | "cancelled" | "save_error";

type ChatTurn = {
  id: string;
  question: string;
  mode: ChatMode;
  status: "loading" | "done" | "error" | "pending_action";
  answer?: string;
  sources?: AskVaultSource[];
  trace?: AgentTraceStep[];
  action?: AgentAction;
  actionState?: ActionState;
  actionError?: string;
  error?: string;
};

export function ChatView() {
  const { preferences, loading: preferencesLoading } = usePreferences();
  const [mode, setMode] = useState<ChatMode>("ask");
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [input, setInput] = useState("");
  const submittingRef = useRef(false);
  const nextIdRef = useRef(0);

  const isBusy = turns.some((turn) => turn.status === "loading");

  function updateTurn(id: string, patch: Partial<ChatTurn>) {
    setTurns((current) => current.map((turn) => (turn.id === id ? { ...turn, ...patch } : turn)));
  }

  async function submitMessage(message: string) {
    const trimmed = message.trim();
    if (!trimmed || submittingRef.current) {
      return;
    }

    submittingRef.current = true;
    nextIdRef.current += 1;
    const id = `turn-${nextIdRef.current}`;
    const turnMode = mode;
    setTurns((current) => [...current, { id, question: trimmed, mode: turnMode, status: "loading" }]);
    setInput("");

    try {
      if (turnMode === "ask") {
        const { data } = await askVaultRequest(trimmed);
        if (data?.ok) {
          updateTurn(id, { status: "done", answer: data.answer, sources: data.sources });
        } else {
          updateTurn(id, { status: "error", error: data?.message || CHAT_LOAD_ERROR });
        }
      } else {
        const { data } = await askAgentRequest(trimmed);
        if (data?.ok && data.type === "answer") {
          updateTurn(id, { status: "done", answer: data.message, trace: data.trace });
        } else if (data?.ok && data.type === "pending_action") {
          updateTurn(id, {
            status: "pending_action",
            answer: data.message,
            action: data.action,
            actionState: "pending",
            trace: data.trace,
          });
        } else {
          updateTurn(id, { status: "error", error: data?.message || AGENT_LOAD_ERROR });
        }
      }
    } catch (error) {
      if ((error as { name?: string }).name !== "AbortError") {
        updateTurn(id, { status: "error", error: turnMode === "ask" ? CHAT_LOAD_ERROR : AGENT_LOAD_ERROR });
      }
    } finally {
      submittingRef.current = false;
    }
  }

  async function confirmSaveAction(turn: ChatTurn) {
    if (!turn.action) {
      return;
    }
    updateTurn(turn.id, { actionState: "saving" });

    try {
      const { data } = await createNoteRequest({
        title: turn.action.title,
        content: turn.action.content,
        type: turn.action.type,
        sourceUrl: turn.action.sourceUrl,
        categoryId: turn.action.categoryId,
      });

      if (data?.ok) {
        updateTurn(turn.id, { actionState: "saved" });
      } else {
        updateTurn(turn.id, {
          actionState: "save_error",
          actionError: (data && "message" in data && data.message) || "Couldn't save that note. Please try again.",
        });
      }
    } catch {
      updateTurn(turn.id, {
        actionState: "save_error",
        actionError: "Couldn't save that note. Please try again.",
      });
    }
  }

  function cancelAction(turn: ChatTurn) {
    updateTurn(turn.id, { actionState: "cancelled" });
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      submitMessage(input);
    }
  }

  const hasTurns = turns.length > 0;
  const examples = mode === "ask" ? ASK_EXAMPLES : AGENT_EXAMPLES;

  if (!preferencesLoading && !preferences.ragEnabled) {
    return (
      <div className="flex min-h-0 flex-1 flex-col gap-5">
        <div>
          <h1 className="font-editorial text-[1.55rem] text-brand-ink italic sm:text-[1.85rem]">
            Ask your vault
          </h1>
          <p className="mt-2 max-w-xl text-[0.88rem] leading-relaxed text-white/46">
            Ask MindVault is turned off in your settings. Enable it under AI &amp; Search to
            question your saved notes.
          </p>
        </div>
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-5 py-4 text-[0.88rem] text-white/58">
          <a
            href={`${vaultRoutes.settings}/ai`}
            className="text-white/80 underline decoration-white/20 underline-offset-4 transition-colors hover:text-white"
          >
            Open AI &amp; Search settings
          </a>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: vaultEase }}
      className="flex min-h-0 flex-1 flex-col gap-5"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-editorial text-[1.55rem] text-brand-ink italic sm:text-[1.85rem]">
            Ask your vault
          </h1>
          <p className="mt-2 max-w-xl text-[0.88rem] leading-relaxed text-white/46">
            {mode === "ask"
              ? "Ask questions about the knowledge you've saved."
              : "Ask MindVault to look things up or save something new — nothing is saved without your OK."}
          </p>
        </div>

        <div className="inline-flex shrink-0 rounded-full border border-white/12 bg-white/[0.03] p-1">
          <button
            type="button"
            onClick={() => setMode("ask")}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[0.72rem] tracking-[0.1em] uppercase transition-colors",
              mode === "ask" ? "bg-brand-ink text-brand-void" : "text-white/52 hover:text-white/78",
            )}
          >
            Ask
          </button>
          <button
            type="button"
            onClick={() => setMode("agent")}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[0.72rem] tracking-[0.1em] uppercase transition-colors",
              mode === "agent" ? "bg-brand-ink text-brand-void" : "text-white/52 hover:text-white/78",
            )}
          >
            Agent
          </button>
        </div>
      </div>

      {!hasTurns ? (
        <section className="rounded-2xl border border-dashed border-white/[0.1] bg-black/10 px-6 py-12 text-center">
          <Sparkles aria-hidden className="mx-auto size-5 text-white/30" />
          <p className="mt-3 font-editorial text-[1.1rem] text-brand-ink italic">
            Ask your vault.
          </p>
          <p className="mt-2 text-[0.86rem] text-white/42">
            {mode === "ask"
              ? "MindVault answers using only what you've saved — nothing else."
              : "MindVault can search your vault and even save new notes — but only with your approval."}
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-2">
            {examples.map((example) => (
              <button
                key={example}
                type="button"
                onClick={() => submitMessage(example)}
                className="rounded-full border border-white/12 bg-white/[0.03] px-3.5 py-1.5 text-[0.78rem] text-white/62 transition-colors hover:border-white/20 hover:text-white/85"
              >
                {example}
              </button>
            ))}
          </div>
        </section>
      ) : (
        <ul className="flex flex-1 flex-col gap-4 overflow-y-auto">
          <AnimatePresence initial={false}>
            {turns.map((turn) => (
              <motion.li
                key={turn.id}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.22, ease: vaultEase }}
                className="space-y-2.5"
              >
                <p className="ml-auto max-w-[85%] rounded-2xl rounded-tr-sm bg-white/[0.06] px-4 py-2.5 text-[0.88rem] text-white/88">
                  {turn.question}
                </p>

                {turn.status === "loading" ? (
                  <p className="max-w-[85%] rounded-2xl rounded-tl-sm border border-white/[0.08] bg-white/[0.025] px-4 py-2.5 text-[0.86rem] text-white/42">
                    {turn.mode === "agent" ? "Working on it..." : "Reading your vault..."}
                  </p>
                ) : turn.status === "error" ? (
                  <p className="max-w-[85%] rounded-2xl rounded-tl-sm border border-white/[0.08] bg-white/[0.025] px-4 py-2.5 text-[0.86rem] text-white/58">
                    {turn.error}
                  </p>
                ) : (
                  <div className="max-w-[85%] space-y-3 rounded-2xl rounded-tl-sm border border-white/[0.08] bg-white/[0.025] px-4 py-3.5">
                    <p className="text-[0.9rem] leading-relaxed whitespace-pre-wrap text-white/86">
                      {turn.answer}
                    </p>

                    {turn.sources && turn.sources.length > 0 ? (
                      <div className="space-y-1.5 border-t border-white/[0.06] pt-2.5">
                        <p className="text-[0.62rem] tracking-[0.16em] text-white/38 uppercase">
                          Sources
                        </p>
                        <div className="flex flex-wrap gap-1.5">
                          {turn.sources.map((source) => (
                            <Link
                              key={source.noteId}
                              href={noteDetailPath(source.noteId)}
                              className="rounded-lg border border-white/10 bg-white/[0.02] px-2.5 py-1.5 text-[0.78rem] text-white/70 transition-colors hover:border-white/20 hover:text-white/90"
                            >
                              <span className="block text-white/88">{source.title}</span>
                              <span className="text-[0.68rem] text-white/38">
                                {source.categoryName ?? "Uncategorized"} ·{" "}
                                {noteTypeLabels[source.type] ?? source.type}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {turn.status === "pending_action" && turn.action ? (
                      <div className="space-y-2.5 border-t border-white/[0.06] pt-3">
                        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-3">
                          <p className="text-[0.62rem] tracking-[0.14em] text-white/38 uppercase">
                            {noteTypeLabels[turn.action.type] ?? turn.action.type}
                            {turn.action.categoryName ? ` · ${turn.action.categoryName}` : ""}
                          </p>
                          <p className="mt-1 text-[0.88rem] text-white/90">{turn.action.title}</p>
                          <p className="mt-1.5 line-clamp-3 text-[0.8rem] leading-relaxed text-white/48">
                            {turn.action.content}
                          </p>
                        </div>

                        {turn.actionState === "pending" || turn.actionState === "saving" ? (
                          <div className="flex justify-end gap-2">
                            <button
                              type="button"
                              onClick={() => cancelAction(turn)}
                              disabled={turn.actionState === "saving"}
                              className="rounded-full border border-white/12 px-3.5 py-1.5 text-[0.72rem] tracking-[0.1em] text-white/58 uppercase transition-colors hover:border-white/20 hover:text-white/80 disabled:cursor-not-allowed disabled:opacity-50"
                            >
                              Cancel
                            </button>
                            <button
                              type="button"
                              onClick={() => confirmSaveAction(turn)}
                              disabled={turn.actionState === "saving"}
                              className="rounded-full bg-brand-ink px-3.5 py-1.5 text-[0.72rem] tracking-[0.1em] text-brand-void uppercase transition-opacity disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {turn.actionState === "saving" ? "Saving..." : "Save to Vault"}
                            </button>
                          </div>
                        ) : turn.actionState === "saved" ? (
                          <p className="text-right text-[0.78rem] text-white/60">Saved to your vault.</p>
                        ) : turn.actionState === "cancelled" ? (
                          <p className="text-right text-[0.78rem] text-white/38">Not saved.</p>
                        ) : (
                          <p className="text-right text-[0.78rem] text-white/58">{turn.actionError}</p>
                        )}
                      </div>
                    ) : null}

                    {turn.mode === "agent" && turn.trace && turn.trace.length > 0 ? (
                      <details className="border-t border-white/[0.06] pt-2.5">
                        <summary className="cursor-pointer text-[0.62rem] tracking-[0.16em] text-white/32 uppercase select-none hover:text-white/50">
                          Agent activity
                        </summary>
                        <ul className="mt-1.5 space-y-1 text-[0.76rem] text-white/44">
                          {turn.trace.map((step, index) => (
                            <li key={index}>{step.summary}</li>
                          ))}
                        </ul>
                      </details>
                    ) : null}
                  </div>
                )}
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}

      <form
        onSubmit={(event) => {
          event.preventDefault();
          submitMessage(input);
        }}
        className="sticky bottom-0 flex shrink-0 items-end gap-2 rounded-2xl border border-white/[0.08] bg-[#0a0a0c]/95 p-2 backdrop-blur-md"
      >
        <textarea
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            mode === "ask" ? "Ask something about your vault..." : "Ask MindVault to look something up or save an idea..."
          }
          rows={1}
          disabled={isBusy}
          className="max-h-32 min-h-11 flex-1 resize-none bg-transparent px-2.5 py-2 text-[0.88rem] text-brand-ink outline-none placeholder:text-white/28 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={isBusy || !input.trim()}
          aria-label="Send message"
          className="inline-flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-ink text-brand-void transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          <ArrowUp aria-hidden className="size-4" />
        </button>
      </form>
    </motion.div>
  );
}
