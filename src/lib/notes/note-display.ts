import { captureNoteTypeOptions } from "@/lib/notes/capture-config";

export const noteTypeLabels = Object.fromEntries(
  captureNoteTypeOptions.map((option) => [option.value, option.label]),
) as Record<string, string>;

export function formatNoteDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  // Fixed locale keeps SSR and client hydration output identical.
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function truncateNoteContent(content: string, maxLength = 160) {
  const normalized = content.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) {
    return normalized;
  }

  return `${normalized.slice(0, maxLength).trimEnd()}…`;
}

export function noteDetailPath(id: string) {
  return `/vault/notes/${id}`;
}
