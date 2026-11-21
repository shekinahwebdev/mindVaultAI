export type NoteMarkdownBlock =
  | { type: "heading"; level: 1 | 2 | 3 | 4 | 5 | 6; text: string }
  | { type: "paragraph"; text: string }
  | { type: "ordered-list"; items: string[] }
  | { type: "unordered-list"; items: string[] }
  | { type: "blockquote"; text: string }
  | { type: "code"; code: string; language?: string };

export function parseNoteMarkdownBlocks(content: string): NoteMarkdownBlock[] {
  const lines = content.split("\n");
  const blocks: NoteMarkdownBlock[] = [];
  let paragraphLines: string[] = [];
  let orderedItems: string[] = [];
  let unorderedItems: string[] = [];
  let i = 0;

  const flushParagraph = () => {
    const joined = paragraphLines.join(" ").trim();
    if (joined) blocks.push({ type: "paragraph", text: joined });
    paragraphLines = [];
  };

  const flushOrdered = () => {
    if (orderedItems.length > 0) blocks.push({ type: "ordered-list", items: [...orderedItems] });
    orderedItems = [];
  };

  const flushUnordered = () => {
    if (unorderedItems.length > 0) blocks.push({ type: "unordered-list", items: [...unorderedItems] });
    unorderedItems = [];
  };

  const flushLists = () => {
    flushOrdered();
    flushUnordered();
  };

  while (i < lines.length) {
    const rawLine = lines[i] ?? "";
    const trimmed = rawLine.trim();

    if (!trimmed) {
      flushLists();
      flushParagraph();
      i += 1;
      continue;
    }

    const fenceMatch = trimmed.match(/^```(\w+)?\s*$/);
    if (fenceMatch) {
      flushLists();
      flushParagraph();
      const language = fenceMatch[1];
      const codeLines: string[] = [];
      i += 1;
      while (i < lines.length && !/^```\s*$/.test((lines[i] ?? "").trim())) {
        codeLines.push(lines[i] ?? "");
        i += 1;
      }
      if (i < lines.length) i += 1;
      blocks.push({
        type: "code",
        code: codeLines.join("\n"),
        language: language || undefined,
      });
      continue;
    }

    const headingMatch = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      flushLists();
      flushParagraph();
      const level = Math.min(6, headingMatch[1]?.length ?? 1) as 1 | 2 | 3 | 4 | 5 | 6;
      blocks.push({ type: "heading", level, text: headingMatch[2] ?? "" });
      i += 1;
      continue;
    }

    if (/^>\s?/.test(trimmed)) {
      flushLists();
      flushParagraph();
      const quoteLines: string[] = [];
      while (i < lines.length && /^>\s?/.test((lines[i] ?? "").trim())) {
        quoteLines.push((lines[i] ?? "").trim().replace(/^>\s?/, ""));
        i += 1;
      }
      blocks.push({ type: "blockquote", text: quoteLines.join(" ") });
      continue;
    }

    const orderedMatch = trimmed.match(/^\d+\.\s+(.*)$/);
    if (orderedMatch) {
      flushUnordered();
      flushParagraph();
      orderedItems.push(orderedMatch[1] ?? "");
      i += 1;
      continue;
    }

    const unorderedMatch = trimmed.match(/^[-•*]\s+(.*)$/);
    if (unorderedMatch) {
      flushOrdered();
      flushParagraph();
      unorderedItems.push(unorderedMatch[1] ?? "");
      i += 1;
      continue;
    }

    flushLists();
    paragraphLines.push(trimmed);
    i += 1;
  }

  flushLists();
  flushParagraph();
  return blocks;
}

export function splitNoteInlineSegments(text: string): Array<
  | { kind: "text"; value: string }
  | { kind: "link"; label: string; href: string }
  | { kind: "bold"; value: string }
  | { kind: "code"; value: string }
> {
  const segments: Array<
    | { kind: "text"; value: string }
    | { kind: "link"; label: string; href: string }
    | { kind: "bold"; value: string }
    | { kind: "code"; value: string }
  > = [];

  let remaining = text;
  while (remaining.length > 0) {
    const linkMatch = remaining.match(/\[([^\]]+)\]\(([^)]+)\)/);
    const boldMatch = remaining.match(/\*\*([^*]+)\*\*/);
    const codeMatch = remaining.match(/`([^`]+)`/);

    type Candidate = { index: number; len: number; segment: (typeof segments)[number] };
    const candidates: Candidate[] = [];

    if (linkMatch?.index !== undefined) {
      candidates.push({
        index: linkMatch.index,
        len: linkMatch[0].length,
        segment: { kind: "link", label: linkMatch[1] ?? "", href: linkMatch[2] ?? "" },
      });
    }
    if (boldMatch?.index !== undefined) {
      candidates.push({
        index: boldMatch.index,
        len: boldMatch[0].length,
        segment: { kind: "bold", value: boldMatch[1] ?? "" },
      });
    }
    if (codeMatch?.index !== undefined) {
      candidates.push({
        index: codeMatch.index,
        len: codeMatch[0].length,
        segment: { kind: "code", value: codeMatch[1] ?? "" },
      });
    }

    if (candidates.length === 0) {
      segments.push({ kind: "text", value: remaining });
      break;
    }

    candidates.sort((a, b) => a.index - b.index);
    const next = candidates[0]!;
    if (next.index > 0) {
      segments.push({ kind: "text", value: remaining.slice(0, next.index) });
    }
    segments.push(next.segment);
    remaining = remaining.slice(next.index + next.len);
  }

  return segments;
}