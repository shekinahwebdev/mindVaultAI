import { prisma } from "@/lib/db";

export async function categoryBelongsToUser(
  categoryId: string,
  userId: string,
): Promise<boolean> {
  const category = await prisma.category.findFirst({
    where: {
      id: categoryId,
      userId,
    },
    select: { id: true },
  });

  return category !== null;
}
