import "server-only";

import { AvatarType } from "@/generated/prisma/enums";
import type { SessionData } from "@/lib/auth/session";
import { prisma } from "@/lib/db";

import { isAvatarBackgroundKey } from "./avatar-validation";
import type { UpdateAvatarPayload } from "./avatar-validation";
import type { UserAvatarProfile } from "./user-avatar-types";

const avatarSelect = {
  avatarType: true,
  avatarEmoji: true,
  avatarBackground: true,
  avatarImageUrl: true,
} as const;

function normalizeAvatarProfile(user: UserAvatarProfile): UserAvatarProfile {
  const background =
    user.avatarBackground && isAvatarBackgroundKey(user.avatarBackground)
      ? user.avatarBackground
      : null;

  return {
    avatarType: user.avatarType,
    avatarEmoji: user.avatarEmoji,
    avatarBackground: background,
    avatarImageUrl: user.avatarImageUrl,
  };
}

export async function getUserAvatarProfile(userId: string): Promise<UserAvatarProfile> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: avatarSelect,
  });

  return normalizeAvatarProfile(user);
}

/** Merge DB avatar fields into the signed session for vault UI. */
export async function enrichSessionWithAvatar(session: SessionData): Promise<SessionData> {
  const profile = await getUserAvatarProfile(session.userId);
  return {
    ...session,
    avatarType: profile.avatarType,
    avatarEmoji: profile.avatarEmoji,
    avatarBackground: profile.avatarBackground,
    avatarImageUrl: profile.avatarImageUrl,
  };
}

export async function updateUserAvatar(userId: string, payload: UpdateAvatarPayload) {
  if (payload.avatarType === AvatarType.INITIALS) {
    return prisma.user.update({
      where: { id: userId },
      data: {
        avatarType: AvatarType.INITIALS,
        avatarEmoji: null,
        avatarBackground: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
        ...avatarSelect,
      },
    });
  }

  return prisma.user.update({
    where: { id: userId },
    data: {
      avatarType: AvatarType.EMOJI,
      avatarEmoji: payload.avatarEmoji,
      avatarBackground: payload.avatarBackground,
    },
    select: {
      id: true,
      name: true,
      email: true,
      createdAt: true,
      ...avatarSelect,
    },
  });
}
