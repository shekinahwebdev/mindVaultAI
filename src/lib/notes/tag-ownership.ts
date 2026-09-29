import { prisma } from "@/lib/db";

export async function tagIdsBelongToUser(
  tagIds: string[],
  userId: string,
): Promise<boolean> {
  const unique = [...new Set(tagIds)];
  if (unique.length === 0) {
    return true;
  }

  const count = await prisma.tag.count({
    where: {
      userId,
      id: { in: unique },
    },
  });

  return count === unique.length;
}
