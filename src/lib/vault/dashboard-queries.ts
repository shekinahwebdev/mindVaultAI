import { prisma } from "@/lib/db";
import { truncateNoteContent } from "@/lib/notes/note-display";

export type DashboardStats = {
  totalNotes: number;
  categories: number;
  links: number;
  quotes: number;
  code: number;
};

export type DashboardNotePreview = {
  id: string;
  title: string;
  type: string;
  categoryName: string | null;
  createdAt: string;
  updatedAt: string;
  preview: string;
};

export type DashboardCategoryPreview = {
  id: string;
  name: string;
  noteCount: number;
};

export type DashboardData = {
  stats: DashboardStats;
  recentNotes: DashboardNotePreview[];
  recentlyEdited: DashboardNotePreview[];
  categories: DashboardCategoryPreview[];
  isEmpty: boolean;
};

const RECENT_NOTES_LIMIT = 5;
const RECENTLY_EDITED_LIMIT = 5;
const CATEGORY_PREVIEW_LIMIT = 6;

const dashboardNotePreviewSelect = {
  id: true,
  title: true,
  type: true,
  content: true,
  createdAt: true,
  updatedAt: true,
  category: {
    select: {
      name: true,
    },
  },
} as const;

function mapNotePreview(
  note: {
    id: string;
    title: string;
    type: string;
    content: string;
    createdAt: Date;
    updatedAt: Date;
    category: { name: string } | null;
  },
): DashboardNotePreview {
  return {
    id: note.id,
    title: note.title,
    type: note.type,
    categoryName: note.category?.name ?? null,
    createdAt: note.createdAt.toISOString(),
    updatedAt: note.updatedAt.toISOString(),
    preview: truncateNoteContent(note.content, 100),
  };
}

function wasEditedAfterCreation(createdAt: Date, updatedAt: Date) {
  return updatedAt.getTime() - createdAt.getTime() > 1000;
}

export async function getDashboardData(userId: string): Promise<DashboardData> {
  const noteWhere = { userId };

  const [
    totalNotes,
    categoryCount,
    typeCounts,
    recentNotesRaw,
    recentlyEditedRaw,
    categoriesRaw,
  ] = await Promise.all([
    prisma.note.count({ where: noteWhere }),
    prisma.category.count({ where: { userId } }),
    prisma.note.groupBy({
      by: ["type"],
      where: noteWhere,
      _count: { _all: true },
    }),
    prisma.note.findMany({
      where: noteWhere,
      orderBy: { createdAt: "desc" },
      take: RECENT_NOTES_LIMIT,
      select: dashboardNotePreviewSelect,
    }),
    prisma.note.findMany({
      where: noteWhere,
      orderBy: { updatedAt: "desc" },
      take: RECENTLY_EDITED_LIMIT,
      select: dashboardNotePreviewSelect,
    }),
    prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      take: CATEGORY_PREVIEW_LIMIT,
      select: {
        id: true,
        name: true,
        _count: {
          select: { notes: true },
        },
      },
    }),
  ]);

  const typeCountMap = Object.fromEntries(
    typeCounts.map((entry) => [entry.type, entry._count._all]),
  );

  const recentlyEdited = recentlyEditedRaw
    .filter((note) => wasEditedAfterCreation(note.createdAt, note.updatedAt))
    .map(mapNotePreview);

  return {
    stats: {
      totalNotes,
      categories: categoryCount,
      links: typeCountMap.LINK ?? 0,
      quotes: typeCountMap.QUOTE ?? 0,
      code: typeCountMap.CODE ?? 0,
    },
    recentNotes: recentNotesRaw.map(mapNotePreview),
    recentlyEdited,
    categories: categoriesRaw.map((category) => ({
      id: category.id,
      name: category.name,
      noteCount: category._count.notes,
    })),
    isEmpty: totalNotes === 0,
  };
}
