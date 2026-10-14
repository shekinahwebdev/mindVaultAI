export type AssistantAnswerBlock =
  | { type: "paragraph"; text: string }
  | { type: "ordered-list"; items: string[] }
  | { type: "unordered-list"; items: string[] };

/** Removes common inline markdown for plain-text fallbacks (copy, summaries). */
export function stripAssistantMarkdown(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/__(.+?)__/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/^#{1,6}\s+/gm, "");
}

export function parseAssistantAnswerBlocks(text: string): AssistantAnswerBlock[] {
  const lines = text.split("\n");
  const blocks: AssistantAnswerBlock[] = [];
  let paragraphLines: string[] = [];
  let orderedItems: string[] = [];
  let unorderedItems: string[] = [];

  const flushParagraph = () => {
    const joined = paragraphLines.join(" ").trim();
    if (joined) {
      blocks.push({ type: "paragraph", text: joined });
    }
    paragraphLines = [];
  };

  const flushOrdered = () => {
    if (orderedItems.length > 0) {
      blocks.push({ type: "ordered-list", items: [...orderedItems] });
    }
    orderedItems = [];
  };

  const flushUnordered = () => {
    if (unorderedItems.length > 0) {
      blocks.push({ type: "unordered-list", items: [...unorderedItems] });
    }
    unorderedItems = [];
  };

  const flushLists = () => {
    flushOrdered();
    flushUnordered();
  };

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed) {
      flushLists();
      flushParagraph();
      continue;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      flushUnordered();
      flushParagraph();
      orderedItems.push(orderedMatch[1] ?? "");
      continue;
    }

    const unorderedMatch = trimmed.match(/^[-•*]\s+(.*)$/);
    if (unorderedMatch) {
      flushOrdered();
      flushParagraph();
      unorderedItems.push(unorderedMatch[1] ?? "");
      continue;
    }

    if (/^\s{2,}/.test(rawLine) && orderedItems.length > 0) {
      const last = orderedItems.length - 1;
      orderedItems[last] = `${orderedItems[last] ?? ""} ${trimmed}`.trim();
      continue;
    }

    flushLists();
    paragraphLines.push(trimmed);
  }

  flushLists();
  flushParagraph();
  return blocks;
}
