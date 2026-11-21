"use client";

import { Copy } from "lucide-react";
import { useState } from "react";

import { toastSuccess } from "@/lib/vault-toast";
import { cn } from "@/lib/utils";

type NoteDetailCodeBlockProps = {
  content: string;
  language?: string;
  className?: string;
};

export function NoteDetailCodeBlock({ content, language, className }: NoteDetailCodeBlockProps) {
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(content);
      setCopied(true);
      toastSuccess("Copied to clipboard.");
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-[var(--mv-radius-card)] border border-border bg-mv-panel",
        className,
      )}
    >
      <div className="flex items-center justify-between border-b border-border/80 px-3 py-1.5">
        <span className="text-[0.6875rem] font-medium text-mv-faint">
          {language ? language : "Code"}
        </span>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-0.5 text-[0.6875rem] text-muted-foreground hover:text-foreground"
        >
          <Copy aria-hidden className="size-3" />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="mv-scrollbar max-w-full overflow-x-auto px-3 py-3 font-mono text-sm leading-[1.6] text-foreground/90">
        <code className="block min-w-0 whitespace-pre">{content}</code>
      </pre>
    </div>
  );
}