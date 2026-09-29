import { prisma } from "@/lib/db";

import { TAG_NAMES_FOR_AI_CAP } from "@/lib/ai/analyze-tag-suggestions";
import { normalizeTagFields } from "./tag-normalization";

export type TagForAnalysis = {
  id: string;
  name: string;
  normalizedName: string;
};

/**
 * Supplies tag names for Gemini: highest usage first, then alphabetical,
 * capped so prompts stay bounded for large vaults.
 */
export async function getTagsForNoteAnalysis(
  userId: string,
  limit = TAG_NAMES_FOR_AI_CAP,
): Promise<TagForAnalysis[]> {
  const tags = await prisma.tag.findMany({
    where: { userId },
    orderBy: [{ noteTags: { _count: "desc" } }, { name: "asc" }],
    take: limit,
    select: {
      id: true,
      name: true,
    },
  });

  return tags.map((tag) => {
    const { name, normalizedName } = normalizeTagFields(tag.name);
    return { id: tag.id, name, normalizedName };
  });
}
