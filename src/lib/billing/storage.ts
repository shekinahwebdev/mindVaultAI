import { AvatarType } from "@/generated/prisma/enums";
import { prisma } from "@/lib/db";

/**
 * V1 storage quota tracks uploaded binary data only (not note text in PostgreSQL).
 * Today that means profile avatar data URLs when avatarType is IMAGE.
 */
export function estimateDataUrlBytes(dataUrl: string): number {
  const comma = dataUrl.indexOf(",");
  if (comma === -1) {
    return 0;
  }
  const payload = dataUrl.slice(comma + 1);
  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
  return Math.max(0, Math.floor((payload.length * 3) / 4) - padding);
}

export async function getUserStorageUsageBytes(userId: string): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { avatarType: true, avatarImageUrl: true },
  });

  if (!user) {
    return 0;
  }

  if (
    user.avatarType === AvatarType.IMAGE &&
    user.avatarImageUrl?.startsWith("data:")
  ) {
    return estimateDataUrlBytes(user.avatarImageUrl);
  }

  return 0;
}
