import {
  AccentColor,
  InterfaceDensity,
  NoteType,
  SearchMode,
  ThemeMode,
  UiFontFamily,
} from "@/generated/prisma/client";
import {
  accentColorFromPrisma,
  interfaceDensityFromPrisma,
  uiFontFromPrisma,
} from "@/lib/settings/appearance-prefs";
import { prisma } from "@/lib/db";
import { EMBEDDING_DIMENSIONS, EMBEDDING_MODEL } from "@/lib/ai/embed-text";
import { findNoteIdsNeedingEmbedding } from "@/lib/notes/embedding-repository";
import { noteSelect, serializeNote } from "@/lib/notes/serialize";
import { serializeUserAvatar } from "@/lib/profile/user-avatar-types";

export type SerializedPreferences = {
  defaultNoteType: string;
  defaultCategoryId: string | null;
  defaultSearchMode: string;
  aiAssistanceEnabled: boolean;
  ragEnabled: boolean;
  reducedMotion: boolean;
  theme: string;
  accentColor: string;
  interfaceDensity: string;
  fontFamily: string;
};

export type SerializedAccount = {
  id: string;
  name: string | null;
  email: string;
  bio: string | null;
  createdAt: string;
  avatarType: string;
  avatarEmoji: string | null;
  avatarBackground: string | null;
  avatarImageUrl: string | null;
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
  theme: true,
  accentColor: true,
  interfaceDensity: true,
  fontFamily: true,
} as const;

export function serializePreferences(
  prefs: {
    defaultNoteType: NoteType;
    defaultCategoryId: string | null;
    defaultSearchMode: SearchMode;
    aiAssistanceEnabled: boolean;
    ragEnabled: boolean;
    reducedMotion: boolean;
    theme: ThemeMode;
    accentColor: AccentColor;
    interfaceDensity: InterfaceDensity;
    fontFamily: UiFontFamily;
  },
): SerializedPreferences {
  return {
    defaultNoteType: prefs.defaultNoteType,
    defaultCategoryId: prefs.defaultCategoryId,
    defaultSearchMode: prefs.defaultSearchMode,
    aiAssistanceEnabled: prefs.aiAssistanceEnabled,
    ragEnabled: prefs.ragEnabled,
    reducedMotion: prefs.reducedMotion,
    theme: prefs.theme,
    accentColor: accentColorFromPrisma(prefs.accentColor),
    interfaceDensity: interfaceDensityFromPrisma(prefs.interfaceDensity),
    fontFamily: uiFontFromPrisma(prefs.fontFamily),
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
          bio: true,
          createdAt: true,
          avatarType: true,
          avatarEmoji: true,
          avatarBackground: true,
          avatarImageUrl: true,
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
      bio: user.bio,
      createdAt: user.createdAt.toISOString(),
      ...serializeUserAvatar(user),
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

export async function updateAccountProfile(
  userId: string,
  data: { name: string; bio: string | null },
) {
  return prisma.user.update({
    where: { id: userId },
    data: { name: data.name, bio: data.bio },
    select: {
      id: true,
      name: true,
      email: true,
      bio: true,
      createdAt: true,
      avatarType: true,
      avatarEmoji: true,
      avatarBackground: true,
      avatarImageUrl: true,
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
    theme?: ThemeMode;
    accentColor?: AccentColor;
    interfaceDensity?: InterfaceDensity;
    fontFamily?: UiFontFamily;
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
