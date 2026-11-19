"use client";

import Link from "next/link";
import { createElement, Fragment } from "react";

import { detectNoteContentFormat } from "@/lib/notes/note-content-format";
import {
  parseNoteMarkdownBlocks,
  splitNoteInlineSegments,
} from "@/lib/notes/render-note-markdown";
import { sanitizeNoteHtml } from "@/lib/notes/sanitize-note-html";
import { cn } from "@/lib/utils";

import { noteProseClassName } from "./note-detail-ui";

import { NoteDetailCodeBlock } from "./NoteDetailCodeBlock";

type NoteContentRendererProps = {
  content: string;
  type: string;
  className?: string;
};

export function NoteContentRenderer({ content, type, className }: NoteContentRendererProps) {
  const format = detectNoteContentFormat(content, type);

  if (format === "code") {
    return <NoteDetailCodeBlock content={content} className={className} />;
  }

  if (format === "quote") {
    return (
      <blockquote
        className={cn(
          noteProseClassName,
          "rounded-[var(--mv-radius-card)] border border-border border-l-2 border-l-foreground/25 bg-mv-panel/40 px-4 py-3.5 italic",
          className,
        )}
      >
        <PlainTextBody content={content} />
      </blockquote>
    );
  }

  if (format === "html") {
    const safe = sanitizeNoteHtml(content);
    return (
      <div
        className={cn(noteProseClassName, "note-prose-html", className)}
        dangerouslySetInnerHTML={{ __html: safe }}
      />
    );
  }

  if (format === "markdown") {
    return <MarkdownBody content={content} className={className} />;
  }

  return <PlainTextBody content={content} className={className} />;
}

function PlainTextBody({ content, className }: { content: string; className?: string }) {
  const paragraphs = splitPlainTextParagraphs(content);

  return (
    <div className={cn(noteProseClassName, className)}>
      {paragraphs.map((paragraph, index) =>
        paragraph === "" ? (
          <div key={index} className="mb-3 last:mb-0" aria-hidden />
        ) : (
          <p key={index} className="mb-3 whitespace-pre-wrap break-words last:mb-0">
            {paragraph}
          </p>
        ),
      )}
    </div>
  );
}

/** Preserve `\n\n` as paragraph breaks without an extra blank pre-wrap line (tighter reading rhythm). */
function splitPlainTextParagraphs(content: string): string[] {
  if (!content.includes("\n\n")) {
    return [content];
  }
  const parts = content.split(/\n\n/);
  return parts.length > 0 ? parts : [content];
}

function MarkdownBody({ content, className }: { content: string; className?: string }) {
  const blocks = parseNoteMarkdownBlocks(content);

  if (blocks.length === 0) {
    return <PlainTextBody content={content} className={className} />;
  }

  return (
    <div className={cn(noteProseClassName, className)}>
      {blocks.map((block, index) => {
        if (block.type === "heading") {
          const size =
            block.level === 1
              ? "text-[1.5rem]"
              : block.level === 2
                ? "text-[1.375rem]"
                : block.level === 3
                  ? "text-[1.125rem]"
                  : "text-base font-semibold";
          return createElement(
            `h${block.level}`,
            {
              key: index,
              className: cn(
                block.level <= 3
                  ? "font-serif font-medium leading-snug tracking-tight text-foreground"
                  : "text-foreground",
                size,
                block.level === 2 && "mt-5 first:mt-0",
                block.level === 3 && "mt-4 first:mt-0",
              ),
            },
            <InlineMarks text={block.text} />,
          );
        }

        if (block.type === "paragraph") {
          return (
            <p key={index} className="mb-3 last:mb-0">
              <InlineMarks text={block.text} />
            </p>
          );
        }

        if (block.type === "blockquote") {
          return (
            <blockquote
              key={index}
              className="border-l-2 border-border pl-4 text-foreground/85 italic"
            >
              <InlineMarks text={block.text} />
            </blockquote>
          );
        }

        if (block.type === "code") {
          return <NoteDetailCodeBlock key={index} content={block.code} language={block.language} />;
        }

        if (block.type === "ordered-list") {
          return (
            <ol key={index} className="mb-3 list-decimal space-y-1 pl-5 marker:text-muted-foreground">
              {block.items.map((item, itemIndex) => (
                <li key={itemIndex} className="pl-0.5">
                  <InlineMarks text={item} />
                </li>
              ))}
            </ol>
          );
        }

        return (
          <ul key={index} className="mb-3 list-disc space-y-1 pl-5 marker:text-muted-foreground">
            {block.items.map((item, itemIndex) => (
              <li key={itemIndex} className="pl-0.5">
                <InlineMarks text={item} />
              </li>
            ))}
          </ul>
        );
      })}
    </div>
  );
}

function InlineMarks({ text }: { text: string }) {
  const segments = splitNoteInlineSegments(text);
  return (
    <>
      {segments.map((segment, index) => {
        if (segment.kind === "text") {
          return <Fragment key={index}>{segment.value}</Fragment>;
        }
        if (segment.kind === "bold") {
          return (
            <strong key={index} className="font-semibold text-foreground">
              {segment.value}
            </strong>
          );
        }
        if (segment.kind === "code") {
          return (
            <code
              key={index}
              className="rounded-md border border-border bg-mv-panel px-1 py-0.5 font-mono text-[0.875em] text-foreground"
            >
              {segment.value}
            </code>
          );
        }
        const href = segment.href;
        const external = /^https?:\/\//i.test(href);
        if (external) {
          return (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-foreground underline decoration-border underline-offset-2 hover:decoration-foreground/40"
            >
              {segment.label}
            </a>
          );
        }
        return (
          <Link
            key={index}
            href={href}
            className="break-all text-foreground underline decoration-border underline-offset-2 hover:decoration-foreground/40"
          >
            {segment.label}
          </Link>
        );
      })}
    </>
  );
}