import { prisma } from "@/lib/db";
import { normalizeCategoryName } from "@/lib/category-validation";

export async function findDuplicateCategoryName(
  userId: string,
  name: string,
  excludeCategoryId?: string,
) {
  const normalizedName = normalizeCategoryName(name);

  return prisma.category.findFirst({
    where: {
      userId,
      ...(excludeCategoryId ? { id: { not: excludeCategoryId } } : {}),
      name: {
        equals: normalizedName,
        mode: "insensitive",
      },
    },
    select: { id: true },
  });
}
