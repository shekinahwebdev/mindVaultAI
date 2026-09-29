"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FolderOpen,
  Plus,
  Search,
  StickyNote,
  type LucideIcon,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { fetchNotes } from "@/lib/notes/notes-client";
import type { SerializedNote } from "@/lib/notes/serialize";
import { noteDetailPath } from "@/lib/notes/note-display";
import { vaultRoutes } from "@/lib/routes";
import { cn } from "@/lib/utils";

import { useVaultCommand } from "./VaultCommandProvider";
import { vaultActionFocus } from "./vault-controls";

type CommandEntry =
  | {
      kind: "note";
      id: string;
      label: string;
      hint?: string;
      href: string;
    }
  | {
      kind: "action";
      id: string;
      label: string;
      hint?: string;
      icon: LucideIcon;
      href: string;
    };

const staticActions: CommandEntry[] = [
  {
    kind: "action",
    id: "capture",
    label: "Create note",
    hint: "Capture",
    icon: Plus,
    href: vaultRoutes.capture,
  },
  {
    kind: "action",
    id: "search",
    label: "Search vault",
    hint: "Search page",
    icon: Search,
    href: vaultRoutes.search,
  },
  {
    kind: "action",
    id: "categories",
    label: "Browse categories",
    icon: FolderOpen,
    href: vaultRoutes.categories,
  },
  {
    kind: "action",
    id: "notes",
    label: "All notes",
    icon: StickyNote,
    href: vaultRoutes.notes,
  },
];

export function VaultCommandPalette() {
  const { open, setOpen } = useVaultCommand();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState("");
  const [recentNotes, setRecentNotes] = useState<SerializedNote[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);

  const closePalette = useCallback(() => {
    setOpen(false);
    setQuery("");
    setActiveIndex(0);
  }, [setOpen]);

  useEffect(() => {
    if (!open) {
      return;
    }

    inputRef.current?.focus();
    let cancelled = false;
    queueMicrotask(() => {
      if (!cancelled) {
        setLoadingRecent(true);
      }
    });
    void fetchNotes({ limit: 8, sort: "updated_desc" }).then(({ data }) => {
      if (data?.ok) {
        setRecentNotes(data.notes);
      }
      setLoadingRecent(false);
    });
    return () => {
      cancelled = true;
    };
  }, [open]);

  const entries = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const noteEntries: CommandEntry[] = recentNotes
      .filter((note) => {
        if (!normalized) {
          return true;
        }
        return (
          note.title.toLowerCase().includes(normalized) ||
          note.content.toLowerCase().includes(normalized)
        );
      })
      .slice(0, 6)
      .map((note) => ({
        kind: "note" as const,
        id: note.id,
        label: note.title,
        hint: "Recent",
        href: noteDetailPath(note.id),
      }));

    const actions = staticActions.filter((action) => {
      if (!normalized) {
        return true;
      }
      return action.label.toLowerCase().includes(normalized);
    });

    return [...noteEntries, ...actions];
  }, [query, recentNotes]);

  const runEntry = useCallback(
    (entry: CommandEntry) => {
      closePalette();
      if (entry.kind === "note") {
        router.push(entry.href);
        return;
      }
      if (entry.id === "search" && query.trim()) {
        router.push(`${vaultRoutes.search}?q=${encodeURIComponent(query.trim())}`);
        return;
      }
      router.push(entry.href);
    },
    [closePalette, query, router],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        closePalette();
        return;
      }

      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActiveIndex((index) => Math.min(index + 1, entries.length - 1));
        return;
      }

      if (event.key === "ArrowUp") {
        event.preventDefault();
        setActiveIndex((index) => Math.max(index - 1, 0));
        return;
      }

      if (event.key === "Enter" && entries[activeIndex]) {
        event.preventDefault();
        runEntry(entries[activeIndex]);
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeIndex, closePalette, entries, open, runEntry]);

  if (!open) {
    return null;
  }

  const recent = entries.filter((entry) => entry.kind === "note");
  const actions = entries.filter((entry) => entry.kind === "action");

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center px-4 pt-[min(18vh,8rem)] sm:px-6">
      <button
        type="button"
        aria-label="Close command palette"
        className="absolute inset-0 bg-mv-overlay backdrop-blur-[2px]"
        onClick={closePalette}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search your MindVault"
        className="relative z-10 w-full max-w-xl overflow-hidden rounded-[16px] border border-border bg-surface shadow-[0_24px_64px_rgb(0_0_0/0.18)]"
      >
        <div className="flex items-center gap-2 border-b border-border px-4 py-3">
          <Search aria-hidden className="size-4 text-muted-foreground" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setActiveIndex(0);
            }}
            placeholder="Search your MindVault…"
            className={cn(
              "min-h-10 flex-1 bg-transparent text-[0.92rem] text-foreground outline-none placeholder:text-mv-faint",
              vaultActionFocus,
            )}
          />
          <kbd className="hidden rounded-md border border-border bg-mv-panel px-1.5 py-0.5 text-[0.65rem] text-mv-faint sm:inline">
            esc
          </kbd>
        </div>

        <div className="max-h-[min(50vh,24rem)] overflow-y-auto px-2 py-2">
          {loadingRecent && recent.length === 0 ? (
            <p className="px-3 py-4 text-[0.82rem] text-muted-foreground">
              Loading recent items…
            </p>
          ) : null}

          {recent.length > 0 ? (
            <section className="px-1 py-1">
              <p className="px-2 py-1 text-[0.75rem] font-medium text-muted-foreground">
                Recent
              </p>
              <ul>
                {recent.map((entry) => {
                  const index = entries.indexOf(entry);
                  return (
                    <li key={entry.id}>
                      <button
                        type="button"
                        onClick={() => runEntry(entry)}
                        className={cn(
                          "flex w-full items-center justify-between gap-3 rounded-[10px] px-3 py-2.5 text-left transition-colors duration-150",
                          index === activeIndex
                            ? "bg-mv-panel text-foreground"
                            : "text-foreground/85 hover:bg-mv-panel/70",
                          vaultActionFocus,
                        )}
                      >
                        <span className="truncate text-[0.86rem]">{entry.label}</span>
                        {entry.hint ? (
                          <span className="shrink-0 text-[0.72rem] text-mv-faint">
                            {entry.hint}
                          </span>
                        ) : null}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {actions.length > 0 ? (
            <section className="px-1 py-1">
              <p className="px-2 py-1 text-[0.75rem] font-medium text-muted-foreground">
                Actions
              </p>
              <ul>
                {actions.map((entry) => {
                  const index = entries.indexOf(entry);
                  const Icon = entry.icon;
                  return (
                    <li key={entry.id}>
                      <button
                        type="button"
                        onClick={() => runEntry(entry)}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-[10px] px-3 py-2.5 text-left transition-colors duration-150",
                          index === activeIndex
                            ? "bg-mv-panel text-foreground"
                            : "text-foreground/85 hover:bg-mv-panel/70",
                          vaultActionFocus,
                        )}
                      >
                        <Icon aria-hidden className="size-4 text-muted-foreground" />
                        <span className="truncate text-[0.86rem]">{entry.label}</span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          ) : null}

          {!loadingRecent && entries.length === 0 ? (
            <p className="px-3 py-6 text-center text-[0.82rem] text-muted-foreground">
              No matches. Try a different query or use an action below.
            </p>
          ) : null}
        </div>

        <div className="border-t border-border px-4 py-2.5 text-[0.72rem] text-mv-faint">
          <Link
            href={vaultRoutes.search}
            className="transition-colors hover:text-foreground"
            onClick={closePalette}
          >
            Open full search →
          </Link>
        </div>
      </div>
    </div>
  );
}
