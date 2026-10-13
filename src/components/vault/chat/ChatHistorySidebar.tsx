"use client";

import { MessageSquare, MoreHorizontal, Plus, Search, Sparkles } from "lucide-react";
import { useEffect, useMemo, useRef, useState, type RefObject } from "react";

import {
  CONVERSATION_GROUP_LABELS,
  groupConversationsByDate,
  type ConversationDateGroup,
} from "@/lib/chat/conversation-groups";
import type { SerializedConversationSummary } from "@/lib/chat/serialize";
import { cn } from "@/lib/utils";

import { vaultPrimaryButton } from "../vault-controls";

type ChatHistorySidebarProps = {
  activeId: string | null;
  conversations: SerializedConversationSummary[];
  loading?: boolean;
  onNewChat: () => void;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onRename: (id: string, currentTitle: string) => void;
};

export function ChatHistorySidebar({
  activeId,
  conversations,
  loading,
  onNewChat,
  onSelect,
  onDelete,
  onRename,
}: ChatHistorySidebarProps) {
  const [query, setQuery] = useState("");
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenuId) return;

    function onPointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    }

    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [openMenuId]);

  const filteredConversations = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter((item) => item.title.toLowerCase().includes(q));
  }, [conversations, query]);

  const grouped = useMemo(
    () => groupConversationsByDate(filteredConversations),
    [filteredConversations],
  );

  const groupOrder: ConversationDateGroup[] = ["today", "yesterday", "earlier"];

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-border lg:w-[17.5rem] lg:shrink-0 lg:border-r">
      <div className="border-b border-border px-4 py-4">
        <div className="flex items-center gap-2">
          <Sparkles aria-hidden className="size-5 text-foreground" />
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h1 className="text-[1rem] font-semibold tracking-[-0.02em] text-foreground">
                AI Chat
              </h1>
              <span className="rounded-full border border-border bg-mv-panel px-2 py-0.5 text-[0.625rem] font-semibold uppercase tracking-wide text-muted-foreground">
                Beta
              </span>
            </div>
            <p className="mt-0.5 text-[0.75rem] text-muted-foreground">
              Ask questions about your saved knowledge.
            </p>
          </div>
        </div>
        <button type="button" onClick={onNewChat} className={cn(vaultPrimaryButton, "mt-4 w-full")}>
          <Plus aria-hidden className="size-4" />
          New Chat
        </button>
        <label className="relative mt-3 block">
          <span className="sr-only">Search conversations</span>
          <Search
            aria-hidden
            className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-mv-faint"
          />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search conversations..."
            className="h-9 w-full rounded-[var(--mv-radius-control)] border border-border bg-mv-panel py-2 pr-3 pl-9 text-[0.8125rem] outline-none placeholder:text-mv-faint focus:border-foreground/25"
          />
        </label>
      </div>

      <div className="mv-scrollbar mv-scrollbar-chat min-h-0 flex-1 overflow-y-auto px-2 py-3">
        {loading ? (
          <p className="px-3 py-6 text-center text-[0.8125rem] text-muted-foreground">
            Loading conversations…
          </p>
        ) : filteredConversations.length === 0 ? (
          <p className="px-3 py-6 text-center text-[0.8125rem] text-muted-foreground">
            {query.trim() ? "No matching conversations." : "No conversations yet."}
          </p>
        ) : (
          groupOrder.map((groupKey) => {
            const items = grouped[groupKey];
            if (items.length === 0) return null;
            return (
              <section key={groupKey} className="mb-4">
                <h2 className="px-2 pb-1 text-[0.6875rem] font-semibold tracking-[0.06em] text-mv-faint uppercase">
                  {CONVERSATION_GROUP_LABELS[groupKey]}
                </h2>
                <ul className="space-y-0.5">
                  {items.map((item) => (
                    <HistoryRow
                      key={item.id}
                      title={item.title}
                      subtitle={formatRelative(item.updatedAt)}
                      active={activeId === item.id}
                      menuOpen={openMenuId === item.id}
                      onOpenMenu={() =>
                        setOpenMenuId((current) => (current === item.id ? null : item.id))
                      }
                      onSelect={() => {
                        setOpenMenuId(null);
                        onSelect(item.id);
                      }}
                      onRename={() => {
                        setOpenMenuId(null);
                        onRename(item.id, item.title);
                      }}
                      onDelete={() => {
                        setOpenMenuId(null);
                        onDelete(item.id);
                      }}
                      menuRef={openMenuId === item.id ? menuRef : undefined}
                    />
                  ))}
                </ul>
              </section>
            );
          })
        )}
      </div>
    </aside>
  );
}

function HistoryRow({
  title,
  subtitle,
  active,
  menuOpen,
  onSelect,
  onOpenMenu,
  onRename,
  onDelete,
  menuRef,
}: {
  title: string;
  subtitle: string;
  active: boolean;
  menuOpen: boolean;
  onSelect: () => void;
  onOpenMenu: () => void;
  onRename: () => void;
  onDelete: () => void;
  menuRef?: RefObject<HTMLDivElement | null>;
}) {
  return (
    <li className="relative">
      <div
        className={cn(
          "flex w-full items-start gap-1 rounded-[var(--mv-radius-control)] pr-1 transition-colors",
          active ? "bg-mv-panel" : "hover:bg-mv-panel/70",
        )}
      >
        <button
          type="button"
          onClick={onSelect}
          className={cn(
            "flex min-w-0 flex-1 items-start gap-2 px-2 py-2 text-left",
            active ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          <MessageSquare aria-hidden className="mt-0.5 size-4 shrink-0 opacity-70" />
          <span className="min-w-0 flex-1">
            <span className="line-clamp-2 text-[0.8125rem] font-medium text-foreground">{title}</span>
            <span className="mt-0.5 block text-[0.6875rem] text-mv-faint">{subtitle}</span>
          </span>
        </button>
        <div className="relative shrink-0 py-1.5" ref={menuRef}>
          <button
            type="button"
            aria-label="Conversation options"
            aria-expanded={menuOpen}
            onClick={(event) => {
              event.stopPropagation();
              onOpenMenu();
            }}
            className={cn(
              "flex size-7 items-center justify-center rounded-md text-mv-faint hover:bg-surface hover:text-foreground",
              menuOpen && "bg-surface text-foreground",
            )}
          >
            <MoreHorizontal aria-hidden className="size-4" />
          </button>
          {menuOpen ? (
            <div
              role="menu"
              className="absolute top-full right-0 z-20 mt-1 min-w-[9rem] overflow-hidden rounded-[var(--mv-radius-control)] border border-border bg-surface py-1 shadow-[var(--mv-shadow-card)]"
            >
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-2 text-left text-[0.8125rem] text-foreground hover:bg-mv-panel"
                onClick={onRename}
              >
                Rename
              </button>
              <button
                type="button"
                role="menuitem"
                className="block w-full px-3 py-2 text-left text-[0.8125rem] text-red-600 hover:bg-mv-panel dark:text-red-400"
                onClick={onDelete}
              >
                Delete
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function formatRelative(updatedAtIso: string) {
  const timestamp = new Date(updatedAtIso).getTime();
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return new Date(timestamp).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}
