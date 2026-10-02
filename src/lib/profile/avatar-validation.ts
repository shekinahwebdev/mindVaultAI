import { AvatarType } from "@/generated/prisma/enums";

import {
  APPROVED_AVATAR_EMOJIS,
  AVATAR_BACKGROUND_KEYS,
  type AvatarBackgroundKey,
} from "./avatar-config";

export type UpdateAvatarPayload =
  | { avatarType: typeof AvatarType.INITIALS }
  | {
      avatarType: typeof AvatarType.EMOJI;
      avatarEmoji: string;
      avatarBackground: AvatarBackgroundKey;
    };

export function isAvatarBackgroundKey(value: string): value is AvatarBackgroundKey {
  return (AVATAR_BACKGROUND_KEYS as readonly string[]).includes(value);
}

export function isApprovedAvatarEmoji(value: string): boolean {
  return APPROVED_AVATAR_EMOJIS.includes(value);
}

export function parseUpdateAvatarBody(body: unknown):
  | { success: true; data: UpdateAvatarPayload }
  | { success: false; message: string } {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return { success: false, message: "Invalid request." };
  }

  const record = body as Record<string, unknown>;
  const avatarType = record.avatarType;

  if (avatarType === AvatarType.INITIALS) {
    return { success: true, data: { avatarType: AvatarType.INITIALS } };
  }

  if (avatarType === AvatarType.EMOJI) {
    const avatarEmoji =
      typeof record.avatarEmoji === "string" ? record.avatarEmoji.trim() : "";
    const avatarBackground =
      typeof record.avatarBackground === "string" ? record.avatarBackground.trim() : "";

    if (!isApprovedAvatarEmoji(avatarEmoji)) {
      return { success: false, message: "Choose an emoji from the list." };
    }

    if (!isAvatarBackgroundKey(avatarBackground)) {
      return { success: false, message: "Choose a background color." };
    }

    return {
      success: true,
      data: {
        avatarType: AvatarType.EMOJI,
        avatarEmoji,
        avatarBackground,
      },
    };
  }

  if (avatarType === AvatarType.IMAGE) {
    return { success: false, message: "Photo upload is not available yet." };
  }

  return { success: false, message: "Invalid avatar type." };
}
