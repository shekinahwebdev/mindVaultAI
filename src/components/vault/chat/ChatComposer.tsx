"use client";

import { ArrowUp, ChevronDown, Paperclip } from "lucide-react";
import type { KeyboardEvent } from "react";

import { cn } from "@/lib/utils";

import { vaultIconShape } from "../vault-controls";

type ChatComposerProps = {
  input: string;
  busy: boolean;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
};

export function ChatComposer({ input, busy, onInputChange, onSubmit }: ChatComposerProps) {
  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
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
          <button
            type="button"
            disabled
            aria-disabled="true"
            title="Document upload coming soon"
            aria-label="Attach file — document upload coming soon"
            className="flex size-9 cursor-not-allowed items-center justify-center rounded-[var(--mv-radius-control)] text-muted-foreground opacity-50"
          >
            <Paperclip aria-hidden className="size-4" />
          </button>

          <div className="relative min-w-[11rem] flex-1 sm:max-w-[14rem]">
            <label htmlFor="chat-mode" className="sr-only">
              Chat mode
            </label>
            <select
              id="chat-mode"
              value="ask"
              onChange={() => {}}
              aria-describedby="chat-mode-agent-hint"
              title="MindVault AI — read-only answers from your saved notes"
              className="h-9 w-full cursor-default appearance-none rounded-[var(--mv-radius-control)] border border-border bg-surface pl-3 pr-8 text-[0.8125rem] font-medium text-foreground outline-none"
            >
              <option value="ask">MindVault AI</option>
              <option value="agent" disabled title="Agent mode can perform multi-step actions across your vault. Coming soon.">
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
        MindVault AI answers from your saved notes and can follow the context of this conversation.
      </p>
    </div>
  );
}
