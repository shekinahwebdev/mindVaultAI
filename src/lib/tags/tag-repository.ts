import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";

import {
  TAG_DUPLICATE_MESSAGE,
  TAG_NOT_FOUND_MESSAGE,
  TAG_SERVER_ERROR_MESSAGE,
  type TagErrorCode,
  type TagNameFieldErrors,
} from "./tag-errors";
import {
  normalizeTagFields,
  normalizeTagDisplayName,
  normalizeTagName,
} from "./tag-normalization";
import { validateTagName } from "./tag-validation";
import { serializeTag, tagSelect, type SerializedTag } from "./serialize";

export type TagSortOption =
  | "most_used"
  | "least_used"
  | "name_asc"
  | "name_desc"
  | "newest";

export type TagUsageFilter = "all" | "used" | "unused";

export type ListTagsForUserOptions = {
  search?: string;
  sort?: TagSortOption;
  filter?: TagUsageFilter;
};

export type TagStats = {
  totalTags: number;
  unusedTags: number;
  mostUsedTag: {
    id: string;
    name: string;
    noteCount: number;
  } | null;
};

type TagMutationFailure = {
  ok: false;
  code: TagErrorCode;
  errors?: TagNameFieldErrors;
  message?: string;
};

type TagMutationSuccess<T> = {
  ok: true;
  tag: T;
};

export type CreateTagResult = TagMutationSuccess<SerializedTag> | TagMutationFailure;
export type RenameTagResult = TagMutationSuccess<SerializedTag> | TagMutationFailure;
export type DeleteTagResult =
  | { ok: true }
  | { ok: false; code: Extract<TagErrorCode, "tag_not_found" | "server_error">; message?: string };

function isUniqueViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002"
  );
}

function buildListWhere(
  userId: string,
  options: ListTagsForUserOptions,
): Prisma.TagWhereInput {
  const filter = options.filter ?? "all";
  const query = options.search?.trim();

  const where: Prisma.TagWhereInput = { userId };

  if (filter === "used") {
    where.noteTags = { some: { note: { archivedAt: null } } };
  } else if (filter === "unused") {
    where.noteTags = { none: { note: { archivedAt: null } } };
  }

  if (query) {
    const normalizedQuery = normalizeTagName(query);
    where.OR = [
      { name: { contains: query, mode: "insensitive" } },
      ...(normalizedQuery
        ? [{ normalizedName: { contains: normalizedQuery } }]
        : []),
    ];
  }

  return where;
}

export async function findDuplicateTagForUser(
  userId: string,
  normalizedName: string,
  excludeTagId?: string,
): Promise<{ id: string } | null> {
  return prisma.tag.findFirst({
    where: {
      userId,
      normalizedName,
      ...(excludeTagId ? { id: { not: excludeTagId } } : {}),
    },
    select: { id: true },
  });
}

function sortSerializedTags(
  tags: SerializedTag[],
  sort: TagSortOption,
): SerializedTag[] {
  const next = [...tags];
  switch (sort) {
    case "most_used":
      next.sort(
        (a, b) => b.noteCount - a.noteCount || a.name.localeCompare(b.name),
      );
      return next;
    case "least_used":
      next.sort(
        (a, b) => a.noteCount - b.noteCount || a.name.localeCompare(b.name),
      );
      return next;
    case "name_desc":
      next.sort((a, b) => b.name.localeCompare(a.name));
      return next;
    case "newest":
      next.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      return next;
    case "name_asc":
    default:
      next.sort((a, b) => a.name.localeCompare(b.name));
      return next;
  }
}

export async function listTagsForUser(
  userId: string,
  options: ListTagsForUserOptions = {},
): Promise<SerializedTag[]> {
  const sort = options.sort ?? "most_used";
  const tags = await prisma.tag.findMany({
    where: buildListWhere(userId, options),
    orderBy: sort === "newest" ? [{ createdAt: "desc" }] : [{ name: "asc" }],
    select: tagSelect,
  });

  return sortSerializedTags(tags.map(serializeTag), sort);
}

export async function findTagForUser(
  userId: string,
  tagId: string,
): Promise<SerializedTag | null> {
  const tag = await prisma.tag.findFirst({
    where: { id: tagId, userId },
    select: tagSelect,
  });

  return tag ? serializeTag(tag) : null;
}

export async function createTagForUser(
  userId: string,
  rawName: string,
): Promise<CreateTagResult> {
  const nameError = validateTagName(rawName);
  if (nameError) {
    return {
      ok: false,
      code: "invalid_input",
      errors: { name: nameError },
    };
  }

  const { name, normalizedName } = normalizeTagFields(rawName);

  const duplicate = await findDuplicateTagForUser(userId, normalizedName);
  if (duplicate) {
    return {
      ok: false,
      code: "duplicate_tag",
      errors: { name: TAG_DUPLICATE_MESSAGE },
    };
  }

  try {
    const tag = await prisma.tag.create({
      data: {
        userId,
        name,
        normalizedName,
      },
      select: tagSelect,
    });

    return { ok: true, tag: serializeTag(tag) };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        code: "duplicate_tag",
        errors: { name: TAG_DUPLICATE_MESSAGE },
      };
    }

    console.error("createTagForUser failed:", error);
    return {
      ok: false,
      code: "server_error",
      message: TAG_SERVER_ERROR_MESSAGE,
    };
  }
}

export async function renameTagForUser(
  userId: string,
  tagId: string,
  rawName: string,
): Promise<RenameTagResult> {
  const nameError = validateTagName(rawName);
  if (nameError) {
    return {
      ok: false,
      code: "invalid_input",
      errors: { name: nameError },
    };
  }

  const existing = await prisma.tag.findFirst({
    where: { id: tagId, userId },
    select: { id: true },
  });

  if (!existing) {
    return {
      ok: false,
      code: "tag_not_found",
      message: TAG_NOT_FOUND_MESSAGE,
    };
  }

  const { name, normalizedName } = normalizeTagFields(rawName);

  const duplicate = await findDuplicateTagForUser(
    userId,
    normalizedName,
    tagId,
  );
  if (duplicate) {
    return {
      ok: false,
      code: "duplicate_tag",
      errors: { name: TAG_DUPLICATE_MESSAGE },
    };
  }

  try {
    const tag = await prisma.tag.update({
      where: { id: existing.id },
      data: { name, normalizedName },
      select: tagSelect,
    });

    return { ok: true, tag: serializeTag(tag) };
  } catch (error) {
    if (isUniqueViolation(error)) {
      return {
        ok: false,
        code: "duplicate_tag",
        errors: { name: TAG_DUPLICATE_MESSAGE },
      };
    }

    console.error("renameTagForUser failed:", error);
    return {
      ok: false,
      code: "server_error",
      message: TAG_SERVER_ERROR_MESSAGE,
    };
  }
}

export async function deleteTagForUser(
  userId: string,
  tagId: string,
): Promise<DeleteTagResult> {
  const existing = await prisma.tag.findFirst({
    where: { id: tagId, userId },
    select: { id: true },
  });

  if (!existing) {
    return {
      ok: false,
      code: "tag_not_found",
      message: TAG_NOT_FOUND_MESSAGE,
    };
  }

  try {
    await prisma.tag.delete({ where: { id: existing.id } });
    return { ok: true };
  } catch (error) {
    console.error("deleteTagForUser failed:", error);
    return {
      ok: false,
      code: "server_error",
      message: TAG_SERVER_ERROR_MESSAGE,
    };
  }
}

export async function getTagStatsForUser(userId: string): Promise<TagStats> {
  const [totalTags, unusedTags, tagsForRank] = await Promise.all([
    prisma.tag.count({ where: { userId } }),
    prisma.tag.count({
      where: {
        userId,
        noteTags: { none: { note: { archivedAt: null } } },
      },
    }),
    prisma.tag.findMany({
      where: { userId },
      select: tagSelect,
    }),
  ]);

  const ranked = sortSerializedTags(
    tagsForRank.map(serializeTag),
    "most_used",
  );
  const top = ranked[0];

  return {
    totalTags,
    unusedTags,
    mostUsedTag: top
      ? {
          id: top.id,
          name: top.name,
          noteCount: top.noteCount,
        }
      : null,
  };
}

/**
 * Top tags by note usage (desc), then name (asc) for ties.
 * Includes zero-count tags when they rank within the limit (e.g. user has ≤ limit tags).
 */
export async function getTopTagsForUser(
  userId: string,
  limit = 5,
): Promise<Array<{ id: string; name: string; noteCount: number }>> {
  const tags = await prisma.tag.findMany({
    where: { userId },
    select: tagSelect,
  });

  return sortSerializedTags(tags.map(serializeTag), "most_used")
    .slice(0, limit)
    .map((tag) => ({
      id: tag.id,
      name: tag.name,
      noteCount: tag.noteCount,
    }));
}
