"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import {
  CHAT_GROUNDED_HISTORY_LABEL,
  CHAT_NO_RELEVANT_KNOWLEDGE_HINT,
} from "@/lib/chat/chat-outcomes";
import { createNoteRequest } from "@/lib/notes/capture-client";
import { noteDetailPath, noteTypeLabels } from "@/lib/notes/note-display";
import type { AskVaultSource } from "@/lib/rag/chat-client";
import { getNoteTypeIcon } from "@/lib/vault/note-type-ui";
import { toastSuccess } from "@/lib/vault-toast";
import { cn } from "@/lib/utils";

import { vaultPrimaryButton, vaultSecondaryButton } from "../vault-controls";

import type { SessionData } from "@/lib/auth/session";

import { UserAvatar } from "../UserAvatar";

import { ChatMessageActions, ChatMessageEditActions } from "./ChatMessageActions";
import type { ChatTurn } from "./chat-types";

type ChatTurnBubbleProps = {
  turn: ChatTurn;
  session: SessionData;
  onUpdateTurn: (id: string, patch: Partial<ChatTurn>) => void;
  onEditQuestion?: (turnId: string, newQuestion: string) => void;
  editDisabled?: boolean;
};

export function ChatTurnBubble({
  turn,
  session,
  onUpdateTurn,
  onEditQuestion,
  editDisabled,
}: ChatTurnBubbleProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [draftQuestion, setDraftQuestion] = useState(turn.question);

  useEffect(() => {
    if (!isEditing) {
      setDraftQuestion(turn.question);
    }
  }, [isEditing, turn.question]);

  const canEditUserMessage =
    Boolean(onEditQuestion) &&
    !editDisabled &&
    turn.status !== "loading" &&
    !turn.id.startsWith("pending-");

  function startEdit() {
    setDraftQuestion(turn.question);
    setIsEditing(true);
  }

  function cancelEdit() {
    setDraftQuestion(turn.question);
    setIsEditing(false);
  }

  function saveEdit() {
    const next = draftQuestion.trim();
    if (!next || next === turn.question.trim()) {
      cancelEdit();
      return;
    }
    onEditQuestion?.(turn.id, next);
    setIsEditing(false);
  }

  const assistantCopyText =
    turn.status === "error"
      ? (turn.error ?? "")
      : turn.status === "loading"
        ? ""
        : (turn.answer ?? "");
  async function confirmSaveAction() {
    if (!turn.action) return;
    onUpdateTurn(turn.id, { actionState: "saving" });
    try {
      const { data } = await createNoteRequest({
        title: turn.action.title,
        content: turn.action.content,
        type: turn.action.type,
        sourceUrl: turn.action.sourceUrl,
        categoryId: turn.action.categoryId,
        tagIds: [],
      });
      if (data?.ok) {
        onUpdateTurn(turn.id, { actionState: "saved" });
        toastSuccess("Saved to your vault.");
      } else {
        onUpdateTurn(turn.id, {
          actionState: "save_error",
          actionError:
            (data && "message" in data && data.message) ||
            "Couldn't save that note. Please try again.",
        });
      }
    } catch {
      onUpdateTurn(turn.id, {
        actionState: "save_error",
        actionError: "Couldn't save that note. Please try again.",
      });
    }
  }

  return (
    <div className="space-y-4">
      <div className="group flex flex-col items-end gap-1">
        <div className="flex justify-end gap-2.5">
          {isEditing ? (
            <textarea
              value={draftQuestion}
              onChange={(event) => setDraftQuestion(event.target.value)}
              rows={Math.min(8, Math.max(2, draftQuestion.split("\n").length))}
              className="max-w-[min(36rem,85%)] min-h-[2.75rem] resize-y rounded-[1rem] rounded-tr-sm border border-border bg-mv-panel px-4 py-2.5 text-[0.875rem] text-foreground outline-none ring-offset-background focus-visible:ring-2 focus-visible:ring-ring"
            />
          ) : (
            <p className="max-w-[min(36rem,85%)] rounded-[1rem] rounded-tr-sm bg-mv-panel px-4 py-2.5 text-[0.875rem] text-foreground whitespace-pre-wrap">
              {turn.question}
            </p>
          )}
          <UserAvatar session={session} size="sm" className="shrink-0" />
        </div>
        {isEditing ? (
          <ChatMessageEditActions
            onCancel={cancelEdit}
            onSave={saveEdit}
            saveDisabled={!draftQuestion.trim()}
          />
        ) : (
          <ChatMessageActions
            align="end"
            copyText={turn.question}
            showEdit={canEditUserMessage}
            onEdit={startEdit}
            className="pr-9"
          />
        )}
      </div>

      {turn.status === "loading" ? (
        <div className="group max-w-[min(42rem,92%)]">
          <AssistantCard>
            <p className="text-[0.875rem] text-muted-foreground">
              {turn.mode === "agent" ? "Working on it…" : "Reading your vault…"}
            </p>
          </AssistantCard>
        </div>
      ) : turn.status === "error" ? (
        <div className="group max-w-[min(42rem,92%)]">
          <AssistantCard>
            <p className="text-[0.875rem] text-muted-foreground">{turn.error}</p>
          </AssistantCard>
          <ChatMessageActions align="start" copyText={assistantCopyText} />
        </div>
      ) : (
        <div className="group max-w-[min(42rem,92%)]">
        <AssistantCard>
          <p className="text-[0.9rem] leading-relaxed whitespace-pre-wrap text-foreground">
            {turn.answer}
          </p>

          {turn.answerOutcome === "no_relevant_knowledge" ? (
            <p className="text-[0.8125rem] text-muted-foreground">{CHAT_NO_RELEVANT_KNOWLEDGE_HINT}</p>
          ) : null}

          {turn.answerOutcome === "answered_from_grounded_history" ? (
            <p className="text-[0.75rem] text-mv-faint">{CHAT_GROUNDED_HISTORY_LABEL}</p>
          ) : null}

          {turn.sources && turn.sources.length > 0 ? (
            <StructuredSources answer={turn.answer ?? ""} sources={turn.sources} />
          ) : null}

          {turn.status === "pending_action" && turn.action ? (
            <div className="space-y-2.5 border-t border-border pt-4">
              <div className="rounded-xl border border-border bg-mv-panel p-3">
                <p className="text-[0.8125rem] text-mv-faint">
                  {noteTypeLabels[turn.action.type] ?? turn.action.type}
                  {turn.action.categoryName ? ` · ${turn.action.categoryName}` : ""}
                </p>
                <p className="mt-1 text-[0.88rem] font-medium text-foreground">
                  {turn.action.title}
                </p>
                <p className="mt-1.5 line-clamp-4 text-[0.8125rem] leading-relaxed text-muted-foreground">
                  {turn.action.content}
                </p>
              </div>
              {turn.actionState === "pending" || turn.actionState === "saving" ? (
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => onUpdateTurn(turn.id, { actionState: "cancelled" })}
                    disabled={turn.actionState === "saving"}
                    className={vaultSecondaryButton}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={() => void confirmSaveAction()}
                    disabled={turn.actionState === "saving"}
                    className={cn(vaultPrimaryButton, turn.actionState === "saving" && "opacity-80")}
                  >
                    {turn.actionState === "saving" ? "Saving…" : "Save to vault"}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {turn.mode === "agent" && turn.trace && turn.trace.length > 0 ? (
            <details className="border-t border-border pt-3">
              <summary className="cursor-pointer text-[0.75rem] font-medium text-muted-foreground">
                Agent activity
              </summary>
              <ul className="mt-2 space-y-1 text-[0.75rem] text-muted-foreground">
                {turn.trace.map((step, index) => (
                  <li key={index}>{step.summary}</li>
                ))}
              </ul>
            </details>
          ) : null}
        </AssistantCard>
        <ChatMessageActions align="start" copyText={assistantCopyText} />
        </div>
      )}
    </div>
  );
}

function AssistantCard({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-[min(42rem,92%)] space-y-4 rounded-[1rem] rounded-tl-sm border border-border bg-surface px-4 py-4 shadow-[var(--mv-shadow-card)]">
      {children}
    </div>
  );
}

function StructuredSources({
  answer,
  sources,
}: {
  answer: string;
  sources: AskVaultSource[];
}) {
  const bullets = answer
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line.startsWith("-") || line.startsWith("•"))
    .slice(0, 6);

  return (
    <div className="space-y-4 border-t border-border pt-4">
      {bullets.length > 0 ? (
        <section>
          <h3 className="text-[0.8125rem] font-semibold text-foreground">Key topics</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-[0.8125rem] text-muted-foreground">
            {bullets.map((line) => (
              <li key={line}>{line.replace(/^[-•]\s*/, "")}</li>
            ))}
          </ul>
        </section>
      ) : null}

      <section>
        <h3 className="text-[0.8125rem] font-semibold text-foreground">Related content</h3>
        <ul className="mt-2 space-y-2">
          {sources.map((source) => {
            const Icon = getNoteTypeIcon(source.type);
            return (
              <li key={source.noteId}>
                <Link
                  href={noteDetailPath(source.noteId)}
                  className="flex items-start gap-2.5 rounded-[var(--mv-radius-control)] border border-border bg-mv-panel/40 px-3 py-2.5 transition-colors hover:bg-mv-panel/70"
                >
                  <Icon aria-hidden className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
                  <span className="min-w-0">
                    <span className="block text-[0.8125rem] font-medium text-foreground">
                      {source.title}
                    </span>
                    <span className="text-[0.6875rem] text-mv-faint">
                      {noteTypeLabels[source.type] ?? source.type}
                      {source.categoryName ? ` · ${source.categoryName}` : ""}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
