"use client";

import { ArrowUp, ChevronDown, FileText, FolderOpen, Paperclip } from "lucide-react";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { createPortal } from "react-dom";

import { cn } from "@/lib/utils";

import { vaultIconShape } from "../vault-controls";

import { ChatAttachmentBar } from "./ChatAttachmentBar";
import type { ChatAttachmentDoc } from "./chat-attachment-types";

const ATTACH_MENU_GAP_PX = 6;
const ATTACH_MENU_MIN_WIDTH_PX = 192;

type AttachMenuPlacement = {
  left: number;
  top: number;
  openUp: boolean;
};

function computeAttachMenuPlacement(button: HTMLButtonElement): AttachMenuPlacement {
  const rect = button.getBoundingClientRect();
  const estimatedMenuHeight = 88;
  const spaceAbove = rect.top;
  const spaceBelow = window.innerHeight - rect.bottom;
  const openUp = spaceAbove >= estimatedMenuHeight + ATTACH_MENU_GAP_PX || spaceAbove >= spaceBelow;
  const maxLeft = Math.max(ATTACH_MENU_GAP_PX, window.innerWidth - ATTACH_MENU_MIN_WIDTH_PX - ATTACH_MENU_GAP_PX);
  const left = Math.min(rect.left, maxLeft);

  return {
    left,
    top: openUp ? rect.top - ATTACH_MENU_GAP_PX : rect.bottom + ATTACH_MENU_GAP_PX,
    openUp,
  };
}

type ChatComposerProps = {
  input: string;
  busy: boolean;
  attachments: ChatAttachmentDoc[];
  includeNotesWithAttachments: boolean;
  onIncludeNotesWithAttachmentsChange: (value: boolean) => void;
  onRemoveAttachment: (documentId: string) => void;
  onChooseFromVault: () => void;
  onUploadPdfClick: () => void;
  uploadInProgress?: boolean;
  uploadProgressLabel?: string;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
};

export function ChatComposer({
  input,
  busy,
  attachments,
  includeNotesWithAttachments,
  onIncludeNotesWithAttachmentsChange,
  onRemoveAttachment,
  onChooseFromVault,
  onUploadPdfClick,
  uploadInProgress,
  uploadProgressLabel,
  onInputChange,
  onSubmit,
}: ChatComposerProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const attachButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);

  const applyMenuPlacement = useCallback(() => {
    const button = attachButtonRef.current;
    const panel = menuPanelRef.current;
    if (!button || !panel) return;
    const placement = computeAttachMenuPlacement(button);
    panel.style.left = `${placement.left}px`;
    panel.style.top = `${placement.top}px`;
    panel.style.transform = placement.openUp ? "translateY(-100%)" : "none";
  }, []);

  useLayoutEffect(() => {
    if (!menuOpen) return;
    applyMenuPlacement();
    window.addEventListener("resize", applyMenuPlacement);
    window.addEventListener("scroll", applyMenuPlacement, true);
    return () => {
      window.removeEventListener("resize", applyMenuPlacement);
      window.removeEventListener("scroll", applyMenuPlacement, true);
    };
  }, [menuOpen, applyMenuPlacement]);

  useEffect(() => {
    if (!menuOpen) return;
    function handlePointerDown(event: MouseEvent) {
      const target = event.target as Node;
      if (menuPanelRef.current?.contains(target) || attachButtonRef.current?.contains(target)) {
        return;
      }
      setMenuOpen(false);
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setMenuOpen(false);
      }
    }
    window.addEventListener("mousedown", handlePointerDown);
    window.addEventListener("keydown", handleEscape);
    return () => {
      window.removeEventListener("mousedown", handlePointerDown);
      window.removeEventListener("keydown", handleEscape);
    };
  }, [menuOpen]);

  function handleKeyDown(event: ReactKeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      onSubmit();
    }
  }

  return (
    <div className="shrink-0 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur-sm">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          onSubmit();
        }}
        className="rounded-[var(--mv-radius-card)] border border-border bg-mv-panel p-2"
      >
        <ChatAttachmentBar
          attachments={attachments}
          includeNotes={includeNotesWithAttachments}
          onIncludeNotesChange={onIncludeNotesWithAttachmentsChange}
          onRemove={onRemoveAttachment}
          uploadInProgress={uploadInProgress}
          uploadLabel={uploadProgressLabel}
        />
        <textarea
          value={input}
          onChange={(event) => onInputChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything about your saved content..."
          rows={2}
          disabled={busy}
          className="max-h-32 min-h-[3.25rem] w-full resize-none bg-transparent px-2 py-1.5 text-[0.875rem] text-foreground outline-none placeholder:text-mv-faint disabled:opacity-60"
        />
        <div className="mt-1 flex items-center justify-between gap-2 px-1">
          <div className="relative shrink-0">
            <button
              ref={attachButtonRef}
              type="button"
              disabled={busy}
              onClick={() => setMenuOpen((open) => !open)}
              aria-label="Attach document"
              aria-expanded={menuOpen}
              aria-haspopup="menu"
              className="flex size-9 items-center justify-center rounded-[var(--mv-radius-control)] text-muted-foreground transition-colors hover:bg-surface hover:text-foreground disabled:opacity-50"
            >
              <Paperclip aria-hidden className="size-4" />
            </button>
          </div>

          <div className="relative min-w-[11rem] flex-1 sm:max-w-[14rem]">
            <label htmlFor="chat-mode" className="sr-only">
              Chat mode
            </label>
            <select
              id="chat-mode"
              value="ask"
              onChange={() => {}}
              aria-describedby="chat-mode-agent-hint"
              title="MindVault AI — answers from your notes and PDFs"
              className="h-9 w-full cursor-default appearance-none rounded-[var(--mv-radius-control)] border border-border bg-surface pl-3 pr-8 text-[0.8125rem] font-medium text-foreground outline-none"
            >
              <option value="ask">MindVault AI</option>
              <option
                value="agent"
                disabled
                title="Agent mode can perform multi-step actions across your vault. Coming soon."
              >
                MindVault Agent (Coming soon)
              </option>
            </select>
            <ChevronDown
              aria-hidden
              className="pointer-events-none absolute top-1/2 right-2 size-4 -translate-y-1/2 text-mv-faint"
            />
            <span id="chat-mode-agent-hint" className="sr-only">
              MindVault Agent can perform multi-step actions across your vault. Coming soon.
            </span>
          </div>

          <button
            type="submit"
            disabled={busy || !input.trim()}
            aria-label="Send message"
            aria-busy={busy}
            className={cn(
              "inline-flex size-10 shrink-0 items-center justify-center bg-primary text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40",
              vaultIconShape,
            )}
          >
            <ArrowUp aria-hidden className="size-4" />
          </button>
        </div>
      </form>
      <p className="mt-2 text-center text-[0.6875rem] text-mv-faint">
        MindVault AI answers from your saved notes and attached PDFs when indexed.
      </p>
      {menuOpen
        ? createPortal(
            <div
              ref={menuPanelRef}
              role="menu"
              aria-label="Attach PDF"
              style={{
                position: "fixed",
                minWidth: ATTACH_MENU_MIN_WIDTH_PX,
              }}
              className="z-[100] rounded-[var(--mv-radius-control)] border border-border bg-surface py-1 shadow-md"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onChooseFromVault();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem] text-foreground hover:bg-mv-panel"
              >
                <FolderOpen aria-hidden className="size-4 shrink-0 text-mv-faint" />
                Choose from Vault
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setMenuOpen(false);
                  onUploadPdfClick();
                }}
                className="flex w-full items-center gap-2 px-3 py-2 text-left text-[0.8125rem] text-foreground hover:bg-mv-panel"
              >
                <FileText aria-hidden className="size-4 shrink-0 text-mv-faint" />
                Upload New PDF
              </button>
            </div>,
            document.body,
          )
        : null}
    </div>
  );
}
