import { NoteType } from "@/generated/prisma/enums";

export type CaptureTypeMeta = {
  eyebrow: string;
  heading: string;
  lead: string;
  contentLabel: string;
  contentPlaceholder: string;
  titlePlaceholder: string;
  showUrlImport: boolean;
  emphasizeSourceUrl: boolean;
};

export const captureTypeMeta: Record<NoteType, CaptureTypeMeta> = {
  [NoteType.NOTE]: {
    eyebrow: "New note",
    heading: "Write it down",
    lead: "Thoughts, plans, and snippets—capture now, organize when you’re ready.",
    contentLabel: "Note",
    contentPlaceholder:
      "Start typing… ideas, meeting notes, reminders, or anything you want to find later.",
    titlePlaceholder: "Title (optional)",
    showUrlImport: false,
    emphasizeSourceUrl: false,
  },
  [NoteType.LINK]: {
    eyebrow: "Save link",
    heading: "Keep this link",
    lead: "Add context so future-you remembers why it mattered.",
    contentLabel: "Notes about this link",
    contentPlaceholder: "Why save this? Key points, quotes, or a short summary…",
    titlePlaceholder: "Link title",
    showUrlImport: true,
    emphasizeSourceUrl: true,
  },
  [NoteType.QUOTE]: {
    eyebrow: "Save quote",
    heading: "Capture the words",
    lead: "Preserve the quote and where it came from.",
    contentLabel: "Quote",
    contentPlaceholder: "Paste the quote here…",
    titlePlaceholder: "Speaker or source label",
    showUrlImport: false,
    emphasizeSourceUrl: true,
  },
  [NoteType.CODE]: {
    eyebrow: "Save code",
    heading: "Snippet vault",
    lead: "Store code with a label and category for quick retrieval.",
    contentLabel: "Code",
    contentPlaceholder: "Paste your snippet…",
    titlePlaceholder: "Snippet name",
    showUrlImport: false,
    emphasizeSourceUrl: false,
  },
  [NoteType.ARTICLE]: {
    eyebrow: "Save article",
    heading: "Import or paste",
    lead: "Import from a URL or paste the readable text yourself.",
    contentLabel: "Article text",
    contentPlaceholder: "Article body or summary…",
    titlePlaceholder: "Article title",
    showUrlImport: true,
    emphasizeSourceUrl: true,
  },
  [NoteType.OTHER]: {
    eyebrow: "Capture",
    heading: "Save to vault",
    lead: "Anything worth keeping—add a title and category when you can.",
    contentLabel: "Content",
    contentPlaceholder: "Paste an idea, link, code, thought, or anything worth keeping…",
    titlePlaceholder: "Give this capture a name",
    showUrlImport: true,
    emphasizeSourceUrl: false,
  },
};

export function captureMetaForType(type: string): CaptureTypeMeta {
  if (type in captureTypeMeta) {
    return captureTypeMeta[type as NoteType];
  }
  return captureTypeMeta[NoteType.NOTE];
}
