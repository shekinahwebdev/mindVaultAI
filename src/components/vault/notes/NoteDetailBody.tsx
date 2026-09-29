"use client";

import { Copy, Lightbulb } from "lucide-react";
import { useState } from "react";

import { splitNoteContent } from "@/lib/notes/note-detail-utils";
import { toastSuccess } from "@/lib/vault-toast";
import { cn } from "@/lib/utils";

type NoteDetailBodyProps = {
  content: string;
  type: string;
};

export function NoteDetailBody({ content, type }: NoteDetailBodyProps) {
  if (type === "CODE") {
    return <CodeBlock content={content} />;
  }

  if (type === "QUOTE") {
    return (
      <blockquote className="rounded-[var(--mv-radius-card)] border border-border border-l-2 border-l-foreground/25 bg-mv-panel/40 px-5 py-4 text-[1rem] leading-relaxed italic text-foreground/90">
        {content}
      </blockquote>
    );
  }

  const { intro, body } = splitNoteContent(content);

  return (
    <div className="space-y-6">
      {intro ? (
        <section>
          <h2 className="text-[0.8125rem] font-semibold uppercase tracking-[0.04em] text-muted-foreground">
            Introduction
          </h2>
          <p className="mt-2 text-[0.9375rem] leading-relaxed text-foreground/90">{intro}</p>
        </section>
      ) : null}

      {intro && body.includes("insight") ? (
        <div className="flex gap-3 rounded-[var(--mv-radius-card)] border border-amber-500/20 bg-amber-500/[0.06] px-4 py-3.5">
          <Lightbulb aria-hidden className="size-5 shrink-0 text-amber-500/90" />
          <p className="text-[0.875rem] leading-relaxed text-foreground/85">
            Key insight from your note — refine capture templates to surface callouts automatically.
          </p>
        </div>
      ) : null}

      <section className="prose-note text-[0.9375rem] leading-[1.75] whitespace-pre-wrap text-foreground/88">
        {body || content}
      </section>
    </div>
  );
}

function CodeBlock({ content }: { content: string }) {
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
    <div className="relative overflow-hidden rounded-[var(--mv-radius-card)] border border-border bg-[#0a0a0a]">
      <div className="flex items-center justify-between border-b border-border/80 px-4 py-2">
        <span className="text-[0.6875rem] font-medium text-mv-faint">Code</span>
        <button
          type="button"
          onClick={() => void handleCopy()}
          className="inline-flex items-center gap-1.5 rounded-md border border-border px-2 py-1 text-[0.6875rem] text-muted-foreground hover:text-foreground"
        >
          <Copy aria-hidden className="size-3" />
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        className={cn(
          "overflow-x-auto px-4 py-4 font-mono text-[0.8125rem] leading-relaxed text-emerald-100/90",
        )}
      >
        {content}
      </pre>
    </div>
  );
}
