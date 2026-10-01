import { AvatarType } from "@/generated/prisma/enums";
import type { SessionData } from "@/lib/auth/session";
import { getVaultInitials } from "@/lib/vault/user-display";

import { DEFAULT_AVATAR_BACKGROUND, type AvatarBackgroundKey } from "./avatar-config";
import { isAvatarBackgroundKey } from "./avatar-validation";
import type { SerializedUserAvatar } from "./user-avatar-types";

export type ResolvedUserAvatar = {
  mode: "initials" | "emoji" | "image";
  initials: string;
  emoji?: string;
  backgroundKey?: AvatarBackgroundKey;
  imageUrl?: string | null;
};

export function resolveUserAvatar(
  session: SessionData,
  overrides?: Partial<SerializedUserAvatar>,
): ResolvedUserAvatar {
  const initials = getVaultInitials(session);
  const avatarType = overrides?.avatarType ?? session.avatarType ?? AvatarType.INITIALS;
  const avatarEmoji = overrides?.avatarEmoji ?? session.avatarEmoji ?? null;
  const avatarBackgroundRaw =
    overrides?.avatarBackground ?? session.avatarBackground ?? null;
  const avatarBackground =
    avatarBackgroundRaw && isAvatarBackgroundKey(avatarBackgroundRaw)
      ? avatarBackgroundRaw
      : DEFAULT_AVATAR_BACKGROUND;
  const avatarImageUrl = overrides?.avatarImageUrl ?? session.avatarImageUrl ?? null;

  if (avatarType === AvatarType.EMOJI && avatarEmoji) {
    return {
      mode: "emoji",
      initials,
      emoji: avatarEmoji,
      backgroundKey: avatarBackground,
    };
  }

  if (avatarType === AvatarType.IMAGE && avatarImageUrl) {
    return {
      mode: "image",
      initials,
      imageUrl: avatarImageUrl,
    };
  }

  return { mode: "initials", initials };
}
