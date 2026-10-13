"use client";

import { AnimatePresence, motion } from "framer-motion";
import { PanelRightClose, PanelRightOpen, Sparkles } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { useVaultSession } from "@/components/vault/VaultSessionProvider";
import {
  CONVERSATIONS_LOAD_ERROR,
  deleteConversationRequest,
  fetchConversation,
  fetchConversations,
  renameConversationRequest,
  updateConversationAttachmentsRequest,
} from "@/lib/chat/conversations-client";
import {
  listDocumentsRequest,
  uploadPdfDocumentFromFile,
  type SerializedDocument,
} from "@/lib/documents/documents-client";
import { messagesToTurns } from "@/lib/chat/messages-to-turns";
import type { SerializedConversationSummary } from "@/lib/chat/serialize";
import {
  askVaultRequest,
  CHAT_PROVIDER_FAILURE,
  CHAT_SERVER_FAILURE,
} from "@/lib/rag/chat-client";
import { usePreferences } from "@/lib/settings/preferences-context";
import { vaultRoutes } from "@/lib/routes";
import { toastError, toastSuccess } from "@/lib/vault-toast";
import { cn } from "@/lib/utils";

import { vaultEase } from "../vault-motion";

import { mergeAttachmentDocs } from "./chat-attachment-types";
import { ChatComposer } from "./ChatComposer";
import { ChatContextPanel } from "./ChatContextPanel";
import { ChatDocumentPickerDialog } from "./ChatDocumentPickerDialog";
import { ChatHistorySidebar } from "./ChatHistorySidebar";
import { ChatTurnBubble } from "./ChatTurnBubble";
import type { ChatTurn } from "./chat-types";

/** Fixed locale/timezone so SSR and client hydration match. */
function formatHeaderDate(timestamp: number) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZone: "UTC",
  }).format(new Date(timestamp));
}

export function ChatView() {
  const session = useVaultSession();
  const { preferences, loading: preferencesLoading } = usePreferences();
  const [conversationList, setConversationList] = useState<SerializedConversationSummary[]>([]);
  const [listLoading, setListLoading] = useState(true);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeTitle, setActiveTitle] = useState("New conversation");
  const [activeUpdatedAt, setActiveUpdatedAt] = useState<number | null>(null);
  const [turns, setTurns] = useState<ChatTurn[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);
  const [input, setInput] = useState("");
  const [contextPanelOpen, setContextPanelOpen] = useState(true);
  const submittingRef = useRef(false);
  const pendingTurnIdRef = useRef(0);
  const scrollAnchorRef = useRef<HTMLDivElement>(null);
  const uploadInputRef = useRef<HTMLInputElement>(null);
  const [attachedDocumentIds, setAttachedDocumentIds] = useState<string[]>([]);
  const [includeNotesWithAttachments, setIncludeNotesWithAttachments] = useState(false);
  const [documentCatalog, setDocumentCatalog] = useState<SerializedDocument[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerSession, setPickerSession] = useState(0);
  const [documentsLoading, setDocumentsLoading] = useState(false);
  const [uploadInProgress, setUploadInProgress] = useState(false);
  const [uploadProgressLabel, setUploadProgressLabel] = useState<string | undefined>();

  const attachmentDocs = useMemo(
    () => mergeAttachmentDocs(attachedDocumentIds, documentCatalog),
    [attachedDocumentIds, documentCatalog],
  );

  const shouldPollAttachments = useMemo(
    () =>
      attachmentDocs.some((doc) => doc.processingDisplayStatus !== "ready" && doc.processingDisplayStatus !== "failed"),
    [attachmentDocs],
  );

  const refreshDocumentCatalog = useCallback(async () => {
    const { data } = await listDocumentsRequest();
    if (data?.ok) {
      setDocumentCatalog(data.documents);
    }
  }, []);

  const persistAttachments = useCallback(
    async (ids: string[], includeNotes: boolean) => {
      if (!activeId) return;
      await updateConversationAttachmentsRequest(activeId, {
        attachedDocumentIds: ids,
        attachmentIncludeNotes: includeNotes,
      });
    },
    [activeId],
  );

  const applyAttachments = useCallback(
    (ids: string[], includeNotes?: boolean) => {
      setAttachedDocumentIds(ids);
      if (includeNotes !== undefined) {
        setIncludeNotesWithAttachments(includeNotes);
        void persistAttachments(ids, includeNotes);
        return;
      }
      const include = ids.length === 0 ? false : includeNotesWithAttachments;
      if (ids.length === 0) {
        setIncludeNotesWithAttachments(false);
      }
      void persistAttachments(ids, include);
    },
    [includeNotesWithAttachments, persistAttachments],
  );

  const isBusy = turns.some((turn) => turn.status === "loading");

  const lastDoneTurn = useMemo(() => {
    for (let i = turns.length - 1; i >= 0; i -= 1) {
      const turn = turns[i];
      if (turn.status === "done" || turn.status === "pending_action") {
        return turn;
      }
    }
    return null;
  }, [turns]);

  const lastTurn = turns[turns.length - 1];
  const lastTurnStatus = lastTurn?.status;
  const lastTurnAnswer = lastTurn?.answer;

  const refreshConversationList = useCallback(async () => {
    const { data } = await fetchConversations();
    if (data?.ok) {
      setConversationList(data.conversations);
      return;
    }
    toastError(data?.message ?? CONVERSATIONS_LOAD_ERROR);
  }, []);

  useEffect(() => {
    if (preferencesLoading || !preferences.ragEnabled) {
      return;
    }

    let cancelled = false;
    void (async () => {
      setListLoading(true);
      const { data } = await fetchConversations();
      if (cancelled) return;
      if (data?.ok) {
        setConversationList(data.conversations);
      } else {
        toastError(data?.message ?? CONVERSATIONS_LOAD_ERROR);
      }
      setListLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [preferences.ragEnabled, preferencesLoading]);

  useEffect(() => {
    scrollAnchorRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [turns.length, lastTurnStatus, lastTurnAnswer]);

  const loadConversation = useCallback(async (id: string) => {
    setDetailLoading(true);
    const { data } = await fetchConversation(id);
    if (!data?.ok) {
      const message =
        data && !data.ok && data.message ? data.message : CONVERSATIONS_LOAD_ERROR;
      toastError(message);
      setDetailLoading(false);
      return;
    }

    setActiveId(data.conversation.id);
    setActiveTitle(data.conversation.title);
    setActiveUpdatedAt(new Date(data.conversation.updatedAt).getTime());
    setTurns(messagesToTurns(data.conversation.messages));
    setAttachedDocumentIds(data.conversation.attachedDocumentIds ?? []);
    setIncludeNotesWithAttachments(data.conversation.attachmentIncludeNotes ?? false);
    void refreshDocumentCatalog();
    setDetailLoading(false);
  }, [refreshDocumentCatalog]);

  const submitMessage = useCallback(async (message: string) => {
    const trimmed = message.trim();
    if (!trimmed || submittingRef.current) return;

    submittingRef.current = true;
    pendingTurnIdRef.current += 1;
    const pendingTurnId = `pending-${pendingTurnIdRef.current}`;

    setTurns((current) => [
      ...current,
      {
        id: pendingTurnId,
        question: trimmed,
        mode: "ask",
        status: "loading",
        createdAt: Date.now(),
      },
    ]);
    setInput("");

    try {
      const { data } = await askVaultRequest(trimmed, {
        conversationId: activeId ?? undefined,
        attachedDocumentIds,
        attachmentIncludeNotes: includeNotesWithAttachments,
      });

      if (data?.ok) {
        setActiveId(data.conversationId);
        setTurns((current) =>
          current.map((turn) =>
            turn.id === pendingTurnId
              ? {
                  id: data.userMessageId,
                  question: trimmed,
                  mode: "ask",
                  status: "done",
                  createdAt: turn.createdAt,
                  answer: data.answer,
                  answerOutcome: data.outcome,
                  sources: data.sources,
                }
              : turn,
          ),
        );
        await refreshConversationList();
        const { data: detail } = await fetchConversation(data.conversationId);
        if (detail?.ok) {
          setActiveTitle(detail.conversation.title);
          setActiveUpdatedAt(new Date(detail.conversation.updatedAt).getTime());
        }
      } else {
        const err =
          data && !data.ok && data.message
            ? data.message
            : CHAT_PROVIDER_FAILURE;
        if (data?.conversationId) {
          setActiveId(data.conversationId);
        }
        setTurns((current) =>
          current.map((turn) =>
            turn.id === pendingTurnId
              ? {
                  id: data?.userMessageId ?? pendingTurnId,
                  question: trimmed,
                  mode: "ask",
                  status: "error",
                  createdAt: turn.createdAt,
                  error: err,
                }
              : turn,
          ),
        );
        await refreshConversationList();
        toastError(err);
      }
    } catch (error) {
      if ((error as { name?: string }).name !== "AbortError") {
        toastError(CHAT_SERVER_FAILURE);
        setTurns((current) =>
          current.map((turn) =>
            turn.id === pendingTurnId
              ? { ...turn, status: "error", error: CHAT_SERVER_FAILURE }
              : turn,
          ),
        );
      }
    } finally {
      submittingRef.current = false;
    }
  }, [activeId, attachedDocumentIds, includeNotesWithAttachments, refreshConversationList]);

  useEffect(() => {
    if (!shouldPollAttachments) return;
    const interval = window.setInterval(() => {
      void refreshDocumentCatalog();
    }, 5_000);
    return () => window.clearInterval(interval);
  }, [refreshDocumentCatalog, shouldPollAttachments]);

  async function openVaultPicker() {
    setPickerSession((value) => value + 1);
    setDocumentsLoading(true);
    setPickerOpen(true);
    await refreshDocumentCatalog();
    setDocumentsLoading(false);
  }

  async function handleUploadPdf(file: File) {
    setUploadInProgress(true);
    setUploadProgressLabel("Uploading PDF…");
    const result = await uploadPdfDocumentFromFile(file, {
      onProgress: (ratio) => {
        setUploadProgressLabel(`Uploading PDF… ${Math.round(ratio * 100)}%`);
      },
    });
    setUploadInProgress(false);
    setUploadProgressLabel(undefined);
    if (!result.ok) {
      toastError(result.message);
      return;
    }
    await refreshDocumentCatalog();
    const nextIds = attachedDocumentIds.includes(result.document.id)
      ? attachedDocumentIds
      : [...attachedDocumentIds, result.document.id];
    applyAttachments(nextIds);
    toastSuccess("PDF uploaded. It will appear in Documents while indexing runs.");
  }

  const handleUpdateTurn = useCallback((id: string, patch: Partial<ChatTurn>) => {
    setTurns((current) =>
      current.map((turn) => (turn.id === id ? { ...turn, ...patch } : turn)),
    );
  }, []);

  const handleEditQuestion = useCallback(
    (turnId: string, newQuestion: string) => {
      if (submittingRef.current) {
        return;
      }
      setTurns((current) => {
        const index = current.findIndex((turn) => turn.id === turnId);
        if (index === -1) {
          return current;
        }
        return current.slice(0, index);
      });
      void submitMessage(newQuestion);
    },
    [submitMessage],
  );

  function handleNewChat() {
    setActiveId(null);
    setActiveTitle("New conversation");
    setActiveUpdatedAt(null);
    setTurns([]);
    setInput("");
    setAttachedDocumentIds([]);
    setIncludeNotesWithAttachments(false);
  }

  function handleSelectHistory(id: string) {
    void loadConversation(id);
    setInput("");
  }

  async function handleDeleteConversation(id: string) {
    const confirmed = window.confirm(
      "Delete this conversation?\n\nThis removes the chat history only. It does not delete any notes from your vault.",
    );
    if (!confirmed) return;

    const { data } = await deleteConversationRequest(id);
    if (!data?.ok) {
      toastError(data?.message ?? "Could not delete this conversation.");
      return;
    }

    toastSuccess("Conversation deleted.");
    setConversationList((current) => current.filter((item) => item.id !== id));
    if (activeId === id) {
      handleNewChat();
    }
  }

  async function handleRenameConversation(id: string, currentTitle: string) {
    const nextTitle = window.prompt("Rename conversation", currentTitle)?.trim();
    if (!nextTitle || nextTitle === currentTitle) {
      return;
    }

    const { data } = await renameConversationRequest(id, nextTitle);
    if (!data?.ok) {
      toastError(
        data?.errors?.title ?? data?.message ?? "Could not rename this conversation.",
      );
      return;
    }

    toastSuccess("Conversation renamed.");
    setConversationList((current) =>
      current.map((item) =>
        item.id === id ? { ...item, title: data.conversation.title } : item,
      ),
    );
    if (activeId === id) {
      setActiveTitle(data.conversation.title);
    }
  }

  if (!preferencesLoading && !preferences.ragEnabled) {
    return (
      <div className="mx-auto flex max-w-lg flex-col gap-4 py-8">
        <h1 className="text-[1.5rem] font-semibold text-foreground">AI Chat</h1>
        <p className="text-[0.875rem] text-muted-foreground">
          Ask MindVault is turned off. Enable it under AI &amp; Search to chat with your vault.
        </p>
        <Link
          href={`${vaultRoutes.settings}/ai`}
          className="text-[0.875rem] font-medium text-foreground underline-offset-4 hover:underline"
        >
          Open AI &amp; Search settings
        </Link>
      </div>
    );
  }

  const contextToggleLabel = contextPanelOpen
    ? "Hide context panel"
    : "Show context panel";

  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.28, ease: vaultEase }}
      className="-mx-[var(--mv-page-padding-x)] flex h-full min-h-0 flex-1 flex-col overflow-hidden border-y border-border bg-surface md:mx-0 md:rounded-[var(--mv-radius-card)] md:border"
    >
      <div className="flex min-h-0 flex-1 overflow-hidden">
        <div className="hidden lg:flex">
          <ChatHistorySidebar
            activeId={activeId}
            conversations={conversationList}
            loading={listLoading}
            onNewChat={handleNewChat}
            onSelect={handleSelectHistory}
            onDelete={(id) => void handleDeleteConversation(id)}
            onRename={(id, title) => void handleRenameConversation(id, title)}
          />
        </div>

        <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
          <header className="flex shrink-0 items-start justify-between gap-3 border-b border-border px-4 py-3 sm:px-5">
            <div className="min-w-0">
              <h2 className="line-clamp-1 text-[0.9375rem] font-semibold text-foreground sm:text-[1rem]">
                {activeTitle}
              </h2>
              <p className="mt-0.5 text-[0.75rem] text-muted-foreground">
                {lastDoneTurn?.sources?.length
                  ? `${lastDoneTurn.sources.length} sources`
                  : null}
                {lastDoneTurn?.sources?.length && activeUpdatedAt ? " · " : null}
                {activeUpdatedAt
                  ? formatHeaderDate(activeUpdatedAt)
                  : "Ready when you are"}
              </p>
            </div>
            <div className="hidden shrink-0 xl:flex">
              <button
                type="button"
                aria-label={contextToggleLabel}
                aria-pressed={contextPanelOpen}
                title={contextToggleLabel}
                onClick={() => setContextPanelOpen((open) => !open)}
                className={cn(
                  "flex size-8 items-center justify-center rounded-[var(--mv-radius-control)] text-muted-foreground transition-colors hover:bg-mv-panel hover:text-foreground",
                )}
              >
                {contextPanelOpen ? (
                  <PanelRightClose aria-hidden className="size-4" />
                ) : (
                  <PanelRightOpen aria-hidden className="size-4" />
                )}
              </button>
            </div>
          </header>

          <div className="mv-scrollbar mv-scrollbar-chat min-h-0 flex-1 overflow-y-auto overscroll-y-contain px-4 py-4 sm:px-5">
            {detailLoading ? (
              <p className="py-8 text-center text-[0.8125rem] text-muted-foreground">
                Loading conversation…
              </p>
            ) : turns.length === 0 ? (
              <div className="flex h-full min-h-[16rem] flex-col items-center justify-center text-center">
                <Sparkles aria-hidden className="size-6 text-mv-faint" />
                <p className="mt-3 text-[1rem] font-medium text-foreground">Ask your vault</p>
                <p className="mt-1 max-w-sm text-[0.8125rem] text-muted-foreground">
                  Ask questions, compare ideas, or summarize what you&apos;ve saved. Citations
                  appear in the Sources panel when available.
                </p>
              </div>
            ) : (
              <ul className="mx-auto flex max-w-3xl flex-col gap-6">
                <AnimatePresence initial={false}>
                  {turns.map((turn) => (
                    <motion.li
                      key={turn.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.22, ease: vaultEase }}
                    >
                      <ChatTurnBubble
                        turn={turn}
                        session={session}
                        onUpdateTurn={handleUpdateTurn}
                        onEditQuestion={handleEditQuestion}
                        editDisabled={isBusy}
                      />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </ul>
            )}
            <div ref={scrollAnchorRef} className="h-px shrink-0" aria-hidden />
          </div>

          <input
            ref={uploadInputRef}
            type="file"
            accept="application/pdf,.pdf"
            className="sr-only"
            onChange={(event) => {
              const file = event.target.files?.[0];
              event.target.value = "";
              if (file) void handleUploadPdf(file);
            }}
          />

          <ChatComposer
            input={input}
            busy={isBusy}
            attachments={attachmentDocs}
            includeNotesWithAttachments={includeNotesWithAttachments}
            onIncludeNotesWithAttachmentsChange={(value) => {
              setIncludeNotesWithAttachments(value);
              void persistAttachments(attachedDocumentIds, value);
            }}
            onRemoveAttachment={(id) => {
              applyAttachments(attachedDocumentIds.filter((item) => item !== id));
            }}
            onChooseFromVault={() => void openVaultPicker()}
            onUploadPdfClick={() => uploadInputRef.current?.click()}
            uploadInProgress={uploadInProgress}
            uploadProgressLabel={uploadProgressLabel}
            onInputChange={setInput}
            onSubmit={() => void submitMessage(input)}
          />

          <ChatDocumentPickerDialog
            key={pickerSession}
            open={pickerOpen}
            documents={documentCatalog}
            loading={documentsLoading}
            selectedIds={attachedDocumentIds}
            onClose={() => setPickerOpen(false)}
            onConfirm={(ids) => {
              applyAttachments(ids);
              setPickerOpen(false);
            }}
          />
        </section>

        <ChatContextPanel activeTurn={lastDoneTurn} open={contextPanelOpen} />
      </div>
    </motion.div>
  );
}
