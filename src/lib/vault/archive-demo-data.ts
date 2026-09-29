export type ArchivedVaultItem = {
  id: string;
  title: string;
  description: string;
  type: string;
  category: string;
  tags: string[];
  archivedAt: string;
};

function item(
  id: string,
  title: string,
  description: string,
  type: string,
  category: string,
  tags: string[],
  archivedAt: string,
): ArchivedVaultItem {
  return { id, title, description, type, category, tags, archivedAt };
}

/** Preview archive rows until archive APIs ship. */
export const DEMO_ARCHIVED_ITEMS: ArchivedVaultItem[] = [
  item(
    "arch-1",
    "Old Project Ideas",
    "Brainstorm from Q2 planning session",
    "NOTE",
    "Ideas",
    ["startup", "brainstorm"],
    "2026-09-25T14:20:00.000Z",
  ),
  item(
    "arch-2",
    "Legacy API Spec",
    "Deprecated REST endpoints reference",
    "ARTICLE",
    "Work",
    ["api", "docs"],
    "2026-09-24T09:10:00.000Z",
  ),
  item(
    "arch-3",
    "React Hook Snippet",
    "Custom useDebouncedValue helper",
    "CODE",
    "Programming",
    ["react", "hooks"],
    "2026-09-23T18:45:00.000Z",
  ),
  item(
    "arch-4",
    "Morning journal entry",
    "Personal reflection — archived for privacy",
    "NOTE",
    "Personal",
    ["journal"],
    "2026-09-22T07:30:00.000Z",
  ),
  item(
    "arch-5",
    "Meal prep checklist",
    "Weekly health routine",
    "NOTE",
    "Health",
    ["health", "routine"],
    "2026-09-21T12:00:00.000Z",
  ),
  item(
    "arch-6",
    "Pitch deck outline",
    "Slides structure for investor update",
    "ARTICLE",
    "Work",
    ["pitch", "slides"],
    "2026-09-20T16:15:00.000Z",
  ),
  item(
    "arch-7",
    "SQL migration script",
    "One-off category backfill",
    "CODE",
    "Programming",
    ["sql", "migration"],
    "2026-09-19T11:05:00.000Z",
  ),
  item(
    "arch-8",
    "Design moodboard PNG",
    "Exported hero references",
    "OTHER",
    "Design",
    ["design", "assets"],
    "2026-09-18T20:40:00.000Z",
  ),
  item(
    "arch-9",
    "Conference talk notes",
    "Key takeaways from RAG workshop",
    "NOTE",
    "Learning",
    ["rag", "ai"],
    "2026-09-17T15:25:00.000Z",
  ),
  item(
    "arch-10",
    "Bookmark: State of JS",
    "Saved for later reading",
    "LINK",
    "Programming",
    ["javascript", "links"],
    "2026-09-16T10:00:00.000Z",
  ),
  item(
    "arch-11",
    "Quote — Paul Graham",
    "Make something people want",
    "QUOTE",
    "Quotes",
    ["startups"],
    "2026-09-15T08:50:00.000Z",
  ),
  item(
    "arch-12",
    "Sprint retro template",
    "Team retrospective format",
    "ARTICLE",
    "Work",
    ["agile", "template"],
    "2026-09-14T17:30:00.000Z",
  ),
];

export function countArchiveOverview(items: ArchivedVaultItem[]) {
  return {
    total: items.length,
    notes: items.filter((row) => row.type === "NOTE" || row.type === "QUOTE").length,
    documents: items.filter((row) => row.type === "ARTICLE" || row.type === "LINK").length,
    code: items.filter((row) => row.type === "CODE").length,
    files: items.filter((row) => row.type === "OTHER").length,
  };
}
