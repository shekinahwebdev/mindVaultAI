import { NoteType, SearchMode } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "@/lib/ai/embed-text";
import { findNoteIdsNeedingEmbedding } from "@/lib/notes/embedding-repository";
import { noteSelect, serializeNote } from "@/lib/notes/serialize";

export type SerializedPreferences = {
  defaultNoteType: string;
  defaultCategoryId: string | null;
  defaultSearchMode: string;
  aiAssistanceEnabled: boolean;
  ragEnabled: boolean;
  reducedMotion: boolean;
};

export type SerializedAccount = {
  id: string;
  name: string | null;
  email: string;
  createdAt: string;
};

export type VaultStorageStats = {
  totalNotes: number;
  totalCategories: number;
  typeCounts: Record<string, number>;
  embeddedNotes: number;
  missingEmbeddings: number;
};

export type SettingsBundle = {
  account: SerializedAccount;
  preferences: SerializedPreferences;
  storage: VaultStorageStats;
};

const defaultPreferencesSelect = {
  defaultNoteType: true,
  defaultCategoryId: true,
  defaultSearchMode: true,
  aiAssistanceEnabled: true,
  ragEnabled: true,
  reducedMotion: true,
} as const;

function serializePreferences(
  prefs: {
    defaultNoteType: NoteType;
    defaultCategoryId: string | null;
    defaultSearchMode: SearchMode;
    aiAssistanceEnabled: boolean;
    ragEnabled: boolean;
    reducedMotion: boolean;
  },
): SerializedPreferences {
  return {
    defaultNoteType: prefs.defaultNoteType,
    defaultCategoryId: prefs.defaultCategoryId,
    defaultSearchMode: prefs.defaultSearchMode,
    aiAssistanceEnabled: prefs.aiAssistanceEnabled,
    ragEnabled: prefs.ragEnabled,
    reducedMotion: prefs.reducedMotion,
  };
}

export async function getOrCreateUserPreferences(userId: string) {
  const existing = await prisma.userPreferences.findUnique({
    where: { userId },
    select: defaultPreferencesSelect,
  });

  if (existing) {
    return existing;
  }

  return prisma.userPreferences.create({
    data: { userId },
    select: defaultPreferencesSelect,
  });
}

export async function getSettingsBundle(userId: string): Promise<SettingsBundle> {
  const [user, preferences, totalNotes, totalCategories, typeCounts, embeddedNotes, missingIds] =
    await Promise.all([
      prisma.user.findUniqueOrThrow({
        where: { id: userId },
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
        },
      }),
      getOrCreateUserPreferences(userId),
      prisma.note.count({ where: { userId } }),
      prisma.category.count({ where: { userId } }),
      prisma.note.groupBy({
        by: ["type"],
        where: { userId },
        _count: { _all: true },
      }),
      prisma.noteEmbedding.count({
        where: { note: { userId } },
      }),
      findNoteIdsNeedingEmbedding(userId, EMBEDDING_MODEL, EMBEDDING_DIMENSIONS),
    ]);

  const typeCountMap = Object.fromEntries(
    typeCounts.map((entry) => [entry.type, entry._count._all]),
  );

  return {
    account: {
      id: user.id,
      name: user.name,
      email: user.email,
      createdAt: user.createdAt.toISOString(),
    },
    preferences: serializePreferences(preferences),
    storage: {
      totalNotes,
      totalCategories,
      typeCounts: typeCountMap,
      embeddedNotes,
      missingEmbeddings: missingIds.length,
    },
  };
}

export async function updateAccountName(userId: string, name: string) {
  return prisma.user.update({
    where: { id: userId },
    data: { name },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
    },
  });
}

export async function updateUserPreferences(
  userId: string,
  data: {
    defaultNoteType?: NoteType;
    defaultCategoryId?: string | null;
    defaultSearchMode?: SearchMode;
    aiAssistanceEnabled?: boolean;
    ragEnabled?: boolean;
    reducedMotion?: boolean;
  },
) {
  await getOrCreateUserPreferences(userId);

  return prisma.userPreferences.update({
    where: { userId },
    data,
    select: defaultPreferencesSelect,
  });
}

export async function exportUserVault(userId: string) {
  const [user, categories, notes] = await Promise.all([
    prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: { email: true, name: true },
    }),
    prisma.category.findMany({
      where: { userId },
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true,
      },
    }),
    prisma.note.findMany({
      where: { userId },
      orderBy: { updatedAt: "desc" },
      select: noteSelect,
    }),
  ]);

  return {
    exportedAt: new Date().toISOString(),
    user: {
      email: user.email,
      name: user.name,
    },
    categories: categories.map((category) => ({
      id: category.id,
      name: category.name,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    })),
    notes: notes.map(serializeNote),
  };
}

export async function deleteUserAccount(userId: string) {
  await prisma.user.delete({ where: { id: userId } });
}
