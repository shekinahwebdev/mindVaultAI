/** How note body text is stored and should be rendered for reading. */
export type NoteContentFormat = "code" | "quote" | "html" | "markdown" | "plain";

const HTML_LIKE = /^\s*</;
const HTML_CLOSE = /<\/[a-z][\w:-]*>/i;

const MARKDOWN_LINE =
  /^(#{1,6}\s|[-*+]\s|\d+\.\s|>\s|```|!\[.*\]\(.*\)|\[[^\]]+\]\([^)]+\))/m;

export function detectNoteContentFormat(
  content: string,
  type: string,
): NoteContentFormat {
  if (type === "CODE") return "code";
  if (type === "QUOTE") return "quote";

  const trimmed = content.trim();
  if (!trimmed) return "plain";

  if (HTML_LIKE.test(trimmed) && HTML_CLOSE.test(trimmed)) {
    return "html";
  }

  if (MARKDOWN_LINE.test(trimmed) || trimmed.includes("```")) {
    return "markdown";
  }

  return "plain";
}