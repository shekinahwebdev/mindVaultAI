"use client";

import { ChevronRight, File, FileText, Link2, MoreHorizontal } from "lucide-react";
import Link from "next/link";

import type { SerializedNote } from "@/lib/notes/capture-client";
import { countWords, estimateReadMinutes } from "@/lib/notes/note-detail-utils";
import { NoteTagBadges } from "@/components/vault/tags/NoteTagBadges";
import { formatNoteDate, noteDetailPath, noteTypeLabels } from "@/lib/notes/note-display";
type NoteDetailMetaSidebarProps = {
  note: SerializedNote;
  relatedNotes: SerializedNote[];
};

export function NoteDetailMetaSidebar({ note, relatedNotes }: NoteDetailMetaSidebarProps) {
  const words = countWords(note.content);
  const readMin = estimateReadMinutes(words);
  const typeLabel = noteTypeLabels[note.type] ?? note.type;

  return (
    <aside className="hidden h-full min-h-0 w-[17.5rem] shrink-0 flex-col overflow-y-auto border-l border-border bg-surface p-4 xl:flex">
      <MetaSection title="Note details">
        <MetaRow label="Type" value={typeLabel} />
        <MetaRow label="Created" value={formatNoteDate(note.createdAt)} />
        <MetaRow label="Updated" value={formatNoteDate(note.updatedAt)} />
        <MetaRow label="Word count" value={`${words.toLocaleString()} words`} />
        <MetaRow label="Read time" value={`${readMin} min read`} />
        <MetaRow label="Language" value="English" />
      </MetaSection>

      <MetaSection title="Categories & tags">
        <div className="flex flex-wrap gap-1.5">
          {note.category ? (
            <span className="rounded-full border border-border bg-mv-panel px-2.5 py-0.5 text-[0.6875rem] text-foreground">
              {note.category.name}
            </span>
          ) : (
            <span className="text-[0.8125rem] text-muted-foreground">Uncategorized</span>
          )}
        </div>
        <div className="mt-2">
          {note.tags.length > 0 ? (
            <NoteTagBadges tags={note.tags} />
          ) : (
            <span className="text-[0.8125rem] text-muted-foreground">No tags</span>
          )}
        </div>
      </MetaSection>

      <MetaSection title="Related notes">
        {relatedNotes.length === 0 ? (
          <p className="text-[0.8125rem] text-muted-foreground">No related notes yet.</p>
        ) : (
          <ul className="space-y-2">
            {relatedNotes.map((item) => (
              <li key={item.id}>
                <Link
                  href={noteDetailPath(item.id)}
                  className="group flex items-start gap-2 rounded-[var(--mv-radius-control)] border border-border bg-mv-panel/30 px-2.5 py-2 transition-colors hover:bg-mv-panel/70"
                >
                  <FileText aria-hidden className="mt-0.5 size-3.5 text-muted-foreground" />
                  <span className="min-w-0 flex-1">
                    <span className="line-clamp-2 text-[0.8125rem] font-medium text-foreground">
                      {item.title}
                    </span>
                    <span className="text-[0.6875rem] text-mv-faint">
                      {formatNoteDate(item.updatedAt)}
                    </span>
                  </span>
                  <ChevronRight
                    aria-hidden
                    className="size-3.5 shrink-0 text-mv-faint opacity-0 transition-opacity group-hover:opacity-100"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </MetaSection>

      <MetaSection title="Backlinks">
        <p className="text-[0.8125rem] text-muted-foreground">
          Backlinks appear when other notes link here (coming soon).
        </p>
      </MetaSection>

      <MetaSection title="Attachments">
        <ul className="space-y-2">
          {note.sourceUrl ? (
            <AttachmentRow icon={Link2} name={linkLabel(note.sourceUrl)} meta="Link" />
          ) : null}
          {note.type === "CODE" ? (
            <AttachmentRow icon={File} name="snippet.dart" meta="Source file" />
          ) : null}
          {!note.sourceUrl && note.type !== "CODE" ? (
            <li className="text-[0.8125rem] text-muted-foreground">No attachments</li>
          ) : null}
        </ul>
      </MetaSection>
    </aside>
  );
}

function linkLabel(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function MetaSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-5 border-b border-border/80 pb-5 last:border-b-0">
      <h2 className="text-[0.8125rem] font-semibold text-foreground">{title}</h2>
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 text-[0.8125rem]">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-foreground">{value}</span>
    </div>
  );
}

function AttachmentRow({
  icon: Icon,
  name,
  meta,
}: {
  icon: typeof File;
  name: string;
  meta: string;
}) {
  return (
    <li className="flex items-center gap-2 rounded-[var(--mv-radius-control)] border border-border bg-mv-panel/30 px-2.5 py-2">
      <Icon aria-hidden className="size-4 shrink-0 text-muted-foreground" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[0.8125rem] font-medium text-foreground">{name}</p>
        <p className="text-[0.6875rem] text-mv-faint">{meta}</p>
      </div>
      <button type="button" aria-label="Attachment options" className="text-mv-faint">
        <MoreHorizontal aria-hidden className="size-4" />
      </button>
    </li>
  );
}
