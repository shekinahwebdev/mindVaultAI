export function countWords(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return 0;
  return trimmed.split(/\s+/).filter(Boolean).length;
}

export function estimateReadMinutes(wordCount: number) {
  return Math.max(1, Math.round(wordCount / 200));
}

export function extractHashtagTags(content: string) {
  const matches = content.match(/#[a-zA-Z0-9_-]+/g);
  if (!matches) return [];
  return [...new Set(matches.map((tag) => tag.slice(1).toLowerCase()))].slice(0, 8);
}

export function splitNoteContent(content: string) {
  const parts = content.split(/\n\s*\n/).map((part) => part.trim()).filter(Boolean);
  if (parts.length <= 1) {
    return { intro: null as string | null, body: content };
  }
  return { intro: parts[0] ?? null, body: parts.slice(1).join("\n\n") };
}

const STAR_KEY_PREFIX = "mv-note-star:";

export function readNoteStarred(noteId: string) {
  if (typeof window === "undefined") return false;
  return window.localStorage.getItem(`${STAR_KEY_PREFIX}${noteId}`) === "1";
}

export function writeNoteStarred(noteId: string, starred: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(`${STAR_KEY_PREFIX}${noteId}`, starred ? "1" : "0");
}
